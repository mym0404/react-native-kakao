#!/usr/bin/env node
import { pathToFileURL } from 'node:url';

type Release = {
  id: number;
  tag_name: string;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
};
type PullRequest = {
  title: string;
  body: string | null;
  merged_at: string | null;
  user: { login: string } | null;
};
type Api = <T>(path: string, method?: 'GET' | 'PATCH', body?: Record<string, unknown>) => Promise<T>;

export function isBackport(title: string, body: string): boolean {
  return /\bbackport\b|\bsync (?:recent )?merged\b|\bport(?:ed|ing)?\b.*\bto v[23]\b/i.test(title)
    || /-\s*\[[xX]\]\s*Backport\b/i.test(body);
}

function bulletReference(line: string, repository: string): number | undefined {
  if (/\b(?:not ported|excluded|not included)\b/i.test(line)) return undefined;
  const match = line.match(/^\s*[-*]\s+\[?(?:#(\d+)|https:\/\/github\.com\/([^/\s]+)\/([^/\s]+)\/pull\/(\d+))/);
  if (!match) return undefined;
  if (match[4] && (match[2] + '/' + match[3]).toLowerCase() !== repository.toLowerCase()) {
    return undefined;
  }
  const value = Number(match[1] ?? match[4]);
  return Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

export function upstreamPrNumbers(title: string, body: string, repository: string): number[] {
  const lines = body.split(/\r?\n/);
  const section = lines.findIndex((line) => /^##\s+Upstream PRs(?:\s*\([^)]*\))?\s*$/i.test(line));
  if (section < 0 && !isBackport(title, body)) return [];
  const numbers = new Set<number>();
  for (const line of lines.slice(section < 0 ? 0 : section + 1)) {
    if (section >= 0 && /^#{1,6}\s+/.test(line)) break;
    const number = bulletReference(line, repository);
    if (number !== undefined) numbers.add(number);
  }
  return [...numbers];
}

export function releasePrNumbers(body: string, repository: string): number[] {
  const prefix = 'https://github.com/' + repository + '/pull/';
  const numbers = new Set<number>();
  for (const line of body.split(/\r?\n/)) {
    if (!line.includes(prefix)) continue;
    for (const match of line.matchAll(/https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/pull\/(\d+)/g)) {
      if (match[0].startsWith(prefix)) numbers.add(Number(match[1]));
    }
  }
  return [...numbers];
}

export function withOriginalCredits(
  body: string,
  repository: string,
  credits: { number: number; title: string; author: string }[],
): string {
  const known = new Set(releasePrNumbers(body, repository));
  const lines: string[] = [];
  for (const credit of credits) {
    if (known.has(credit.number)) continue;
    known.add(credit.number);
    const title = credit.title.replace(/[\r\n]+/g, ' ').replace(/[<>]/g, '').trim();
    lines.push(
      '* ' + title + ' by @' + credit.author + ' in https://github.com/' +
        repository + '/pull/' + credit.number,
    );
  }
  if (!lines.length) return body;
  const section = '\n\n## Original contributors\n' + lines.join('\n') + '\n';
  const fullChangelog = body.indexOf('\n**Full Changelog**');
  return fullChangelog < 0
    ? body.trimEnd() + section
    : body.slice(0, fullChangelog).trimEnd() + section + '\n' + body.slice(fullChangelog + 1);
}

function versionParts(tag: string): [number, number] | null {
  const match = /^3\.(\d+)\.(\d+)$/.exec(tag);
  return match ? [Number(match[1]), Number(match[2])] : null;
}

export function newestStableV3(releases: Release[]): Release | undefined {
  return releases
    .filter((release) => !release.draft && !release.prerelease && versionParts(release.tag_name))
    .sort((left, right) => {
      const a = versionParts(left.tag_name)!;
      const b = versionParts(right.tag_name)!;
      return b[0] - a[0] || b[1] - a[1];
    })[0];
}

export async function reconcileRelease(
  repository: string,
  tag: string,
  branch: string,
  api: Api,
): Promise<void> {
  const route = 'repos/' + repository + '/releases';
  const release = await api<Release>(route + '/tags/' + encodeURIComponent(tag));
  const originalBody = release.body ?? '';
  const existing = new Set(releasePrNumbers(originalBody, repository));
  const credits: { number: number; title: string; author: string }[] = [];
  const upstream = new Set<number>();

  for (const number of existing) {
    const pr = await api<PullRequest>('repos/' + repository + '/pulls/' + number);
    if (!pr.merged_at) continue;
    for (const original of upstreamPrNumbers(pr.title, pr.body ?? '', repository)) {
      if (!existing.has(original)) upstream.add(original);
    }
  }

  for (const number of upstream) {
    const pr = await api<PullRequest>('repos/' + repository + '/pulls/' + number);
    if (!pr.merged_at || !pr.user?.login) {
      throw new Error('Upstream PR #' + number + ' is not merged or has no author.');
    }
    credits.push({ number, title: pr.title, author: pr.user.login });
  }

  const updated = withOriginalCredits(originalBody, repository, credits);
  if (updated !== originalBody) {
    await api<Release>(route + '/' + release.id, 'PATCH', { body: updated });
    console.log('Attributed ' + credits.length + ' upstream PR(s) in ' + tag);
  }

  if ((branch !== 'v2' && branch !== 'v3') || release.prerelease) return;
  const releases: Release[] = [];
  for (let page = 1; page <= 100; page++) {
    const batch = await api<Release[]>(route + '?per_page=100&page=' + page);
    releases.push(...batch);
    if (batch.length < 100) break;
    if (page === 100) throw new Error('Release list exceeds pagination limit.');
  }
  const latest = newestStableV3(releases);
  if (!latest) {
    if (branch === 'v3') throw new Error('No published stable v3 GitHub release found.');
    console.log('No stable v3 release yet; keeping v2 out of the Latest slot.');
    return;
  }
  await api<Release>(route + '/' + latest.id, 'PATCH', { make_latest: 'true' });
  const canonical = await api<Release>(route + '/latest');
  if (canonical.tag_name !== latest.tag_name) {
    throw new Error('Latest is ' + canonical.tag_name + ', expected ' + latest.tag_name);
  }
  console.log('Latest GitHub release: ' + latest.tag_name);
}

async function githubApi<T>(path: string, method: 'GET' | 'PATCH' = 'GET', body?: object): Promise<T> {
  const token = process.env.GH_TOKEN;
  if (!token) throw new Error('GH_TOKEN is required.');
  const response = await fetch('https://api.github.com/' + path, {
    method,
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    throw new Error(method + ' ' + path + ': ' + response.status + ' ' + await response.text());
  }
  return (await response.json()) as T;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const repository = process.env.GH_REPO ?? process.env.GITHUB_REPOSITORY ?? '';
  const [tag, branch] = process.argv.slice(2);
  try {
    if (tag === 'verify-backport') {
      const title = process.env.PR_TITLE ?? '';
      const body = process.env.PR_BODY ?? '';
      if (isBackport(title, body) && !upstreamPrNumbers(title, body, repository).length) {
        throw new Error('Backport PRs must list merged original PRs under "## Upstream PRs".');
      }
      console.log('Backport provenance verified.');
    } else {
      if (!repository || !tag || !branch || !['v2', 'v3', 'main'].includes(branch)) {
        throw new Error('Usage: node script/release-metadata.ts <version> <v2|v3|main>');
      }
      await reconcileRelease(repository, tag, branch, githubApi);
    }
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
