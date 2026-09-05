import { getTargetRoot, installSkills } from './installer.mjs';

const HELP = `ddd-engineer-skills

Usage:
  ddd-engineer-skills install [skills...] [--global] [--force]
  ddd-engineer-skills update [skills...] [--global] [--force]

Commands:
  install [skills...]  Install all packaged skills, or only the named skills.
  update [skills...]   Update managed skills, or only the named managed skills.

Options:
  --global             Install under ~/.agents/skills instead of ./.agents/skills.
  --force              Replace unmanaged or locally modified skill contents.
  -h, --help           Show this help.
`;

function parseArgs(args) {
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    return { help: true };
  }

  const [command, ...rest] = args;
  if (command !== 'install' && command !== 'update') {
    throw new Error(`Unknown command: ${command}`);
  }

  const names = [];
  let global = false;
  let force = false;

  for (const arg of rest) {
    if (arg === '--global') {
      global = true;
    } else if (arg === '--force') {
      force = true;
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      names.push(arg);
    }
  }

  return { command, names, global, force, help: false };
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export async function runCli(args, {
  cwd,
  home,
  sourceRoot,
  packageVersion,
  stdout,
  stderr,
}) {
  try {
    const parsed = parseArgs(args);
    if (parsed.help) {
      stdout.write(HELP);
      return 0;
    }

    const targetRoot = getTargetRoot({ cwd, home, global: parsed.global });
    const results = await installSkills({
      sourceRoot,
      targetRoot,
      packageVersion,
      mode: parsed.command,
      names: parsed.names,
      force: parsed.force,
    });

    for (const result of results) {
      stdout.write(`${capitalize(result.status)} ${result.name} -> ${result.destination}\n`);
    }
    return 0;
  } catch (error) {
    stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}
