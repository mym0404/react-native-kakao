const fs = require('node:fs/promises');
const { execFileSync } = require('node:child_process');

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

  const runUrl = `${context.serverUrl}/${owner}/${repo}/actions/runs/${context.runId}`;
  const rows = [];
  const imagePaths = new Map();
  const expectedScreenshots = 6;
  for (const platform of ['android', 'ios']) {
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
    rows.push(`| ${platform} | ${status} | ${seconds} | ${screenshots} |`);

    for (const [index, screen] of ['home', 'user', 'share', 'navi', 'social', 'channel'].entries()) {
      const path = `e2e-results/e2e-${platform}/${String(index).padStart(2, '0')}-${screen}.png`;
      const exists = await fs.stat(path).then(() => true).catch(() => false);
      if (exists) {
        imagePaths.set(`${platform}-${screen}`, path);
      }
    }
  }

  const summary = [
    marker,
    '',
    '## Example E2E · agent-device',
    '',
    `Commit: ${process.env.PR_HEAD_SHA} · [CI run](${runUrl})`,
    '',
    'Home → User → Home → Share → Home → Navi → Home → Social → Home → Channel',
    '',
    '| Platform | Result | Test time | Screenshots |',
    '| --- | --- | ---: | ---: |',
    ...rows,
    '',
    'Verifies screen entry and titles. Excludes login, feature actions, and pixel comparisons.',
    'Time excludes app installation, device preparation, and builds. For tests that did not run, check build and device setup logs.',
  ];
  const screenshotRows = ['home', 'user', 'share', 'navi', 'social', 'channel'].map(
    (screen) => {
      const cells = ['android', 'ios'].map((platform) => {
        const path = imagePaths.get(`${platform}-${screen}`);
        return path ? `![${platform} ${screen}](${path})` : '—';
      });
      return `| ${screen} | ${cells.join(' | ')} |`;
    },
  );
  const body = [
    ...summary,
    '',
    '### Screenshots',
    '',
    '| Screen | Android | iOS |',
    '| --- | --- | --- |',
    ...screenshotRows,
  ].join('\n');
  await core.summary.addRaw(summary.join('\n')).write();

  const comments = await github.paginate(github.rest.issues.listComments, {
    owner,
    repo,
    issue_number,
  });

  const previous = comments.filter(
    ({ body: commentBody, user }) =>
      user?.login && commentBody?.startsWith(marker),
  );
  const bodyPath = `${process.env.RUNNER_TEMP ?? '.'}/e2e-comment.md`;
  await fs.writeFile(bodyPath, `${body}\n`);
  const attachmentArgs = [...imagePaths.values()].flatMap((path) => ['--attach', path]);
  execFileSync(
    'gh',
    [
      'pr',
      'comment',
      String(issue_number),
      '--repo',
      `${owner}/${repo}`,
      '--body-file',
      bodyPath,
      ...attachmentArgs,
    ],
    { stdio: 'inherit' },
  );

  for (const comment of previous) {
    try {
      execFileSync(
        'gh',
        ['api', '--method', 'DELETE', `repos/${owner}/${repo}/issues/comments/${comment.id}`],
        { stdio: 'inherit' },
      );
    } catch {
      core.warning(`Could not delete previous E2E comment ${comment.id}`);
    }
  }
};
