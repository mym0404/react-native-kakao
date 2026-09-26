const fs = require('node:fs/promises');
const platforms = ['android', 'ios'];
const screens = ['home', 'user', 'share', 'navi', 'social', 'channel'];

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
  const failurePaths = new Map();
  const expectedScreenshots = screens.length;
  const imageUrl = (path) =>
    `https://raw.githubusercontent.com/${owner}/${repo}/gh-pages/e2e/pr-${issue_number}/${path.replace('e2e-results/', '')}?sha=${process.env.PR_HEAD_SHA}`;

  const imagePreview = (path, alt) => {
    const url = imageUrl(path);

    return `<a href="${url}"><img src="${url}" alt="${alt}" width="220"></a>`;
  };

  for (const platform of platforms) {
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

    for (const [index, screen] of screens.entries()) {
      const path = `e2e-results/e2e-${platform}/${String(index).padStart(2, '0')}-${screen}.png`;
      const exists = await fs
        .stat(path)
        .then(() => true)
        .catch(() => false);

      if (exists) {
        imagePaths.set(`${platform}-${screen}`, path);
      }
    }

    const failurePath = `e2e-results/e2e-${platform}/failure.png`;
    const failureExists = await fs
      .stat(failurePath)
      .then(() => true)
      .catch(() => false);

    if (failureExists) {
      failurePaths.set(platform, failurePath);
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

  const screenshotRows = screens.map((screen) => {
    const cells = platforms.map((platform) => {
      const path = imagePaths.get(`${platform}-${screen}`);

      return path ? imagePreview(path, `${platform} ${screen}`) : '—';
    });

    return `| ${screen} | ${cells.join(' | ')} |`;
  });

  const failureRows = [...failurePaths].map(([platform, path]) => {
    return `| ${platform} | ${imagePreview(path, `${platform} failure`)} |`;
  });

  const body = [
    ...summary,
    '',
    '### Screenshots',
    '',
    '| Screen | Android | iOS |',
    '| --- | --- | --- |',
    ...screenshotRows,
    ...(failureRows.length
      ? [
          '',
          '### Failure screenshots',
          '',
          '| Platform | Screenshot |',
          '| --- | --- |',
          ...failureRows,
        ]
      : []),
  ].join('\n');
  await core.summary.addRaw(summary.join('\n')).write();

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
