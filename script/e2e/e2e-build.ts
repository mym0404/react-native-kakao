import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { $ } from 'zx';

import { logCommand } from './e2e-log';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export const iosBuild = resolve(root, 'build/e2e/ios-build');

export const buildE2EApp = async ({
  platform,
  abi,
  platformDir,
}: {
  platform: 'android' | 'ios';
  abi: string | undefined;
  platformDir: string;
}) => {
  $.cwd = root;
  $.env = { ...process.env, NODE_ENV: 'production' };

  const buildAbi = abi ?? (process.arch === 'arm64' ? 'arm64-v8a' : 'x86_64');
  if (!['arm64-v8a', 'x86_64'].includes(buildAbi)) {
    throw new Error('--abi must be arm64-v8a or x86_64');
  }

  const buildLog = resolve(platformDir, 'build.log');
  if (platform === 'android') {
    await logCommand(
      $({
        cwd: resolve(root, 'example/android'),
      })`./gradlew :app:assembleRelease --build-cache --no-daemon --console=plain -PreactNativeArchitectures=${buildAbi}`,
      buildLog,
    );
  } else {
    const ccachePath = (await $`command -v ccache`).stdout.trim();
    $.env = {
      ...process.env,
      NODE_ENV: 'production',
      CCACHE_CONFIGPATH: resolve(root, 'node_modules/react-native/scripts/xcode/ccache.conf'),
    };

    // Xcode 26 uses compiler launchers, so bypass the ccache wrappers configured by Pods.
    await logCommand(
      $`xcodebuild -workspace example/ios/KakaoExample.xcworkspace -scheme KakaoExample -configuration Release -sdk iphonesimulator -destination ${'generic/platform=iOS Simulator'} -derivedDataPath ${iosBuild} -quiet ARCHS=${process.arch === 'arm64' ? 'arm64' : 'x86_64'} ONLY_ACTIVE_ARCH=YES CODE_SIGNING_ALLOWED=NO COMPILER_INDEX_STORE_ENABLE=NO CC=clang CXX=clang++ LD=clang LDPLUSPLUS=clang++ C_COMPILER_LAUNCHER=${ccachePath} CXX_COMPILER_LAUNCHER=${ccachePath}`,
      buildLog,
    );
  }

  console.log(`Build passed. Log: ${buildLog}`);
};
