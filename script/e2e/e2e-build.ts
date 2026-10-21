import { $, fs, path } from 'zx';

import { logCommand } from './e2e-log.ts';

const root = path.resolve(import.meta.dirname, '../..');

export const iosBuild = path.resolve(root, 'build/e2e/ios-build');

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

  const buildLog = path.resolve(platformDir, 'build.log');
  if (platform === 'android') {
    const repositoryDir = await fs.mkdtemp(path.join(platformDir, 'repositories-'));
    try {
      const initScript = path.join(repositoryDir, 'content.gradle');
      await fs.writeFile(
        initScript,
        `gradle.beforeProject { project ->
  project.repositories.withType(org.gradle.api.artifacts.repositories.MavenArtifactRepository).configureEach { repo ->
    if (repo.url.toString().replaceAll('/+$', '') == 'https://devrepo.kakao.com/nexus/content/groups/public') {
      repo.content { includeGroup 'com.kakao.sdk' }
    }
  }
}
`,
      );

      await logCommand(
        $({
          cwd: path.resolve(root, 'example/android'),
        })`./gradlew :app:assembleRelease --init-script ${initScript} --build-cache --no-daemon --console=plain -PreactNativeArchitectures=${buildAbi}`,
        buildLog,
      );
    } finally {
      await fs.remove(repositoryDir);
    }
  } else {
    const ccachePath = (await $`command -v ccache`).stdout.trim();
    $.env = {
      ...process.env,
      NODE_ENV: 'production',
      CCACHE_CONFIGPATH: path.resolve(root, 'node_modules/react-native/scripts/xcode/ccache.conf'),
    };

    // Xcode 26 uses compiler launchers, so bypass the ccache wrappers configured by Pods.
    await logCommand(
      $`xcodebuild -workspace example/ios/KakaoExample.xcworkspace -scheme KakaoExample -configuration Release -sdk iphonesimulator -destination ${'generic/platform=iOS Simulator'} -derivedDataPath ${iosBuild} -quiet ARCHS=${process.arch === 'arm64' ? 'arm64' : 'x86_64'} ONLY_ACTIVE_ARCH=YES CODE_SIGNING_ALLOWED=NO COMPILER_INDEX_STORE_ENABLE=NO CC=clang CXX=clang++ LD=clang LDPLUSPLUS=clang++ C_COMPILER_LAUNCHER=${ccachePath} CXX_COMPILER_LAUNCHER=${ccachePath}`,
      buildLog,
    );
  }

  console.log(`Build passed. Log: ${buildLog}`);
};
