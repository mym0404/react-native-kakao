import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  isBackport,
  newestStableV3,
  reconcileRelease,
  releasePrNumbers,
  upstreamPrNumbers,
  withOriginalCredits,
} from './release-metadata.ts';

const repo = 'mym0404/react-native-kakao';

test('backport provenance only includes applied source PRs', () => {
  const v2 = [
    '## Summary',
    '- #168: port currentActivity fixes.',
    '- #144: align web behavior.',
    '**Not ported to v2:** #145 image scraping.',
    'Fixes #167',
  ].join('\n');
  assert.deepEqual(upstreamPrNumbers('fix: backport Android changes', v2, repo), [168, 144]);
  assert.deepEqual(upstreamPrNumbers('fix: regular change', v2, repo), []);

  const section = [
    '## Upstream PRs',
    '- #168',
    '- [#144](https://github.com/mym0404/react-native-kakao/pull/144)',
    '- https://github.com/other/project/pull/5',
    '- #168',
    '## Other',
    '- #999: unrelated context',
  ].join('\n');
  assert.deepEqual(upstreamPrNumbers('feature: stable', section, repo), [168, 144]);
  assert.equal(isBackport('fix: sync merged changes to v3', ''), true);
  assert.equal(isBackport('fix: improve stable release notes', ''), false);
});

test('original credit is deduplicated while preserving full changelog', () => {
  const body = [
    "## What's Changed",
    '* backport by @maintainer in https://github.com/mym0404/react-native-kakao/pull/197',
    '',
    '**Full Changelog**: https://github.com/mym0404/react-native-kakao/compare/2.4.10...2.4.11',
  ].join('\n');
  const credits = [
    { number: 168, title: 'fix(android): currentActivity', author: 'bb8654838-lgtm' },
    { number: 168, title: 'duplicated', author: 'somebody' },
  ];
  const actual = withOriginalCredits(body, repo, credits);
  assert.match(actual, /## Original contributors/);
  assert.match(actual, /by @bb8654838-lgtm/);
  assert.ok(actual.indexOf('Original contributors') < actual.indexOf('Full Changelog'));
  assert.deepEqual(releasePrNumbers(actual, repo), [197, 168]);
  assert.equal(withOriginalCredits(actual, repo, credits), actual);
});

test('stable v3 selection sorts numerically and ignores v2 and prereleases', () => {
  const make = (id: number, tag_name: string, prerelease = false) => ({
    id, tag_name, body: '', prerelease, draft: false,
  });
  const latest = newestStableV3([
    make(1, '2.4.30'), make(2, '3.9.9'), make(3, '3.10.0'),
    make(4, '3.11.0-next.1', true), { ...make(5, '3.20.0'), draft: true },
  ]);
  assert.equal(latest?.tag_name, '3.10.0');
});

test('reconciliation credits original author, selects v3 and is idempotent', async () => {
  const changed: { path: string; payload: Record<string, unknown> }[] = [];
  const releases = [
    { id: 100, tag_name: '2.4.12', body: "## What's Changed\n* Backport by @maintainer in https://github.com/mym0404/react-native-kakao/pull/197\n", prerelease: false, draft: false },
    { id: 101, tag_name: '3.9.9', body: '', prerelease: false, draft: false },
    { id: 102, tag_name: '3.10.0', body: '', prerelease: false, draft: false },
  ];
  let latest = '2.4.12';
  const api = async <T>(path: string, method = 'GET', payload?: Record<string, unknown>): Promise<T> => {
    if (method === 'PATCH') {
      changed.push({ path, payload: payload ?? {} });
      const target = releases.find((release) => path.endsWith('/' + release.id));
      assert.ok(target);
      if (typeof payload?.body === 'string') target.body = payload.body;
      if (payload?.make_latest === 'true') latest = target.tag_name;
      return target as T;
    }
    if (path.endsWith('/releases/tags/2.4.12')) return releases[0] as T;
    if (path.endsWith('/releases/latest')) return releases.find((release) => release.tag_name === latest) as T;
    if (path.includes('/releases?')) return releases as T;
    if (path.endsWith('/pulls/197')) {
      return { title: 'fix: backport source', body: '## Upstream PRs\n- #168\n', merged_at: '2026-10-25', user: { login: 'maintainer' } } as T;
    }
    if (path.endsWith('/pulls/168')) {
      return { title: 'fix(android): currentActivity', body: '', merged_at: '2026-10-25', user: { login: 'bb8654838-lgtm' } } as T;
    }
    throw new Error('Unexpected route: ' + path);
  };
  await reconcileRelease(repo, '2.4.12', 'v2', api);
  assert.equal(latest, '3.10.0');
  assert.ok(releases[0]?.body.includes('by @bb8654838-lgtm'));
  assert.ok(changed.some((item) => item.path.endsWith('/102') && item.payload.make_latest === 'true'));
  assert.ok(!changed.some((item) => item.path.endsWith('/100') && item.payload.make_latest === 'true'));
  const writes = changed.filter((item) => typeof item.payload.body === 'string').length;
  await reconcileRelease(repo, '2.4.12', 'v2', api);
  assert.equal(changed.filter((item) => typeof item.payload.body === 'string').length, writes);
});
