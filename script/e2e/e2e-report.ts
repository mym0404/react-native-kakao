#!/usr/bin/env node
import * as actionsCore from '@actions/core';
import { context as workflowContext, getOctokit } from '@actions/github';
import { fs } from 'zx';

type Summary = {
  platform: string;
  status: 'passed' | 'failed';
  durationSeconds: number;
  tests: { status: string }[];
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
    'tests' in value &&
    Array.isArray(value.tests) &&
    value.tests.every((test) => typeof test?.status === 'string')
  );
};
const platforms = ['android', 'ios'];

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
  const marker = '<!-- example-sdk-e2e -->';
  const endMarker = '<!-- /example-sdk-e2e -->';
  const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number: issue_number });

  if (pr.head.sha !== process.env.PR_HEAD_SHA) {
    return;
  }

  const runUrl = `${context.serverUrl}/${owner}/${repo}/actions/runs/${context.runId}`;
  const rows: string[] = [];
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
      (result.tests.length === 0 || result.tests.some((test) => test.status !== 'passed'))
    ) {
      throw new Error(`Incomplete ${platform} E2E evidence`);
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
    'Time includes SDK startup and app installation; excludes device preparation and builds.',
  ];
  await core.summary.addRaw(summary.join('\n')).write();

  const body = [marker, ...summary, endMarker].join('\n');

  const description = pr.body ?? '';
  let updatedBody = `${description}\n\n${body}`;
  const start = description.indexOf(marker);
  if (start !== -1) {
    const end = description.indexOf(endMarker, start);
    if (end === -1) {
      throw new Error('Incomplete E2E report block in PR body');
    }

    updatedBody = description.slice(0, start) + body + description.slice(end + endMarker.length);
  }

  await github.rest.pulls.update({ owner, repo, pull_number: issue_number, body: updatedBody });
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
