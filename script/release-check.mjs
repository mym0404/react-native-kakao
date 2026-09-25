import { readFile } from 'node:fs/promises';

const PUBLIC_PACKAGES = new Set([
  '@react-native-kakao/channel',
  '@react-native-kakao/core',
  '@react-native-kakao/navi',
  '@react-native-kakao/share',
  '@react-native-kakao/social',
  '@react-native-kakao/user',
]);

const [branch, planPath] = process.argv.slice(2);

if (!['main', 'next'].includes(branch) || !planPath) {
  throw new Error('Usage: node script/release-check.mjs <main|next> <publish-plan.json>');
}

const plan = JSON.parse(await readFile(planPath, 'utf8'));
const releases = plan.plan?.flat() ?? [];
const preState = await readFile('.changeset/pre.json', 'utf8')
  .then(JSON.parse)
  .catch((error) => {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  });

if (plan.version !== 1 || releases.length === 0) {
  throw new Error('Expected a non-empty Changesets publish plan');
}

if (branch === 'main' && preState) {
  throw new Error('main must not publish with an active prerelease state');
}

if (branch === 'next' && (preState?.mode !== 'pre' || preState.tag !== 'next')) {
  throw new Error('next must publish from an active next prerelease state');
}

const expectedTag = branch === 'main' ? 'latest' : 'next';

for (const release of releases) {
  const isExpectedVersion =
    branch === 'main' ? !release.version.includes('-') : release.version.includes('-next.');

  if (
    release.kind !== 'publish' ||
    !PUBLIC_PACKAGES.has(release.name) ||
    release.access !== 'public' ||
    release.tag !== expectedTag ||
    !isExpectedVersion
  ) {
    throw new Error(`Unexpected ${branch} release: ${JSON.stringify(release)}`);
  }
}

console.log(`Verified ${releases.length} ${branch} release entries with the ${expectedTag} tag.`);
