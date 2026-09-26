#!/usr/bin/env bun
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { $, type ProcessPromise } from 'zx';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const appId = 'com.rnkakao.example';
const appScheme = 'kakao-example';
const screens = ['home', 'user', 'share', 'navi', 'social', 'channel'];
const iosBuild = resolve(root, 'build/e2e/ios-build');
const timeoutMs = 180000;
const screenTimeoutMs = 60000;
const testTimeoutMs = 600000;
const adbTimeoutMs = 10000;
const metroUrl = 'http://localhost:8081';
const logCommand = async (command: ProcessPromise, path: string) => {
  const result = await command.nothrow();
  await writeFile(path, result.stdout + result.stderr);
  if (result.exitCode !== 0) {
    throw new Error(`Command exited ${result.exitCode}. See ${path}`);
  }
};

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
  yarn e2e metro android|ios
  yarn e2e test android|ios --device ID [--app PATH] [--output PATH] [--video]`;

  if (values.help) {
    console.log(usage);

    return;
  }

  const [operation, platform] = positionals;
  if (
    positionals.length !== 2 ||
    !['build', 'metro', 'test'].includes(operation ?? '') ||
    (platform !== 'android' && platform !== 'ios')
  ) {
    throw new Error(usage);
  }

  $.cwd = root;

  if (operation === 'metro') {
    $.env = { ...process.env, CI: '1' };
    await $`yarn example start --dev-client --host localhost --port 8081`;

    return;
  }

  const platformDir = resolve(root, 'build/e2e', platform);
  if (operation === 'build') {
    $.env = { ...process.env, NODE_ENV: 'development' };

    const abi = values.abi ?? (process.arch === 'arm64' ? 'arm64-v8a' : 'x86_64');
    if (!['arm64-v8a', 'x86_64'].includes(abi)) {
      throw new Error('--abi must be arm64-v8a or x86_64');
    }

    await mkdir(platformDir, { recursive: true });

    const buildLog = resolve(platformDir, 'build.log');
    if (platform === 'android') {
      await logCommand(
        $({
          cwd: resolve(root, 'example/android'),
        })`./gradlew :app:assembleDebug --no-daemon --console=plain -PreactNativeArchitectures=${abi}`,
        buildLog,
      );
    } else {
      await logCommand(
        $`xcodebuild -workspace example/ios/KakaoExample.xcworkspace -scheme KakaoExample -configuration Debug -sdk iphonesimulator -destination ${'generic/platform=iOS Simulator'} -derivedDataPath ${iosBuild} -quiet ARCHS=${process.arch === 'arm64' ? 'arm64' : 'x86_64'} ONLY_ACTIVE_ARCH=YES CODE_SIGNING_ALLOWED=NO COMPILER_INDEX_STORE_ENABLE=NO`,
        buildLog,
      );
    }

    console.log(`Build passed. Log: ${buildLog}`);

    return;
  }

  const device = values.device;
  if (!device?.trim() || device.startsWith('-') || /[\r\n]/.test(device)) {
    throw new Error('Pass --device with an Android serial or iOS Simulator UDID.');
  }

  const app = resolve(
    root,
    values.app ??
      (platform === 'android'
        ? 'example/android/app/build/outputs/apk/debug/app-debug.apk'
        : `${iosBuild}/Build/Products/Debug-iphonesimulator/KakaoExample.app`),
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
  const settle = 'wait 500';
  const devClientUrl = `${appScheme}://expo-development-client/?url=${encodeURIComponent(metroUrl)}&disableOnboarding=1`;
  const body = [
    `context platform=${platform}`,
    platform === 'android'
      ? `open ${appId} --relaunch --metro-host localhost --metro-port 8081 --launch-url ${JSON.stringify(devClientUrl)}`
      : `open ${appId} --metro-host localhost --metro-port 8081`,
    ...(platform === 'android'
      ? ['alert wait 30000', 'wait 2000', 'alert accept']
      : ['snapshot -i']),
    // Cold CI devices install and start the snapshot helper during the first wait.
    homeTitle,
    settle,
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
        settle,
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

    if (platform === 'ios') {
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

    console.log('Waiting for Metro...');
    await logCommand(
      $`curl --retry 60 --retry-delay 1 --retry-connrefused --fail --silent --show-error ${metroUrl}/status`,
      resolve(output, 'metro-status.log'),
    );

    if (platform === 'android') {
      await logCommand(
        $`adb -s ${device} reverse tcp:8081 tcp:8081`,
        resolve(output, 'metro-reverse.log'),
      );
    } else {
      await logCommand(
        $`xcrun simctl launch --terminate-running-process ${device} ${appId} --initialUrl ${`${metroUrl}?disableOnboarding=1`}`,
        resolve(output, 'launch.log'),
      );
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
