#!/usr/bin/env bun
import { copyFile, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { $ } from 'zx';

import { buildE2EApp, iosBuild } from './e2e-build';
import { logCommand } from './e2e-log';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const screens = ['home', 'user', 'share', 'navi', 'social', 'channel'];
const timeoutMs = 180000;
const testTimeoutMs = 600000;
const adbTimeoutMs = 10000;
const main = async () => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      device: { type: 'string' },
      app: { type: 'string' },
      output: { type: 'string' },
      abi: { type: 'string' },
      video: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });

  const usage = `Usage:
  yarn e2e build android [--abi arm64-v8a|x86_64]
  yarn e2e build ios
  yarn e2e test android|ios --device ID [--app PATH] [--output PATH] [--video]`;

  if (values.help) {
    console.log(usage);

    return;
  }

  const [operation, platform] = positionals;
  if (
    positionals.length !== 2 ||
    !['build', 'test'].includes(operation ?? '') ||
    (platform !== 'android' && platform !== 'ios')
  ) {
    throw new Error(usage);
  }

  const platformDir = resolve(root, 'build/e2e', platform);
  if (operation === 'build') {
    await mkdir(platformDir, { recursive: true });
    await buildE2EApp({ platform, abi: values.abi, platformDir });

    return;
  }

  $.cwd = root;

  const device = values.device;
  if (!device?.trim() || device.startsWith('-') || /[\r\n]/.test(device)) {
    throw new Error('Pass --device with an Android serial or iOS Simulator UDID.');
  }

  const app = resolve(
    root,
    values.app ??
      (platform === 'android'
        ? 'example/android/app/build/outputs/apk/release/app-release.apk'
        : `${iosBuild}/Build/Products/Release-iphonesimulator/KakaoExample.app`),
  );

  await stat(app).catch(() => {
    throw new Error(`App not found: ${app}. Run yarn e2e build ${platform} first.`);
  });

  const output = resolve(
    root,
    values.output ?? `${platformDir}/${new Date().toISOString().replaceAll(':', '-')}`,
  );
  await mkdir(output, { recursive: true });
  // Exclusive creation prevents a repeated run from passing with old screenshots.
  await writeFile(resolve(output, 'run.json'), JSON.stringify({ platform, device, app }), {
    flag: 'wx',
  });

  const screenshots = screens.map((screen, index) => ({
    screen,
    file: `${String(index).padStart(2, '0')}-${screen}.png`,
  }));
  const flow = resolve(root, `script/e2e/menus.${platform}.yaml`);
  const artifacts = resolve(output, 'maestro');

  let error = '';
  let durationSeconds = 0;
  let installSeconds = 0;
  let prepareSeconds = 0;
  try {
    if (platform === 'android') {
      console.log('Waiting for Android services and an unlocked user...');

      const prepareStarted = performance.now();
      const requiredSamples = 3;
      let readySamples = 0;
      let preparationLog = '';
      // A cold emulator can restart system_server after sys.boot_completed becomes 1.
      while (readySamples < requiredSamples && performance.now() - prepareStarted < timeoutMs) {
        const result =
          await $`adb -s ${device} shell ${'pm path android && am get-started-user-state $(am get-current-user)'}`
            .timeout(adbTimeoutMs)
            .nothrow();
        preparationLog += `${result.stdout}${result.stderr}`;
        readySamples =
          result.exitCode === 0 &&
          result.stdout.startsWith('package:') &&
          result.stdout.trim().endsWith('RUNNING_UNLOCKED')
            ? readySamples + 1
            : 0;

        if (readySamples < requiredSamples) {
          await sleep(2000);
        }
      }

      prepareSeconds = (performance.now() - prepareStarted) / 1000;
      await writeFile(resolve(output, 'prepare.log'), preparationLog);
      if (readySamples < requiredSamples) {
        throw new Error(
          `Android services and user did not become ready within ${timeoutMs / 1000} seconds.`,
        );
      }
    }

    console.log(`Installing ${platform} app on ${device}...`);

    const installStarted = performance.now();
    await logCommand(
      platform === 'android'
        ? $`adb -s ${device} install -r ${app}`
        : $`xcrun simctl install ${device} ${app}`,
      resolve(output, 'install.log'),
    );
    installSeconds = (performance.now() - installStarted) / 1000;

    if (platform === 'android') {
      await logCommand(
        $`adb -s ${device} shell ${'settings put global window_animation_scale 0 && settings put global transition_animation_scale 0 && settings put global animator_duration_scale 0'}`,
        resolve(output, 'animations.log'),
      );
    }

    if (platform === 'ios') {
      await logCommand(
        $`xcrun simctl spawn ${device} defaults write com.apple.Accessibility ReduceMotionEnabled -bool YES`,
        resolve(output, 'reduce-motion.log'),
      );
    }

    console.log(`Verifying ${platform} menus...`);

    const testStarted = performance.now();
    try {
      await logCommand(
        $`maestro --device ${device} test ${flow} --format JUNIT --output ${resolve(output, 'junit.xml')} --test-output-dir ${artifacts} --debug-output ${artifacts} -e ${`RECORD_VIDEO=${values.video}`}`.timeout(
          testTimeoutMs,
        ),
        resolve(output, 'test.log'),
      );
    } finally {
      durationSeconds = (performance.now() - testStarted) / 1000;

      const files = await readdir(artifacts, { recursive: true }).catch(() => []);
      for (const { file } of screenshots) {
        const screenshot = files.find((path) => path.endsWith(`/takeScreenshot/${file}`));
        if (screenshot) {
          await copyFile(join(artifacts, screenshot), resolve(output, file));
        }
      }
    }

    for (const { file } of screenshots) {
      const png = await readFile(resolve(output, file));
      if (png.length < 24 || png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
        throw new Error(`Invalid screenshot: ${file}`);
      }
    }
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);

    if (platform === 'android') {
      await logCommand(
        $`adb -s ${device} logcat -d`.timeout(adbTimeoutMs),
        resolve(output, 'logcat.log'),
      ).catch(() => undefined);
    }

    const failureScreenshot = resolve(output, 'failure.png');
    await (
      platform === 'android'
        ? $`adb -s ${device} exec-out screencap -p > ${failureScreenshot}`
        : $`xcrun simctl io ${device} screenshot ${failureScreenshot}`
    )
      .timeout(15000)
      .nothrow()
      .catch(() => undefined);
  }

  const captured: typeof screenshots = [];
  for (const screenshot of screenshots) {
    const info = await stat(resolve(output, screenshot.file)).catch(() => undefined);
    if (info?.isFile() && info.size > 0) {
      captured.push(screenshot);
    }
  }

  const status = error ? 'failed' : 'passed';
  const summary = {
    platform,
    status,
    durationSeconds,
    installSeconds,
    prepareSeconds,
    screenshots: captured.length,
    expectedScreenshots: screens.length,
    video: values.video,
    error,
  };
  await writeFile(resolve(output, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(
    resolve(output, 'index.html'),
    `<!doctype html><html lang="en"><meta charset="utf-8"><title>Example E2E · ${platform}</title>
<style>body{font:16px system-ui;margin:32px;background:#111;color:#eee}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:24px}img{width:100%}a{color:#9cf}figure{margin:0}</style>
<h1>${platform} · ${status}</h1><p>${durationSeconds.toFixed(2)}s · ${captured.length}/${screens.length} screens</p>
<p><a href="test.log">Test log</a> · <a href="junit.xml">JUnit</a></p>
<main>${captured.map(({ screen, file }) => `<figure><figcaption>${screen}</figcaption><a href="${file}"><img src="${file}" alt="${screen}"></a></figure>`).join('')}</main></html>`,
  );
  console.log(`${platform}: ${status}, ${durationSeconds.toFixed(2)}s. Results: ${output}`);
  if (error) {
    throw new Error(error);
  }
};

await main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
