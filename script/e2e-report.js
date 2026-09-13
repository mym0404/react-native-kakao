const fs = require('node:fs/promises');

module.exports = async ({ github, context, core }) => {
  const { owner, repo } = context.repo;
  const issue_number = context.issue.number;
  const marker = '<!-- example-agent-device-e2e -->';
  const { data: pr } = await github.rest.pulls.get({
    owner,
    repo,
    pull_number: issue_number,
  });

  if (pr.head.sha !== process.env.PR_HEAD_SHA) {
    return;
  }

  const artifacts = await github.paginate(github.rest.actions.listWorkflowRunArtifacts, {
    owner,
    repo,
    run_id: context.runId,
  });
  const runUrl = `${context.serverUrl}/${owner}/${repo}/actions/runs/${context.runId}`;
  const rows = [];
  const expectedScreenshots = 6;
  for (const platform of ['android', 'ios']) {
    const artifact = artifacts.find(({ name }) => name === `e2e-${platform}`);
    let result;
    try {
      result = JSON.parse(await fs.readFile(`e2e-results/e2e-${platform}/summary.json`, 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    if (
      result &&
      (result.platform !== platform ||
        !['passed', 'failed'].includes(result.status) ||
        !Number.isFinite(result.durationSeconds) ||
        result.durationSeconds < 0 ||
        !Number.isInteger(result.screenshots) ||
        result.screenshots < 0 ||
        result.screenshots > expectedScreenshots)
    ) {
      throw new Error(`Invalid ${platform} E2E summary`);
    }

    const status = result ? (result.status === 'passed' ? '✅ Passed' : '❌ Failed') : '⚠️ Not run';
    const seconds = result ? `${result.durationSeconds.toFixed(2)}s` : '—';
    const screenshots = result ? `${result.screenshots}/${expectedScreenshots}` : '—';
    const link = artifact
      ? `[Download](${runUrl}/artifacts/${artifact.id})`
      : `[CI logs](${runUrl})`;
    rows.push(`| ${platform} | ${status} | ${seconds} | ${screenshots} | ${link} |`);
  }

  const body = [
    marker,
    '',
    '## Example E2E · agent-device',
    '',
    `Commit: ${process.env.PR_HEAD_SHA} · [CI run](${runUrl})`,
    '',
    'Home → User → Home → Share → Home → Navi → Home → Social → Home → Channel',
    '',
    '| Platform | Result | Test time | Screenshots | Artifacts |',
    '| --- | --- | ---: | ---: | --- |',
    ...rows,
    '',
    'Verifies screen entry and titles. Excludes login, feature actions, and pixel comparisons.',
    'Time excludes app installation, device preparation, and builds. For tests that did not run, check build and device setup logs.',
    'Open `index.html` from the artifact ZIP to compare screenshots. PNGs, JUnit, and logs are retained for 14 days.',
  ].join('\n');
  await core.summary.addRaw(body).write();

  const comments = await github.paginate(github.rest.issues.listComments, {
    owner,
    repo,
    issue_number,
  });

  const previous = comments.find(
    ({ body: commentBody, user }) =>
      user?.login === 'github-actions[bot]' && commentBody?.startsWith(marker),
  );

  if (previous) {
    await github.rest.issues.updateComment({
      owner,
      repo,
      comment_id: previous.id,
      body,
    });
  } else {
    await github.rest.issues.createComment({ owner, repo, issue_number, body });
  }
};
