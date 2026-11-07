#!/usr/bin/env node
import type { Report } from 'e2e';
import { parseArgs } from 'node:util';
import { $, fs, path } from 'zx';

import { buildE2EApp, iosBuild } from './e2e-build.ts';
import { logCommand } from './e2e-log.ts';

const root = path.resolve(import.meta.dirname, '../..');
const adbTimeoutMs = 10000;
const main = async () => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      device: { type: 'string' },
      app: { type: 'string' },
      output: { type: 'string' },
      abi: { type: 'string' },
      help: { type: 'boolean', default: false },
    },
  });

  const usage = `Usage:
  yarn e2e build android [--abi arm64-v8a|x86_64]
  yarn e2e build ios
  yarn e2e test [android|ios|both] [--device ID] [--app PATH] [--output PATH]`;

  if (values.help) {
    console.log(usage);

    return;
  }

  const [operation, platform] = positionals;
  if (
    operation === 'build' &&
    positionals.length === 2 &&
    (platform === 'android' || platform === 'ios')
  ) {
    const platformDir = path.resolve(root, 'build/e2e', platform);
    await fs.ensureDir(platformDir);
    await buildE2EApp({ platform, abi: values.abi, platformDir });

    return;
  }

  if (
    operation !== 'test' ||
    positionals.length > 2 ||
    (platform !== undefined && !['android', 'ios', 'both'].includes(platform))
  ) {
    throw new Error(usage);
  }

  const platforms =
    platform === 'android' || platform === 'ios' ? [platform] : (['ios', 'android'] as const);

  if (platforms.length === 2 && (values.device !== undefined || values.app !== undefined)) {
    throw new Error('Select android or ios when using --device or --app.');
  }

  const controller = new AbortController();
  const interrupt = () => controller.abort(new Error('E2E interrupted'));
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);

  try {
    const results = await Promise.allSettled(
      platforms.map((platform) =>
        runTest({
          platform,
          device: values.device,
          app: values.app,
          signal: controller.signal,
          output:
            values.output && platforms.length === 2
              ? path.resolve(root, values.output, platform)
              : values.output,
        }),
      ),
    );

    const errors = results.flatMap((result) =>
      result.status === 'rejected'
        ? [result.reason instanceof Error ? result.reason.message : String(result.reason)]
        : [],
    );

    if (errors.length) {
      throw new Error(errors.join('\n'));
    }
  } finally {
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
  }
};

const runTest = async ({
  platform,
  device,
  app: appPath,
  output: outputPath,
  signal,
}: {
  platform: 'android' | 'ios';
  device?: string;
  app?: string;
  output?: string;
  signal: AbortSignal;
}) => {
  const platformDir = path.resolve(root, 'build/e2e', platform);
  $.cwd = root;

  if (device !== undefined && (!device.trim() || device.startsWith('-') || /[\r\n]/.test(device))) {
    throw new Error('Invalid --device: use an Android serial or iOS Simulator UDID.');
  }

  const app = path.resolve(
    root,
    appPath ??
      (platform === 'android'
        ? 'example/android/app/build/outputs/apk/release/app-release.apk'
        : `${iosBuild}/Build/Products/Release-iphonesimulator/KakaoExample.app`),
  );

  await fs.stat(app).catch(() => {
    throw new Error(`App not found: ${app}. Run yarn e2e build ${platform} first.`);
  });

  const output = path.resolve(
    root,
    outputPath ?? `${platformDir}/${new Date().toISOString().replaceAll(':', '-')}`,
  );
  await fs.ensureDir(output);
  // Exclusive creation prevents a repeated run from passing with old evidence.
  await fs.writeJson(
    path.resolve(output, 'run.json'),
    { platform, device, app },
    {
      flag: 'wx',
    },
  );

  const artifacts = path.resolve(output, 'sdk');
  const outputFromRoot = path.relative(root, output);
  const isExternalOutput = outputFromRoot.startsWith('..') || path.isAbsolute(outputFromRoot);
  let sdkOutput = artifacts;

  let tests: { name: string; status: string; durationSeconds: number }[] = [];

  const errors: string[] = [];
  let durationSeconds = 0;
  const node = (await $`mise which node`).stdout.trim();
  const env = {
    ...process.env,
    AGENT_DEVICE_STATE_DIR: path.resolve(output, 'agent-device'),
    KAKAO_E2E_PLATFORM: platform,
    KAKAO_E2E_DEVICE: device,
    KAKAO_E2E_APP: app,
    KAKAO_E2E_SESSION: process.env.KAKAO_E2E_SESSION ?? `kakao-${platform}-${process.pid}`,
  };

  try {
    if (isExternalOutput) {
      await fs.ensureDir(path.resolve(root, 'build/e2e'));
      sdkOutput = await fs.mkdtemp(path.resolve(root, 'build/e2e/sdk-output-'));
    }

    console.log(`Verifying ${platform} menus and signed-out APIs...`);

    const testStarted = performance.now();
    try {
      const sdk = path.resolve(root, 'node_modules/e2e/dist/cli/bin.js');
      await logCommand(
        $({
          signal,
          detached: true,
          env: {
            ...env,
            KAKAO_E2E_OUTPUT: sdkOutput,
          },
        })`${node} ${sdk} run --config ${path.resolve(root, 'e2e.config.ts')}`.timeout(
          1500000,
          'SIGKILL',
        ),
        path.resolve(output, 'test.log'),
      );
    } finally {
      durationSeconds = (performance.now() - testStarted) / 1000;
    }
  } catch (cause) {
    errors.push(cause instanceof Error ? cause.message : String(cause));

    if (platform === 'android' && device !== undefined) {
      await logCommand(
        $`adb -s ${device} logcat -d`.timeout(adbTimeoutMs),
        path.resolve(output, 'logcat.log'),
      ).catch(() => undefined);
    }
  } finally {
    if (await fs.pathExists(env.AGENT_DEVICE_STATE_DIR)) {
      try {
        await logCommand(
          $({
            env,
          })`${node} ${path.resolve(root, 'node_modules/agent-device/bin/agent-device.mjs')} daemon stop --clean`.timeout(
            30000,
          ),
          path.resolve(output, 'cleanup.log'),
        );
      } catch (cause) {
        errors.push(`Failed to stop E2E automation: ${String(cause)}`);
      }
    }

    if (sdkOutput !== artifacts) {
      try {
        await fs.copy(sdkOutput, artifacts);
        await fs.remove(sdkOutput);
      } catch (cause) {
        errors.push(`Failed to retain SDK evidence: ${String(cause)}`);
      }
    }
  }

  try {
    const report: Report = await fs.readJson(path.resolve(artifacts, 'report.json'));
    if (!Array.isArray(report?.run?.results)) {
      throw new Error('Invalid SDK report');
    }

    const reportedTests = report.run.results.map((result) => {
      if (
        !Array.isArray(result.titlePath) ||
        !result.titlePath.every((title) => typeof title === 'string') ||
        typeof result.status !== 'string' ||
        !Array.isArray(result.attempts) ||
        result.attempts.some(
          (attempt) => !Number.isFinite(attempt.durationMs) || attempt.durationMs < 0,
        )
      ) {
        throw new Error('Invalid SDK test result');
      }

      return {
        name: result.titlePath.join(' '),
        status: result.status,
        durationSeconds:
          result.attempts.reduce((sum, attempt) => sum + attempt.durationMs, 0) / 1000,
      };
    });
    tests = reportedTests;

    await fs.copyFile(path.resolve(artifacts, 'junit.xml'), path.resolve(output, 'junit.xml'));

    const { run } = report;
    if (
      run.status !== 'passed' ||
      run.exitCode !== 0 ||
      run.usage.modelTokens !== 0 ||
      run.errors.length !== 0 ||
      run.summary.discovered === 0 ||
      run.summary.selected !== run.summary.discovered ||
      run.summary.executed !== run.summary.discovered ||
      run.summary.passed !== run.summary.discovered ||
      run.summary.skipped !== 0 ||
      run.results.length !== run.summary.discovered ||
      run.results.some((result) => result.platform !== platform || result.status !== 'passed')
    ) {
      throw new Error('E2E run did not pass every discovered test without model calls.');
    }
  } catch (cause) {
    errors.push(cause instanceof Error ? cause.message : String(cause));
  }

  if (signal.aborted) {
    errors.push(signal.reason instanceof Error ? signal.reason.message : String(signal.reason));
  }

  const error = errors.join('\n').trim();
  const status = errors.length ? 'failed' : 'passed';
  const summary = {
    platform,
    status,
    durationSeconds,
    tests,
    error,
  };
  await fs.writeJson(path.resolve(output, 'summary.json'), summary, { spaces: 2 });
  await fs.writeFile(
    path.resolve(output, 'index.html'),
    `<!doctype html><html lang="en"><meta charset="utf-8"><title>Example E2E · ${platform}</title>
<style>body{font:16px system-ui;margin:32px;background:#111;color:#eee}a{color:#9cf}</style>
<h1>${platform} · ${status}</h1><p>${durationSeconds.toFixed(2)}s</p>
<p><a href="test.log">Test log</a> · <a href="junit.xml">JUnit</a> · <a href="sdk/summary.md">Scenario report</a></p></html>`,
  );
  console.log(`${platform}: ${status}, ${durationSeconds.toFixed(2)}s. Results: ${output}`);
  if (errors.length) {
    throw new Error(error || 'E2E failed');
  }
};

await main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
