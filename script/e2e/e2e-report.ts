#!/usr/bin/env node
import * as actionsCore from '@actions/core';
import { context as workflowContext, getOctokit } from '@actions/github';
import { $, fs, os, path } from 'zx';

type Summary = {
  platform: string;
  status: 'passed' | 'failed';
  durationSeconds: number;
  video?: string;
  tests: { name: string; status: string; durationSeconds: number }[];
};

const isSummary = (value: unknown): value is Summary => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    'platform' in value &&
    typeof value.platform === 'string' &&
    'status' in value &&
    (value.status === 'passed' || value.status === 'failed') &&
    'durationSeconds' in value &&
    typeof value.durationSeconds === 'number' &&
    Number.isFinite(value.durationSeconds) &&
    value.durationSeconds >= 0 &&
    (!('video' in value) || typeof value.video === 'string') &&
    'tests' in value &&
    Array.isArray(value.tests) &&
    value.tests.every(
      (test) =>
        typeof test?.name === 'string' &&
        typeof test.status === 'string' &&
        Number.isFinite(test.durationSeconds) &&
        test.durationSeconds >= 0,
    )
  );
};
const platforms = ['android', 'ios'];
const videoFile = 'video.mp4';

export const reportE2EResults = async ({
  github,
  context,
  core,
}: {
  github: ReturnType<typeof getOctokit>;
  context: Pick<typeof workflowContext, 'repo' | 'issue' | 'serverUrl' | 'runId'>;
  core: Pick<typeof actionsCore, 'summary'>;
}) => {
  const { owner, repo } = context.repo;
  const issue_number = context.issue.number;
  const startMarker = '<!-- example-sdk-e2e:start -->';
  const endMarker = '<!-- example-sdk-e2e:end -->';
  const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number: issue_number });

  if (pr.head.sha !== process.env.PR_HEAD_SHA) {
    return;
  }

  const runUrl = `${context.serverUrl}/${owner}/${repo}/actions/runs/${context.runId}`;
  const rows: string[] = [];
  const testRows: string[] = [];
  const videos: { platform: string; file: string }[] = [];
  for (const platform of platforms) {
    let result: Summary | undefined;
    try {
      const data: unknown = await fs.readJson(`e2e-results/e2e-${platform}/summary.json`);
      if (!isSummary(data) || data.platform !== platform) {
        throw new Error(`Invalid ${platform} E2E summary`);
      }

      result = data;
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) {
        throw error;
      }
    }

    if (
      result?.status === 'passed' &&
      (result.tests.length === 0 ||
        result.tests.some((test) => test.status !== 'passed') ||
        result.video !== videoFile)
    ) {
      throw new Error(`Incomplete ${platform} E2E evidence`);
    }

    if (result?.video !== undefined) {
      if (result.video !== videoFile) {
        throw new Error(`Invalid ${platform} video path: ${result.video}`);
      }

      const file = path.resolve(`e2e-results/e2e-${platform}`, videoFile);
      const bytes = await fs.readFile(file);
      if (bytes.length < 24 || bytes.subarray(4, 8).toString() !== 'ftyp') {
        throw new Error(`Invalid ${platform} whole-run video`);
      }

      videos.push({ platform, file });
    }

    for (const test of result?.tests ?? []) {
      testRows.push(
        `| ${platform} | ${test.name} | ${test.status} | ${test.durationSeconds.toFixed(2)}s |`,
      );
    }

    const status = result ? (result.status === 'passed' ? '✅ Passed' : '❌ Failed') : '⚠️ Not run';
    const seconds = result ? `${result.durationSeconds.toFixed(2)}s` : '—';
    rows.push(`| ${platform} | ${status} | ${seconds} |`);
  }

  const summary = [
    '## Example E2E · e2e SDK',
    '',
    `Commit: ${process.env.PR_HEAD_SHA} · [CI run](${runUrl})`,
    '',
    '| Platform | Result | Test time |',
    '| --- | --- | ---: |',
    ...rows,
    '',
    'Verifies menu navigation, titles, signed-out API results, token errors, channel URLs, and unavailable navigation. Excludes login and external app actions.',
    'Time includes SDK startup and app installation; excludes device preparation, builds, and video export.',
  ];
  await core.summary.addRaw(summary.join('\n')).write();

  const section = [
    startMarker,
    ...summary,
    '',
    '### Scenarios',
    '',
    '| Platform | Scenario | Result | Time |',
    '| --- | --- | --- | ---: |',
    ...testRows,
    '',
    '### Full test runs',
    ...videos.flatMap(({ platform, file }) => ['', `**${platform}**`, '', `![](${file})`]),
    '',
    endMarker,
  ].join('\n');
  const original = pr.body ?? '';
  const start = original.indexOf(startMarker);
  const end = original.indexOf(endMarker, start);
  const body =
    start >= 0 && end >= start
      ? original.slice(0, start) + section + original.slice(end + endMarker.length)
      : `${original.trimEnd()}\n\n${section}`;

  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'kakao-e2e-report-'));
  try {
    const bodyFile = path.join(directory, 'body.md');
    await fs.writeFile(bodyFile, body);

    const attachments = videos.flatMap(({ file }) => ['--attach', file]);
    await $({ stdio: 'inherit' })`gh pr edit ${pr.html_url} --body-file ${bodyFile} ${attachments}`;
  } finally {
    await fs.remove(directory);
  }
};

const main = async () => {
  const token = process.env.GITHUB_TOKEN;
  if (!token || !process.env.PR_HEAD_SHA) {
    throw new Error('GITHUB_TOKEN and PR_HEAD_SHA are required to report E2E results.');
  }

  await reportE2EResults({
    github: getOctokit(token),
    context: workflowContext,
    core: actionsCore,
  });
};

if (import.meta.main) {
  await main();
}
