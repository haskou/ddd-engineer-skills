import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  MANIFEST_FILE,
  getTargetRoot,
  installSkills,
  listAvailableSkills,
} from '../src/installer.mjs';

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'ddd-skills-'));
  const sourceRoot = path.join(root, 'package-skills');
  const targetRoot = path.join(root, 'target');
  await mkdir(path.join(sourceRoot, 'alpha', 'references'), { recursive: true });
  await mkdir(path.join(sourceRoot, 'beta'), { recursive: true });
  await writeFile(path.join(sourceRoot, 'alpha', 'SKILL.md'), '# alpha\n');
  await writeFile(path.join(sourceRoot, 'alpha', 'references', 'rules.md'), 'one\n');
  await writeFile(path.join(sourceRoot, 'beta', 'SKILL.md'), '# beta\n');
  return { sourceRoot, targetRoot };
}

test('uses repository-local and global portable targets', () => {
  assert.equal(
    getTargetRoot({ cwd: '/repo', home: '/home/me', global: false }),
    path.join('/repo', '.agents', 'skills'),
  );
  assert.equal(
    getTargetRoot({ cwd: '/repo', home: '/home/me', global: true }),
    path.join('/home/me', '.agents', 'skills'),
  );
});

test('discovers only directories containing SKILL.md', async () => {
  const { sourceRoot } = await fixture();
  await mkdir(path.join(sourceRoot, 'not-a-skill'));
  assert.deepEqual(await listAvailableSkills(sourceRoot), ['alpha', 'beta']);
});

test('install without names installs all skills and writes hashes', async () => {
  const { sourceRoot, targetRoot } = await fixture();
  const results = await installSkills({
    sourceRoot,
    targetRoot,
    packageVersion: '1.2.3',
    mode: 'install',
  });

  assert.deepEqual(
    results.map(({ name, status }) => [name, status]),
    [['alpha', 'installed'], ['beta', 'installed']],
  );
  assert.equal(await readFile(path.join(targetRoot, 'alpha', 'SKILL.md'), 'utf8'), '# alpha\n');

  const manifest = JSON.parse(await readFile(path.join(targetRoot, MANIFEST_FILE), 'utf8'));
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.skills.alpha.version, '1.2.3');
  assert.match(manifest.skills.alpha.hash, /^sha256:[a-f0-9]{64}$/);
});

test('install supports selection and rejects unknown skills', async () => {
  const { sourceRoot, targetRoot } = await fixture();
  const results = await installSkills({
    sourceRoot,
    targetRoot,
    packageVersion: '1.0.0',
    mode: 'install',
    names: ['beta'],
  });

  assert.deepEqual(results.map(({ name }) => name), ['beta']);
  await assert.rejects(
    installSkills({
      sourceRoot,
      targetRoot,
      packageVersion: '1.0.0',
      mode: 'install',
      names: ['missing'],
    }),
    /Unknown skill: missing/,
  );
});

test('install refuses unmanaged local content unless forced', async () => {
  const { sourceRoot, targetRoot } = await fixture();
  await mkdir(path.join(targetRoot, 'alpha'), { recursive: true });
  await writeFile(path.join(targetRoot, 'alpha', 'SKILL.md'), 'local\n');

  await assert.rejects(
    installSkills({
      sourceRoot,
      targetRoot,
      packageVersion: '1.0.0',
      mode: 'install',
      names: ['alpha'],
    }),
    /Refusing to overwrite unmanaged or modified skill "alpha"/,
  );

  const results = await installSkills({
    sourceRoot,
    targetRoot,
    packageVersion: '1.0.0',
    mode: 'install',
    names: ['alpha'],
    force: true,
  });
  assert.equal(results[0].status, 'installed');
  assert.equal(await readFile(path.join(targetRoot, 'alpha', 'SKILL.md'), 'utf8'), '# alpha\n');
});

test('update replaces unchanged managed skills when packaged contents change', async () => {
  const { sourceRoot, targetRoot } = await fixture();
  await installSkills({
    sourceRoot,
    targetRoot,
    packageVersion: '1.0.0',
    mode: 'install',
    names: ['alpha'],
  });
  await writeFile(path.join(sourceRoot, 'alpha', 'references', 'rules.md'), 'two\n');

  const results = await installSkills({
    sourceRoot,
    targetRoot,
    packageVersion: '1.1.0',
    mode: 'update',
  });

  assert.equal(results[0].status, 'updated');
  assert.equal(await readFile(path.join(targetRoot, 'alpha', 'references', 'rules.md'), 'utf8'), 'two\n');
});

test('update refuses local edits unless forced', async () => {
  const { sourceRoot, targetRoot } = await fixture();
  await installSkills({
    sourceRoot,
    targetRoot,
    packageVersion: '1.0.0',
    mode: 'install',
    names: ['alpha'],
  });
  await writeFile(path.join(targetRoot, 'alpha', 'SKILL.md'), 'local customization\n');
  await writeFile(path.join(sourceRoot, 'alpha', 'references', 'rules.md'), 'upstream change\n');

  await assert.rejects(
    installSkills({ sourceRoot, targetRoot, packageVersion: '1.1.0', mode: 'update' }),
    /Local changes detected in "alpha"/,
  );

  const results = await installSkills({
    sourceRoot,
    targetRoot,
    packageVersion: '1.1.0',
    mode: 'update',
    force: true,
  });
  assert.equal(results[0].status, 'updated');
  assert.equal(await readFile(path.join(targetRoot, 'alpha', 'SKILL.md'), 'utf8'), '# alpha\n');
});

test('update without managed skills fails rather than installing everything', async () => {
  const { sourceRoot, targetRoot } = await fixture();
  await assert.rejects(
    installSkills({ sourceRoot, targetRoot, packageVersion: '1.0.0', mode: 'update' }),
    /No managed skills found/,
  );
});

test('install preflights every selected skill before writing', async () => {
  const { sourceRoot, targetRoot } = await fixture();
  await mkdir(path.join(targetRoot, 'beta'), { recursive: true });
  await writeFile(path.join(targetRoot, 'beta', 'SKILL.md'), 'local beta\n');

  await assert.rejects(
    installSkills({ sourceRoot, targetRoot, packageVersion: '1.0.0', mode: 'install' }),
    /Refusing to overwrite unmanaged or modified skill "beta"/,
  );
  await assert.rejects(readFile(path.join(targetRoot, 'alpha', 'SKILL.md'), 'utf8'), /ENOENT/);
});

test('update preflights local edits before updating another skill', async () => {
  const { sourceRoot, targetRoot } = await fixture();
  await installSkills({ sourceRoot, targetRoot, packageVersion: '1.0.0', mode: 'install' });
  await writeFile(path.join(sourceRoot, 'alpha', 'SKILL.md'), '# alpha upstream\n');
  await writeFile(path.join(sourceRoot, 'beta', 'SKILL.md'), '# beta upstream\n');
  await writeFile(path.join(targetRoot, 'beta', 'SKILL.md'), '# beta local\n');

  await assert.rejects(
    installSkills({ sourceRoot, targetRoot, packageVersion: '2.0.0', mode: 'update' }),
    /Local changes detected in "beta"/,
  );
  assert.equal(await readFile(path.join(targetRoot, 'alpha', 'SKILL.md'), 'utf8'), '# alpha\n');
});
