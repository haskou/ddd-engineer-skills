import assert from 'node:assert/strict';
import { chmod, mkdtemp, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { installSkills } from '../src/installer.mjs';

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'ddd-review-'));
  const sourceRoot = path.join(root, 'skills');
  const targetRoot = path.join(root, 'target');
  await mkdir(path.join(sourceRoot, 'alpha', 'scripts'), { recursive: true });
  await writeFile(path.join(sourceRoot, 'alpha', 'SKILL.md'), '# alpha\n');
  await writeFile(path.join(sourceRoot, 'alpha', 'scripts', 'run.sh'), '#!/bin/sh\necho ok\n');
  await chmod(path.join(sourceRoot, 'alpha', 'scripts', 'run.sh'), 0o755);
  return { sourceRoot, targetRoot };
}

test('executable bit participates in managed hash and force update restores it', async () => {
  const { sourceRoot, targetRoot } = await fixture();
  await installSkills({ sourceRoot, targetRoot, packageVersion: '1.0.0', mode: 'install' });

  const installedScript = path.join(targetRoot, 'alpha', 'scripts', 'run.sh');
  await chmod(installedScript, 0o644);

  await assert.rejects(
    installSkills({ sourceRoot, targetRoot, packageVersion: '1.0.1', mode: 'update' }),
    /Local changes detected in "alpha"/,
  );

  await installSkills({ sourceRoot, targetRoot, packageVersion: '1.0.1', mode: 'update', force: true });
  assert.notEqual((await stat(installedScript)).mode & 0o111, 0);
});

test('copy failure while staging leaves the installed skill untouched', async () => {
  const { sourceRoot, targetRoot } = await fixture();
  await installSkills({ sourceRoot, targetRoot, packageVersion: '1.0.0', mode: 'install' });
  await writeFile(path.join(sourceRoot, 'alpha', 'SKILL.md'), '# alpha upstream\n');

  const socketPath = path.join(sourceRoot, 'alpha', 'broken.sock');
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(socketPath, resolve);
  });

  try {
    await assert.rejects(
      installSkills({ sourceRoot, targetRoot, packageVersion: '1.1.0', mode: 'update' }),
    );
    assert.equal(await readFile(path.join(targetRoot, 'alpha', 'SKILL.md'), 'utf8'), '# alpha\n');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
