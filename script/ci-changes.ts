#!/usr/bin/env node
import * as actionsCore from '@actions/core';
import { context as workflowContext, getOctokit } from '@actions/github';
import { $ } from 'zx';

type WorkflowRun = {
  id: number;
  run_number: number;
  head_sha: string;
  head_repository: { id: number } | null;
  pull_requests?: { number: number }[] | null;
};
type WorkflowJob = {
  name: string;
  conclusion: string | null;
  steps?: { name: string; conclusion: string | null }[];
};

const buildJobs = {
  android: 'build-android',
  ios: 'build-ios',
};
const platforms = ['android', 'ios'] as const;
const git = async (args: string[]) =>
  (await $({ cwd: process.cwd(), quiet: true })`git ${args}`).stdout.trim();

const affectsPlatform = (file: string, platform: 'android' | 'ios') => {
  if (file.startsWith('.changeset/') || file.startsWith('docs/') || file.endsWith('.md')) {
    return false;
  }

  if (/^(packages\/[^/]+|example)\/android\//.test(file)) {
    return platform === 'android';
  }

  if (
    /^(packages\/[^/]+|example)\/ios\/|^packages\/[^/]+\/[^/]+\.podspec$|^example\/Gemfile/.test(
      file,
    )
  ) {
    return platform === 'ios';
  }

  return true;
};

export const detectBuildChanges = async ({
  context,
  listRuns,
  listJobs,
  core,
}: {
  context: Pick<
    typeof workflowContext,
    'payload' | 'sha' | 'ref' | 'repo' | 'eventName' | 'runNumber'
  >;
  listRuns: () => AsyncIterable<WorkflowRun[]>;
  listJobs: (runId: number) => Promise<WorkflowJob[]>;
  core: Pick<typeof actionsCore, 'setOutput' | 'info' | 'warning'>;
}) => {
  const changed = { android: true, ios: true };
  const resolved = new Set();
  const pr = context.payload.pull_request;
  const head = pr?.head.sha ?? context.sha;
  const repositoryId = pr?.head.repo.id ?? context.payload.repository?.id;

  try {
    if (!/^[a-f0-9]{40}$/.test(head) || (await git(['rev-parse', 'HEAD'])) !== context.sha) {
      throw new Error('Checkout does not match the workflow commit.');
    }

    let base = context.ref;
    if (pr) {
      if ((await git(['rev-parse', 'HEAD^2'])) !== head) {
        throw new Error('Checkout is not the expected PR merge commit.');
      }

      base = `${pr.base.ref}@${await git(['rev-parse', 'HEAD^1'])}`;

      const files = (
        await $({
          cwd: process.cwd(),
          quiet: true,
        })`git diff --name-only --no-renames -z HEAD^1...HEAD^2 --`
      ).stdout
        .split('\0')
        .filter(Boolean);

      for (const platform of platforms) {
        if (!files.some((file) => affectsPlatform(file, platform))) {
          changed[platform] = false;
          resolved.add(platform);
          core.info(`${platform}: skipped because the PR has no changes affecting this platform.`);
        }
      }
    }

    core.setOutput('base', base);

    for await (const runs of listRuns()) {
      if (resolved.size === platforms.length) {
        break;
      }

      for (const run of runs) {
        if (
          run.run_number >= context.runNumber ||
          run.head_repository?.id !== repositoryId ||
          (pr && !run.pull_requests?.some(({ number }) => number === pr.number))
        ) {
          continue;
        }

        if (!/^[a-f0-9]{40}$/.test(run.head_sha)) {
          throw new Error('Previous workflow has an invalid commit SHA.');
        }

        await git(['merge-base', '--is-ancestor', run.head_sha, head]);

        const jobs = await listJobs(run.id);

        // Step names preserve the checked base without relying on current PR metadata.
        const recordedBase = jobs
          .find(({ name }) => name === 'changes')
          ?.steps?.some(
            ({ name, conclusion }) => name === `Checked base: ${base}` && conclusion === 'success',
          );

        if (!recordedBase) {
          throw new Error(`Run ${run.id} has no successful record of the same base.`);
        }

        for (const platform of platforms) {
          if (resolved.has(platform)) {
            continue;
          }

          const builds = jobs.filter(({ name }) => name === buildJobs[platform]);
          if (builds.length === 0 || builds.every(({ conclusion }) => conclusion === 'skipped')) {
            continue;
          }

          resolved.add(platform);
          if (builds.length !== 1 || builds[0]?.conclusion !== 'success') {
            core.info(`${platform}: run again because run ${run.id} did not pass every build.`);
            continue;
          }

          const files = (
            await $({
              cwd: process.cwd(),
              quiet: true,
            })`git diff --name-only --no-renames -z ${run.head_sha} ${head} --`
          ).stdout
            .split('\0')
            .filter(Boolean);
          changed[platform] = files.some((file) => affectsPlatform(file, platform));
          core.info(
            `${platform}: changed=${changed[platform]}, successful run=${run.id}, commit=${run.head_sha}`,
          );
        }

        if (resolved.size === platforms.length) {
          break;
        }
      }

      if (resolved.size === platforms.length) {
        break;
      }
    }
  } catch (error) {
    core.warning(
      `Running native checks because their previous results cannot be reused: ${error instanceof Error ? error.message : String(error)}`,
    );

    for (const platform of platforms) {
      if (!resolved.has(platform)) {
        changed[platform] = true;
      }
    }
  }

  for (const platform of platforms) {
    core.setOutput(platform, String(changed[platform]));
  }
};

const main = async () => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN is required to inspect CI history.');
  }

  const github = getOctokit(token);
  const { owner, repo } = workflowContext.repo;
  await detectBuildChanges({
    context: workflowContext,
    core: actionsCore,
    listRuns: async function* () {
      for await (const { data } of github.paginate.iterator(github.rest.actions.listWorkflowRuns, {
        owner,
        repo,
        workflow_id: 'ci.yml',
        event: workflowContext.eventName,
        branch:
          workflowContext.payload.pull_request?.head.ref ??
          workflowContext.ref.replace('refs/heads/', ''),
        per_page: 100,
      })) {
        yield data;
      }
    },
    listJobs: (runId) =>
      github.paginate(github.rest.actions.listJobsForWorkflowRun, {
        owner,
        repo,
        run_id: runId,
        filter: 'latest',
        per_page: 100,
      }),
  });
};

if (import.meta.main) {
  await main();
}
