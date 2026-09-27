#!/usr/bin/env bun
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { $ } from 'zx';

import { buildE2EApp, iosBuild } from './e2e-build';
import { logCommand } from './e2e-log';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const appId = 'com.rnkakao.example';
const screens = ['home', 'user', 'share', 'navi', 'social', 'channel'];
const timeoutMs = 180000;
const screenTimeoutMs = 60000;
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
  const titleSelector = 'id="screen-title"';
  const homeTitle = `wait ${JSON.stringify(`${titleSelector} text="Index"`)} ${screenTimeoutMs}`;
  const body = [
    `context platform=${platform}`,
    `open ${appId} --relaunch`,
    ...(platform === 'android' ? ['settings animations off'] : []),
    // Cold CI devices install and start the snapshot helper during the first wait.
    homeTitle,
    'screenshot "${OUTPUT}/00-home.png"',
    'scroll bottom',
    ...screenshots.slice(1).flatMap(({ screen, file }, index) => {
      const title = screen.charAt(0).toUpperCase() + screen.slice(1);
      // Android exposes the interactive button inside the testID-bearing parent.
      const selector =
        platform === 'android'
          ? `role="button" label="@react-native-kakao/${screen}"`
          : `id="menu-${screen}"`;

      return [
        `press ${JSON.stringify(selector)}`,
        `wait ${JSON.stringify(`${titleSelector} text="${title}"`)} ${screenTimeoutMs}`,
        `screenshot "\${OUTPUT}/${file}"`,
        ...(index < screens.length - 2 ? ['back', homeTitle] : []),
      ];
    }),
    'close',
  ].join('\n');
  const flow = resolve(output, 'menus.ad');
  await writeFile(flow, `${body}\n`);

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
      const stateDir = resolve(output, 'alert-state');

      await logCommand(
        $`agent-device open ${appId} --relaunch --platform android --serial ${device} --state-dir ${stateDir}`,
        resolve(output, 'alert-open.log'),
      );

      try {
        const alertResult =
          await $`agent-device alert get --platform android --serial ${device} --state-dir ${stateDir} --json`;
        await writeFile(resolve(output, 'alert-get.log'), alertResult.stdout + alertResult.stderr);

        const alertStatus: { data?: { alert?: unknown } } = JSON.parse(alertResult.stdout);

        if (alertStatus.data?.alert) {
          await logCommand(
            $`agent-device alert accept --platform android --serial ${device} --state-dir ${stateDir}`,
            resolve(output, 'alert-accept.log'),
          );
        }
      } finally {
        await logCommand(
          $`agent-device close --platform android --serial ${device} --state-dir ${stateDir}`,
          resolve(output, 'alert-close.log'),
        );
      }
    }

    if (platform === 'ios') {
      await logCommand(
        $`xcrun simctl spawn ${device} defaults write com.apple.Accessibility ReduceMotionEnabled -bool YES`,
        resolve(output, 'reduce-motion.log'),
      );

      console.log('Preparing the iOS XCTest runner...');

      const stateDir = resolve(output, 'device-state');
      const prepareStarted = performance.now();
      try {
        await logCommand(
          $`agent-device prepare ios-runner --platform ios --udid ${device} --state-dir ${stateDir} --timeout 600000`,
          resolve(output, 'prepare.log'),
        );
      } finally {
        // Test uses its own daemon; release the prepared runner lease first.
        await logCommand(
          $`agent-device daemon stop --state-dir ${stateDir}`,
          resolve(output, 'prepare-stop.log'),
        );
        prepareSeconds = (performance.now() - prepareStarted) / 1000;
      }
    }

    console.log(`Verifying ${platform} menus...`);

    const testStarted = performance.now();
    try {
      await logCommand(
        $`agent-device test ${flow} --platform ${platform} ${platform === 'ios' ? '--udid' : '--serial'} ${device} --artifacts-dir ${resolve(output, 'native')} --report-junit ${resolve(output, 'junit.xml')} --timeout ${testTimeoutMs} --retries 0 -e ${`OUTPUT=${output}`} ${values.video ? ['--record-video'] : []}`,
        resolve(output, 'test.log'),
      );
    } finally {
      durationSeconds = (performance.now() - testStarted) / 1000;
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
