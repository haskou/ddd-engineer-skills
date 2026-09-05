import { createHash } from 'node:crypto';
import {
  access,
  cp,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

export const MANIFEST_FILE = '.ddd-engineer-skills.json';

export function getTargetRoot({ cwd, home, global }) {
  return global
    ? path.join(home, '.agents', 'skills')
    : path.join(cwd, '.agents', 'skills');
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function listAvailableSkills(sourceRoot) {
  const entries = await readdir(sourceRoot, { withFileTypes: true });
  const names = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (await exists(path.join(sourceRoot, entry.name, 'SKILL.md'))) {
      names.push(entry.name);
    }
  }

  return names.sort();
}

async function walkFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkFiles(root, absolute));
    } else if (entry.isFile()) {
      files.push(absolute);
    }
  }

  return files;
}

async function hashDirectory(root) {
  const hash = createHash('sha256');
  const files = await walkFiles(root);

  for (const file of files) {
    const relative = path.relative(root, file).split(path.sep).join('/');
    const executable = ((await stat(file)).mode & 0o111) !== 0;
    hash.update(relative);
    hash.update('\0');
    hash.update(executable ? 'x' : '-');
    hash.update('\0');
    hash.update(await readFile(file));
    hash.update('\0');
  }

  return `sha256:${hash.digest('hex')}`;
}

function emptyManifest() {
  return {
    schemaVersion: 1,
    package: '@haskou/ddd-engineer-skills',
    skills: {},
  };
}

async function readManifest(targetRoot) {
  const manifestPath = path.join(targetRoot, MANIFEST_FILE);
  if (!await exists(manifestPath)) return emptyManifest();

  const parsed = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (parsed?.schemaVersion !== 1 || typeof parsed.skills !== 'object' || parsed.skills === null) {
    throw new Error(`Unsupported or invalid manifest: ${manifestPath}`);
  }

  return parsed;
}

async function writeManifest(targetRoot, manifest) {
  await mkdir(targetRoot, { recursive: true });
  const manifestPath = path.join(targetRoot, MANIFEST_FILE);
  const temporaryPath = `${manifestPath}.tmp`;

  await writeFile(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, manifestPath);
}

function replacementPaths(destination) {
  const parent = path.dirname(destination);
  const name = path.basename(destination);
  return {
    stage: path.join(parent, `.${name}.ddd-engineer-skills-stage`),
    backup: path.join(parent, `.${name}.ddd-engineer-skills-backup`),
  };
}

async function recoverInterruptedReplacement(destination) {
  const { stage, backup } = replacementPaths(destination);
  const destinationExists = await exists(destination);
  const backupExists = await exists(backup);

  if (!destinationExists && backupExists) {
    await rename(backup, destination);
  } else if (destinationExists && backupExists) {
    await rm(backup, { recursive: true, force: true });
  }

  await rm(stage, { recursive: true, force: true });
}

async function stageSkill(source, destination) {
  await mkdir(path.dirname(destination), { recursive: true });
  const { stage, backup } = replacementPaths(destination);
  await rm(stage, { recursive: true, force: true });
  await cp(source, stage, { recursive: true });
  return { destination, stage, backup, hadPrevious: false };
}

async function commitStagedSkill(replacement) {
  if (await exists(replacement.destination)) {
    await rm(replacement.backup, { recursive: true, force: true });
    await rename(replacement.destination, replacement.backup);
    replacement.hadPrevious = true;
  }

  try {
    await rename(replacement.stage, replacement.destination);
  } catch (error) {
    if (replacement.hadPrevious && !await exists(replacement.destination) && await exists(replacement.backup)) {
      await rename(replacement.backup, replacement.destination);
      replacement.hadPrevious = false;
    }
    throw error;
  }
}

async function rollbackReplacement(replacement) {
  await rm(replacement.stage, { recursive: true, force: true });

  if (replacement.hadPrevious && await exists(replacement.backup)) {
    await rm(replacement.destination, { recursive: true, force: true });
    await rename(replacement.backup, replacement.destination);
    replacement.hadPrevious = false;
    return;
  }

  if (!replacement.hadPrevious) {
    await rm(replacement.destination, { recursive: true, force: true });
  }
}

async function finalizeReplacement(replacement) {
  await rm(replacement.stage, { recursive: true, force: true });
  await rm(replacement.backup, { recursive: true, force: true });
}

function validateMode(mode) {
  if (mode !== 'install' && mode !== 'update') {
    throw new Error(`Unsupported mode: ${mode}`);
  }
}

export async function installSkills({
  sourceRoot,
  targetRoot,
  packageVersion,
  mode,
  names = [],
  force = false,
}) {
  validateMode(mode);

  const available = await listAvailableSkills(sourceRoot);
  const availableSet = new Set(available);
  const manifest = await readManifest(targetRoot);

  for (const name of names) {
    if (!availableSet.has(name)) {
      throw new Error(`Unknown skill: ${name}. Available skills: ${available.join(', ')}`);
    }
  }

  let selected;
  if (mode === 'install') {
    selected = names.length > 0 ? [...new Set(names)] : available;
  } else if (names.length > 0) {
    selected = [...new Set(names)];
  } else {
    selected = Object.keys(manifest.skills).filter((name) => availableSet.has(name)).sort();
    if (selected.length === 0) {
      throw new Error('No managed skills found to update. Run install first.');
    }
  }

  const plans = [];

  for (const name of selected) {
    const source = path.join(sourceRoot, name);
    const destination = path.join(targetRoot, name);
    await recoverInterruptedReplacement(destination);

    const sourceHash = await hashDirectory(source);
    const destinationExists = await exists(destination);
    const currentHash = destinationExists ? await hashDirectory(destination) : null;
    const previous = manifest.skills[name];

    if (mode === 'install') {
      if (destinationExists && currentHash !== sourceHash && !force) {
        throw new Error(
          `Refusing to overwrite unmanaged or modified skill "${name}". Re-run with --force to replace it.`,
        );
      }

      plans.push({
        name,
        source,
        destination,
        sourceHash,
        status: currentHash === sourceHash ? 'unchanged' : 'installed',
        copy: currentHash !== sourceHash,
      });
      continue;
    }

    if (!previous) {
      if (destinationExists && currentHash === sourceHash) {
        plans.push({ name, source, destination, sourceHash, status: 'unchanged', copy: false });
        continue;
      }
      throw new Error(`Skill "${name}" is not managed. Run install${force ? ' --force' : ''} first.`);
    }

    if (destinationExists && currentHash !== previous.hash && currentHash !== sourceHash && !force) {
      throw new Error(`Local changes detected in "${name}". Re-run with --force to replace them.`);
    }

    plans.push({
      name,
      source,
      destination,
      sourceHash,
      status: currentHash === sourceHash ? 'unchanged' : 'updated',
      copy: currentHash !== sourceHash,
    });
  }

  const replacements = [];
  try {
    for (const plan of plans) {
      if (plan.copy) {
        replacements.push({ plan, replacement: await stageSkill(plan.source, plan.destination) });
      }
    }

    for (const { replacement } of replacements) {
      await commitStagedSkill(replacement);
    }

    for (const plan of plans) {
      manifest.skills[plan.name] = { hash: plan.sourceHash, version: packageVersion };
    }
    await writeManifest(targetRoot, manifest);
  } catch (error) {
    for (const { replacement } of [...replacements].reverse()) {
      try {
        await rollbackReplacement(replacement);
      } catch {
        // Preserve the original failure. Any backup left behind is recovered on the next run.
      }
    }
    throw error;
  }

  for (const { replacement } of replacements) {
    await finalizeReplacement(replacement);
  }

  return plans.map(({ name, status, destination }) => ({ name, status, destination }));
}
