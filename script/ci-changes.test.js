const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { detectBuildChanges } = require('./ci-changes');

test('reuse only successful native checks for the same PR base and commit history', async () => {
  const cwd = process.cwd();
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-changes-'));
  const git = (args, input) =>
    execFileSync('git', args, {
      cwd: directory,
      encoding: 'utf8',
      input,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

  const commit = (parents, files = {}) => {
    git(parents.length ? ['read-tree', parents[0]] : ['read-tree', '--empty']);
    for (const [file, content] of Object.entries(files)) {
      const blob = git(['hash-object', '-w', '--stdin'], content);
      git(['update-index', '--add', '--cacheinfo', '100644', blob, file]);
    }

    return git([
      'commit-tree',
      git(['write-tree']),
      ...parents.flatMap((sha) => ['-p', sha]),
      '-m',
      'test',
    ]);
  };

  try {
    git(['init', '--quiet']);
    git(['config', 'user.name', 'CI test']);
    git(['config', 'user.email', 'ci@example.invalid']);

    const base = commit([], { 'package.json': '{}' });
    const previous = commit([base], { 'packages/core/android/Module.kt': 'original' });
    const docs = commit([previous], { 'docs/guide.md': 'documentation' });
    const android = commit([previous], { 'packages/core/android/Module.kt': 'changed' });
    const ios = commit([previous], { 'packages/core/ios/Module.swift': 'changed' });
    const shared = commit([previous], { 'packages/core/src/index.ts': 'changed' });
    const unrelated = commit([], { 'README.md': 'unrelated history' });
    const laterDocs = commit([docs], { 'README.md': 'more documentation' });
    const same = { android: 'false', ios: 'false' };
    const both = { android: 'true', ios: 'true' };
    const androidOnly = { android: 'true', ios: 'false' };
    const iosOnly = { android: 'false', ios: 'true' };
    const marker = `main@${base}`;
    const run = (id, head = previous, extra = {}) => ({
      id,
      run_number: id,
      head_sha: head,
      head_repository: { id: 1 },
      pull_requests: [{ number: 103 }],
      ...extra,
    });

    const jobs = (states = {}, recordedBase = marker) => [
      {
        name: 'changes',
        conclusion: 'success',
        steps: [{ name: `Checked base: ${recordedBase}`, conclusion: 'success' }],
      },
      ...['build-android (old)', 'build-android (new)', 'build-ios (new)'].map((name) => ({
        name,
        conclusion: states[name] ?? 'success',
      })),
    ];

    const skipped = jobs({
      'build-android (old)': 'skipped',
      'build-android (new)': 'skipped',
      'build-ios (new)': 'skipped',
    });

    const cases = [
      { name: 'docs after success', expected: same },
      { name: 'Android change', head: android, expected: androidOnly },
      { name: 'iOS change', head: ios, expected: iosOnly },
      { name: 'shared change', head: shared, expected: both },
      { name: 'first run', pages: [[]], expected: both },
      { name: 'changed target base', jobs: { 1: jobs({}, `main@${unrelated}`) }, expected: both },
      { name: 'retargeted PR', jobs: { 1: jobs({}, `v2@${base}`) }, expected: both },
      { name: 'force push', pages: [[run(1, unrelated)]], expected: both },
      {
        name: 'wrong PR',
        pages: [[run(1, previous, { pull_requests: [{ number: 104 }] })]],
        expected: both,
      },
      {
        name: 'wrong fork',
        pages: [[run(1, previous, { head_repository: { id: 2 } })]],
        expected: both,
      },
      { name: 'current rerun', pages: [[run(10)]], expected: both },
      { name: 'newer run', pages: [[run(11)]], expected: both },
      { name: 'missing base record', jobs: { 1: jobs().slice(1) }, expected: both },
      { name: 'invalid SHA', pages: [[run(1, '--output=unsafe')]], expected: both },
      { name: 'history API failure', apiError: true, expected: both },
      { name: 'jobs API failure', jobsError: true, expected: both },
      {
        name: 'Android failure',
        jobs: { 1: jobs({ 'build-android (new)': 'failure' }) },
        expected: androidOnly,
      },
      {
        name: 'iOS cancellation',
        jobs: { 1: jobs({ 'build-ios (new)': 'cancelled' }) },
        expected: iosOnly,
      },
      {
        name: 'missing Android matrix job',
        jobs: { 1: jobs().filter(({ name }) => name !== 'build-android (old)') },
        expected: androidOnly,
      },
      {
        name: 'skipped builds are not success',
        pages: [[run(2, docs)]],
        jobs: { 2: skipped },
        expected: both,
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
        jobs: { 2: jobs({ 'build-android (new)': 'failure' }) },
        expected: androidOnly,
      },
      {
        name: 'independent platform baselines',
        head: laterDocs,
        pages: [[run(2, docs), run(1)]],
        jobs: { 2: jobs({ 'build-ios (new)': 'skipped' }) },
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
        jobs: { 1: jobs({ 'build-android (old)': 'failure' }, 'refs/heads/main') },
        expected: androidOnly,
      },
    ];

    process.chdir(directory);
    for (const scenario of cases) {
      const head = scenario.head ?? docs;
      const checkout = scenario.push ? head : commit([base, head]);
      git(['update-ref', 'HEAD', checkout]);

      const outputs = {};
      const listWorkflowRuns = Symbol('runs');
      const listJobsForWorkflowRun = Symbol('jobs');
      const paginate = Object.assign(
        async (method, { run_id }) => {
          assert.equal(method, listJobsForWorkflowRun);
          if (scenario.jobsError) {
            throw new Error('API unavailable');
          }

          return scenario.jobs?.[run_id] ?? jobs();
        },
        {
          iterator: async function* (method, options) {
            assert.equal(method, listWorkflowRuns);
            assert.equal(options.event, scenario.push ? 'push' : 'pull_request');
            assert.equal(options.branch, scenario.push ? 'main' : 'feature');
            if (scenario.apiError) {
              throw new Error('API unavailable');
            }

            for (const page of scenario.pages ?? [[run(1)]]) {
              yield { data: page };
            }
          },
        },
      );

      await detectBuildChanges({
        github: { rest: { actions: { listWorkflowRuns, listJobsForWorkflowRun } }, paginate },
        context: {
          eventName: scenario.push ? 'push' : 'pull_request',
          runNumber: 10,
          sha: checkout,
          ref: scenario.push ? 'refs/heads/main' : 'refs/pull/103/merge',
          repo: { owner: 'owner', repo: 'repo' },
          payload: {
            repository: { id: 1 },
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
