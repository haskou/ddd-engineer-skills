import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { runCli } from '../src/cli.mjs';

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'ddd-skills-cli-'));
  const sourceRoot = path.join(root, 'skills');
  await mkdir(path.join(sourceRoot, 'alpha'), { recursive: true });
  await writeFile(path.join(sourceRoot, 'alpha', 'SKILL.md'), '# alpha\n');
  return { root, sourceRoot };
}

function capture() {
  let value = '';
  return {
    stream: { write(chunk) { value += chunk; } },
    read: () => value,
  };
}

test('help describes install and update commands', async () => {
  const { root, sourceRoot } = await fixture();
  const stdout = capture();
  const code = await runCli(['--help'], {
    cwd: root,
    home: root,
    sourceRoot,
    packageVersion: '1.0.0',
    stdout: stdout.stream,
    stderr: capture().stream,
  });

  assert.equal(code, 0);
  assert.match(stdout.read(), /install \[skills\.\.\.\]/);
  assert.match(stdout.read(), /update \[skills\.\.\.\]/);
  assert.match(stdout.read(), /--global/);
  assert.match(stdout.read(), /--force/);
});

test('install writes selected skills to repository-local .agents/skills', async () => {
  const { root, sourceRoot } = await fixture();
  const stdout = capture();
  const code = await runCli(['install', 'alpha'], {
    cwd: root,
    home: root,
    sourceRoot,
    packageVersion: '1.0.0',
    stdout: stdout.stream,
    stderr: capture().stream,
  });

  assert.equal(code, 0);
  assert.equal(
    await readFile(path.join(root, '.agents', 'skills', 'alpha', 'SKILL.md'), 'utf8'),
    '# alpha\n',
  );
  assert.match(stdout.read(), /Installed alpha/);
});

test('global install uses the home directory', async () => {
  const { root, sourceRoot } = await fixture();
  const cwd = path.join(root, 'repo');
  const home = path.join(root, 'home');
  await mkdir(cwd);

  const code = await runCli(['install', '--global', 'alpha'], {
    cwd,
    home,
    sourceRoot,
    packageVersion: '1.0.0',
    stdout: capture().stream,
    stderr: capture().stream,
  });

  assert.equal(code, 0);
  assert.equal(
    await readFile(path.join(home, '.agents', 'skills', 'alpha', 'SKILL.md'), 'utf8'),
    '# alpha\n',
  );
});

test('update refreshes managed skills', async () => {
  const { root, sourceRoot } = await fixture();
  await runCli(['install', 'alpha'], {
    cwd: root,
    home: root,
    sourceRoot,
    packageVersion: '1.0.0',
    stdout: capture().stream,
    stderr: capture().stream,
  });
  await writeFile(path.join(sourceRoot, 'alpha', 'SKILL.md'), '# alpha v2\n');

  const stdout = capture();
  const code = await runCli(['update'], {
    cwd: root,
    home: root,
    sourceRoot,
    packageVersion: '2.0.0',
    stdout: stdout.stream,
    stderr: capture().stream,
  });

  assert.equal(code, 0);
  assert.equal(
    await readFile(path.join(root, '.agents', 'skills', 'alpha', 'SKILL.md'), 'utf8'),
    '# alpha v2\n',
  );
  assert.match(stdout.read(), /Updated alpha/);
});

test('unknown options and installer errors return non-zero', async () => {
  const { root, sourceRoot } = await fixture();
  const stderrFlag = capture();
  assert.equal(await runCli(['install', '--wat'], {
    cwd: root,
    home: root,
    sourceRoot,
    packageVersion: '1.0.0',
    stdout: capture().stream,
    stderr: stderrFlag.stream,
  }), 1);
  assert.match(stderrFlag.read(), /Unknown option: --wat/);

  const stderrSkill = capture();
  assert.equal(await runCli(['install', 'missing'], {
    cwd: root,
    home: root,
    sourceRoot,
    packageVersion: '1.0.0',
    stdout: capture().stream,
    stderr: stderrSkill.stream,
  }), 1);
  assert.match(stderrSkill.read(), /Unknown skill: missing/);
});
