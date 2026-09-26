const { execFileSync } = require('node:child_process');

const buildJobs = {
  android: ['build-android'],
  ios: ['build-ios'],
};
const platforms = Object.keys(buildJobs);
const git = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

const affectsPlatform = (file, platform) => {
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

const detectBuildChanges = async ({ github, context, core }) => {
  const changed = { android: true, ios: true };
  const resolved = new Set();
  const pr = context.payload.pull_request;
  const head = pr?.head.sha ?? context.sha;
  const branch = pr?.head.ref ?? context.ref.replace('refs/heads/', '');
  const repositoryId = pr?.head.repo.id ?? context.payload.repository.id;
  const { owner, repo } = context.repo;

  try {
    if (!/^[a-f0-9]{40}$/.test(head) || git(['rev-parse', 'HEAD']) !== context.sha) {
      throw new Error('Checkout does not match the workflow commit.');
    }

    let base = context.ref;
    if (pr) {
      if (git(['rev-parse', 'HEAD^2']) !== head) {
        throw new Error('Checkout is not the expected PR merge commit.');
      }

      base = `${pr.base.ref}@${git(['rev-parse', 'HEAD^1'])}`;
    }

    core.setOutput('base', base);

    for await (const { data: runs } of github.paginate.iterator(
      github.rest.actions.listWorkflowRuns,
      {
        owner,
        repo,
        workflow_id: 'ci.yml',
        event: context.eventName,
        branch,
        per_page: 100,
      },
    )) {
      for (const run of runs) {
        if (
          run.run_number >= context.runNumber ||
          run.head_repository?.id !== repositoryId ||
          (pr && !run.pull_requests.some(({ number }) => number === pr.number))
        ) {
          continue;
        }

        if (!/^[a-f0-9]{40}$/.test(run.head_sha)) {
          throw new Error('Previous workflow has an invalid commit SHA.');
        }

        git(['merge-base', '--is-ancestor', run.head_sha, head]);

        const jobs = await github.paginate(github.rest.actions.listJobsForWorkflowRun, {
          owner,
          repo,
          run_id: run.id,
          filter: 'latest',
          per_page: 100,
        });

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

          const names = buildJobs[platform];
          const builds = jobs.filter(({ name }) => names.includes(name));
          if (builds.length === 0 || builds.every(({ conclusion }) => conclusion === 'skipped')) {
            continue;
          }

          resolved.add(platform);
          if (
            !names.every(
              (name) =>
                builds.filter((job) => job.name === name && job.conclusion === 'success').length ===
                1,
            )
          ) {
            core.info(`${platform}: run again because run ${run.id} did not pass every build.`);
            continue;
          }

          const files = execFileSync(
            'git',
            ['diff', '--name-only', '--no-renames', '-z', run.head_sha, head, '--'],
            { encoding: 'utf8' },
          )
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
      `Running native checks because their previous results cannot be reused: ${error.message}`,
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

module.exports = { detectBuildChanges };
