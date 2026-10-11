#!/usr/bin/env node
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { $, fs, os, path } from 'zx';

import { logCommand } from './e2e-log.ts';

test('ZX reports nonzero exits, deadlines, and cancellation', async () => {
  const output = await fs.mkdtemp(path.join(os.tmpdir(), 'kakao-runtime-test-'));
  const log = path.join(output, 'test.log');
  const node = process.execPath;
  try {
    await logCommand($({ quiet: true })`${node} -e ${'console.log("done")'}`, log);
    assert.match(await fs.readFile(log, 'utf8'), /done/);
    await assert.rejects(
      logCommand($({ quiet: true })`${node} -e ${'process.exit(1)'}`, log),
      /exited 1/,
    );

    const script = 'setInterval(() => {}, 1000)';
    await assert.rejects(
      logCommand($({ quiet: true })`${node} -e ${script}`.timeout(100, 'SIGKILL'), log),
      /SIGKILL/,
    );

    await assert.rejects(
      logCommand(
        $({
          quiet: true,
          signal: AbortSignal.timeout(100),
          detached: true,
        })`${node} -e ${script}`,
        log,
      ),
      /SIGTERM/,
    );
  } finally {
    await fs.rm(output, { recursive: true, force: true });
  }
});

test('CLI rejects invalid device, missing app, and reused output before starting a session', async () => {
  const output = await fs.mkdtemp(path.join(os.tmpdir(), 'kakao-cli-test-'));
  const cli = path.join(import.meta.dirname, 'e2e.ts');
  const node = process.execPath;
  const command = $({ quiet: true });
  try {
    await assert.rejects(command`${node} ${cli} test ios --device=-invalid`, /Invalid --device/);
    await assert.rejects(
      command`${node} ${cli} test ios --device missing --app ${path.join(output, 'absent.app')}`,
      /App not found/,
    );

    const app = path.join(output, 'fake.app');
    await fs.mkdir(app);
    await fs.writeFile(path.join(output, 'run.json'), 'previous run');
    await assert.rejects(
      command`${node} ${cli} test ios --device missing --app ${app} --output ${output}`,
      /EEXIST/,
    );
    assert.equal(await fs.readFile(path.join(output, 'run.json'), 'utf8'), 'previous run');
  } finally {
    await fs.rm(output, { recursive: true, force: true });
  }
});
