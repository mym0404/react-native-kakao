#!/usr/bin/env node
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { $, fs, os, path } from 'zx';

import { detectBuildChanges } from './ci-changes.ts';

test('reuse only successful native checks for the same PR base and commit history', async () => {
  const cwd = process.cwd();
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-changes-'));
  const git = async (args: string[], input?: string) =>
    (await $({ cwd: directory, input, quiet: true })`git ${args}`).stdout.trim();

  const commit = async (parents: string[], files: Record<string, string> = {}) => {
    const parent = parents[0];
    await git(parent ? ['read-tree', parent] : ['read-tree', '--empty']);
    for (const [file, content] of Object.entries(files)) {
      const blob = await git(['hash-object', '-w', '--stdin'], content);
      await git(['update-index', '--add', '--cacheinfo', '100644', blob, file]);
    }

    return await git([
      'commit-tree',
      await git(['write-tree']),
      ...parents.flatMap((sha) => ['-p', sha]),
      '-m',
      'test',
    ]);
  };

  try {
    await git(['init', '--quiet']);
    await git(['config', 'user.name', 'CI test']);
    await git(['config', 'user.email', 'ci@example.invalid']);

    const base = await commit([], { 'package.json': '{}' });
    const previous = await commit([base], { 'packages/core/android/Module.kt': 'original' });
    const docs = await commit([previous], { 'docs/guide.md': 'documentation' });
    const android = await commit([previous], { 'packages/core/android/Module.kt': 'changed' });
    const ios = await commit([previous], { 'packages/core/ios/Module.swift': 'changed' });
    const shared = await commit([previous], { 'packages/core/src/index.ts': 'changed' });
    const unrelated = await commit([], { 'README.md': 'unrelated history' });
    const laterDocs = await commit([docs], { 'README.md': 'more documentation' });
    const same = { android: 'false', ios: 'false' };
    const both = { android: 'true', ios: 'true' };
    const androidOnly = { android: 'true', ios: 'false' };
    const iosOnly = { android: 'false', ios: 'true' };
    const marker = `main@${base}`;
    const run = (id: number, head = previous, extra = {}) => ({
      id,
      run_number: id,
      head_sha: head,
      head_repository: { id: 1, name: 'repo', owner: { login: 'owner' } },
      pull_requests: [{ number: 103 }],
      ...extra,
    });

    const jobs = (states: Record<string, string> = {}, recordedBase = marker) => [
      {
        name: 'changes',
        conclusion: 'success',
        steps: [{ name: `Checked base: ${recordedBase}`, conclusion: 'success' }],
      },
      ...['build-android', 'build-ios'].map((name) => ({
        name,
        conclusion: states[name] ?? 'success',
      })),
    ];

    const skipped = jobs({
      'build-android': 'skipped',
      'build-ios': 'skipped',
    });

    const oldMatrixJobs = [
      ...jobs().slice(0, 1),
      ...['build-android (old)', 'build-android (new)', 'build-ios (new)'].map((name) => ({
        name,
        conclusion: 'success',
      })),
    ];

    const cases: {
      name: string;
      expected: { android: string; ios: string };
      head?: string;
      pages?: ReturnType<typeof run>[][];
      jobs?: Record<number, ReturnType<typeof jobs>>;
      apiError?: boolean;
      jobsError?: boolean;
      push?: boolean;
    }[] = [
      {
        name: 'first changeset-only run',
        head: await commit([base], { '.changeset/fix.md': 'patch' }),
        pages: [[]],
        expected: same,
      },
      { name: 'Android change', head: android, expected: androidOnly },
      { name: 'iOS change', head: ios, expected: iosOnly },
      { name: 'shared change', head: shared, expected: both },
      {
        name: 'first iOS-only run with changeset',
        head: await commit([base], {
          'packages/core/ios/Module.swift': 'changed',
          '.changeset/ios-fix.md': 'patch',
        }),
        pages: [[]],
        expected: iosOnly,
      },
      {
        name: 'changed target base',
        jobs: { 1: jobs({}, `main@${unrelated}`) },
        expected: androidOnly,
      },
      { name: 'retargeted PR', jobs: { 1: jobs({}, `v2@${base}`) }, expected: androidOnly },
      { name: 'force push', pages: [[run(1, unrelated)]], expected: androidOnly },
      {
        name: 'wrong PR',
        pages: [[run(1, previous, { pull_requests: [{ number: 104 }] })]],
        expected: androidOnly,
      },
      {
        name: 'wrong fork',
        pages: [[run(1, previous, { head_repository: { id: 2 } })]],
        expected: androidOnly,
      },
      { name: 'current rerun', pages: [[run(10)]], expected: androidOnly },
      { name: 'newer run', pages: [[run(11)]], expected: androidOnly },
      { name: 'missing base record', jobs: { 1: jobs().slice(1) }, expected: androidOnly },
      { name: 'invalid SHA', pages: [[run(1, '--output=unsafe')]], expected: androidOnly },
      { name: 'history API failure', apiError: true, expected: androidOnly },
      { name: 'jobs API failure', jobsError: true, expected: androidOnly },
      {
        name: 'Android failure',
        jobs: { 1: jobs({ 'build-android': 'failure' }) },
        expected: androidOnly,
      },
      {
        name: 'iOS cancellation',
        head: ios,
        jobs: { 1: jobs({ 'build-ios': 'cancelled' }) },
        expected: iosOnly,
      },
      {
        name: 'missing Android job',
        jobs: { 1: jobs().filter(({ name }) => name !== 'build-android') },
        expected: androidOnly,
      },
      {
        name: 'old matrix history is not reusable',
        jobs: { 1: oldMatrixJobs },
        expected: androidOnly,
      },
      {
        name: 'skipped builds are not success',
        pages: [[run(2, docs)]],
        jobs: { 2: skipped },
        expected: androidOnly,
      },
      {
        name: 'pagination past skipped builds',
        head: laterDocs,
        pages: [[run(2, docs)], [run(1)]],
        jobs: { 2: skipped },
        expected: same,
      },
      {
        name: 'latest failed build cannot reuse older success',
        head: laterDocs,
        pages: [[run(2, docs), run(1)]],
        jobs: { 2: jobs({ 'build-android': 'failure' }) },
        expected: androidOnly,
      },
      {
        name: 'independent platform baselines',
        head: laterDocs,
        pages: [[run(2, docs), run(1)]],
        jobs: { 2: jobs({ 'build-ios': 'skipped' }) },
        expected: same,
      },
      {
        name: 'push after success',
        push: true,
        jobs: { 1: jobs({}, 'refs/heads/main') },
        expected: same,
      },
      {
        name: 'push after Android failure',
        push: true,
        jobs: { 1: jobs({ 'build-android': 'failure' }, 'refs/heads/main') },
        expected: androidOnly,
      },
    ];

    process.chdir(directory);
    for (const scenario of cases) {
      const head = scenario.head ?? docs;
      const checkout = scenario.push ? head : await commit([base, head]);
      await git(['update-ref', 'HEAD', checkout]);

      const outputs: Record<string, string> = {};

      await detectBuildChanges({
        listRuns: async function* () {
          if (scenario.apiError) {
            throw new Error('API unavailable');
          }

          for (const page of scenario.pages ?? [[run(1)]]) {
            yield page;
          }
        },
        listJobs: async (runId) => {
          if (scenario.jobsError) {
            throw new Error('API unavailable');
          }

          return scenario.jobs?.[runId] ?? jobs();
        },
        context: {
          eventName: scenario.push ? 'push' : 'pull_request',
          runNumber: 10,
          sha: checkout,
          ref: scenario.push ? 'refs/heads/main' : 'refs/pull/103/merge',
          repo: { owner: 'owner', repo: 'repo' },
          payload: {
            repository: { id: 1, name: 'repo', owner: { login: 'owner' } },
            ...(!scenario.push && {
              pull_request: {
                number: 103,
                head: { sha: head, ref: 'feature', repo: { id: 1 } },
                base: { ref: 'main' },
              },
            }),
          },
        },
        core: {
          setOutput: (name, value) => {
            outputs[name] = value;
          },
          info: () => {},
          warning: () => {},
        },
      });

      const { android: androidChanged, ios: iosChanged } = outputs;
      assert.deepEqual(
        { android: androidChanged, ios: iosChanged },
        scenario.expected,
        scenario.name,
      );
    }

    console.log(`Verified ${cases.length} CI history scenarios with real Git commits.`);
  } finally {
    process.chdir(cwd);
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
