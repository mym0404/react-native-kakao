#!/usr/bin/env node
import { getIDToken } from '@actions/core';
import { fs } from 'zx';

const registry = 'https://registry.npmjs.org';
const pollInterval = 15_000;
const publishTimeout = 15 * 60_000;
const authMode = 'auth';
const mode = process.argv[2];

type Package = { name: string; version: string; private?: boolean };

async function main() {
  if (mode !== authMode && mode !== 'published') {
    throw new Error('Usage: node script/release-packages.ts <auth|published>');
  }

  const entries = await fs.readdir('packages', { withFileTypes: true });
  const packages = (
    await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry): Promise<Package> => fs.readJson(`packages/${entry.name}/package.json`)),
    )
  ).filter((pkg) => !pkg.private);

  if (mode === authMode) {
    const token = await getIDToken(`npm:${new URL(registry).host}`);
    const results = await Promise.allSettled(
      packages.map(async (pkg) => {
        const response = await fetch(
          `${registry}/-/npm/v1/oidc/token/exchange/package/${encodeURIComponent(pkg.name)}`,
          { method: 'POST', headers: { Authorization: `Bearer ${token}` } },
        );
        await response.body?.cancel();
        if (!response.ok) {
          throw new Error(
            `${pkg.name}: npm OIDC exchange failed (HTTP ${response.status}). Check its trusted publisher for this repository and release.yml.`,
          );
        }

        console.log(`Verified npm trusted publishing: ${pkg.name}`);
      }),
    );

    const errors = results.flatMap((result) =>
      result.status === 'rejected' ? [String(result.reason)] : [],
    );

    if (errors.length) {
      throw new Error(errors.join('\n'));
    }

    return;
  }

  const deadline = Date.now() + publishTimeout;
  let pending = packages;
  while (pending.length) {
    const results = await Promise.all(
      pending.map(async (pkg) => {
        const response = await fetch(
          `${registry}/${encodeURIComponent(pkg.name)}/${pkg.version}?verify=${Date.now()}`,
        );
        await response.body?.cancel();
        if (
          !response.ok &&
          response.status !== 404 &&
          response.status !== 429 &&
          response.status < 500
        ) {
          throw new Error(`${pkg.name}@${pkg.version}: registry returned HTTP ${response.status}.`);
        }

        if (response.ok) {
          console.log(`Verified npm publication: ${pkg.name}@${pkg.version}`);
        }

        return response.ok;
      }),
    );
    pending = pending.filter((_, index) => !results[index]);
    if (!pending.length) {
      return;
    }

    if (Date.now() >= deadline) {
      throw new Error(
        `Timed out waiting for npm: ${pending.map((pkg) => `${pkg.name}@${pkg.version}`).join(', ')}`,
      );
    }

    console.log(`Waiting for npm processing: ${pending.map((pkg) => pkg.name).join(', ')}`);
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
