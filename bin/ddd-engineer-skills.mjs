#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import { runCli } from '../src/cli.mjs';

const sourceRoot = fileURLToPath(new URL('../skills/', import.meta.url));
const packageJsonPath = fileURLToPath(new URL('../package.json', import.meta.url));
const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));

process.exitCode = await runCli(process.argv.slice(2), {
  cwd: process.cwd(),
  home: os.homedir(),
  sourceRoot,
  packageVersion: packageJson.version,
  stdout: process.stdout,
  stderr: process.stderr,
});
