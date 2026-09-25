import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

test('publishing accepts only the matching stable or next release lane', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'kakao-release-check-'));
  const script = fileURLToPath(new URL('./release-check.mjs', import.meta.url));
  const statePath = join(cwd, '.changeset/pre.json');
  const planPath = join(cwd, 'plan.json');
  const release = {
    kind: 'publish',
    name: '@react-native-kakao/core',
    version: '2.4.8',
    access: 'public',
    tag: 'latest',
  };
  const check = async (branch, entries, succeeds) => {
    await writeFile(planPath, JSON.stringify({ version: 1, plan: [entries] }));
    const result = spawnSync(process.execPath, [script, branch, planPath], {
      cwd,
      encoding: 'utf8',
    });
    assert.equal(result.status === 0, succeeds, result.stderr);
  };

  try {
    await mkdir(join(cwd, '.changeset'));
    await check('main', [release], true);
    await check('next', [release], false);
    await check('main', [], false);
    await check('other', [release], false);
    await check('main', [{ ...release, name: 'unrelated-package' }], false);
    await check('main', [{ ...release, tag: 'next' }], false);
    await check('main', [{ ...release, version: '2.4.8-next.0' }], false);
    await writeFile(statePath, JSON.stringify({ mode: 'pre', tag: 'next' }));
    const prerelease = { ...release, version: '2.4.8-next.0', tag: 'next' };
    await check('next', [prerelease], true);
    await check('next', [release], false);
    await check('main', [release], false);
    await writeFile(statePath, JSON.stringify({ mode: 'exit', tag: 'next' }));
    await check('next', [prerelease], false);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
