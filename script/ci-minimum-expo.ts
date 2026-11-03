import { $, fs, os, path } from 'zx';

const platform = process.argv[2];
if (platform !== 'android' && platform !== 'ios') {
  throw new Error('Usage: node script/ci-minimum-expo.ts <android|ios>');
}

const root = path.resolve(import.meta.dirname, '..');
const reactNativeVersion = '0.76.0';
const expoVersion = '52.0.0';
const appName = 'KakaoMapCompatibility';
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'rnkakao-minimum-expo-'));
const app = path.join(temporary, 'app');
const run = $({ cwd: root });

try {
  await fs.ensureDir(app);

  const metadata = JSON.parse(
    (await run`yarn npm info expo-template-blank@52.0.78 --fields dist --json`).stdout,
  );
  const response = await fetch(metadata.dist.tarball);
  if (!response.ok) {
    throw new Error(`Template download failed: ${response.status}`);
  }

  const template = path.join(temporary, 'template.tgz');
  await fs.writeFile(template, Buffer.from(await response.arrayBuffer()));
  await run`tar -xzf ${template} -C ${app} --strip-components=1`;

  const manifest = await fs.readJson(path.join(app, 'package.json'));
  manifest.name = 'kakao-map-compatibility';
  manifest.dependencies['react-native'] = reactNativeVersion;
  manifest.dependencies['expo-build-properties'] = '~0.13.3';

  const imports: string[] = [];
  for (const directory of await fs.readdir(path.join(root, 'packages'))) {
    const packagePath = path.join(root, 'packages', directory);
    if (!(await fs.pathExists(path.join(packagePath, 'expo-module.config.json')))) {
      continue;
    }

    const item = await fs.readJson(path.join(packagePath, 'package.json'));
    if (item.private) {
      continue;
    }

    if (item.peerDependencies['react-native'] !== `>=${reactNativeVersion}`) {
      throw new Error(
        `${item.name}: update the minimum Expo build when its support range changes.`,
      );
    }

    if (item.peerDependencies.expo !== `>=${expoVersion}`) {
      throw new Error(`${item.name}: expected Expo peer dependency >=${expoVersion}.`);
    }

    const archive = path.join(temporary, `${directory}.tgz`);
    await $({ cwd: packagePath })`yarn pack --out ${archive}`;
    manifest.dependencies[item.name] = `file:${archive}`;
    imports.push(`import '${item.name}';`);
  }

  if (!imports.length) {
    throw new Error('No published Expo modules were found.');
  }

  await fs.writeJson(path.join(app, 'package.json'), manifest, { spaces: 2 });
  await fs.writeJson(
    path.join(app, 'app.json'),
    {
      expo: {
        name: appName,
        slug: 'kakao-map-compatibility',
        newArchEnabled: true,
        plugins: [
          [
            'expo-build-properties',
            {
              android: {
                kotlinVersion: '1.9.25',
                extraMavenRepos: ['https://devrepo.kakao.com/nexus/repository/kakaomap-releases/'],
              },
            },
          ],
        ],
        android: { package: 'com.rnkakao.mapcompatibility' },
        ios: { bundleIdentifier: 'com.rnkakao.mapcompatibility' },
      },
    },
    { spaces: 2 },
  );

  const entry = path.join(app, 'index.js');
  await fs.writeFile(entry, `${imports.join('\n')}\n${await fs.readFile(entry, 'utf8')}`);
  await fs.writeFile(path.join(app, '.yarnrc.yml'), 'nodeLinker: node-modules\n');
  await fs.writeFile(path.join(app, 'yarn.lock'), '');

  const install = $({ cwd: app, env: { ...process.env, YARN_ENABLE_IMMUTABLE_INSTALLS: 'false' } });
  await install`yarn install`;

  const installed = await fs.readJson(path.join(app, 'node_modules/react-native/package.json'));
  if (installed.version !== reactNativeVersion) {
    throw new Error(`Expected RN ${reactNativeVersion}, got ${installed.version}`);
  }

  await install`yarn expo prebuild --platform ${platform} --no-install`;

  if (platform === 'android') {
    await $({
      cwd: path.join(app, 'android'),
      stdio: 'inherit',
    })`./gradlew :app:assembleRelease --no-daemon --console=plain -PreactNativeArchitectures=${process.arch === 'arm64' ? 'arm64-v8a' : 'x86_64'}`;
    await fs.access(path.join(app, 'android/app/build/outputs/apk/release/app-release.apk'));
  } else {
    await fs.copy(path.join(root, 'example/Gemfile'), path.join(app, 'Gemfile'));
    await fs.copy(path.join(root, 'example/Gemfile.lock'), path.join(app, 'Gemfile.lock'));
    await install`bundle install`;
    await $({
      cwd: path.join(app, 'ios'),
      env: { ...process.env, RCT_NEW_ARCH_ENABLED: '1' },
    })`bundle exec pod install`;

    await $({
      cwd: app,
      stdio: 'inherit',
    })`xcodebuild -toolchain com.apple.dt.toolchain.XcodeDefault -workspace ios/${appName}.xcworkspace -scheme ${appName} -configuration Release -sdk iphonesimulator -destination ${'generic/platform=iOS Simulator'} -derivedDataPath ${path.join(temporary, 'build')} -quiet ARCHS=${process.arch === 'arm64' ? 'arm64' : 'x86_64'} ONLY_ACTIVE_ARCH=YES CODE_SIGNING_ALLOWED=NO`;

    await fs.access(
      path.join(temporary, `build/Build/Products/Release-iphonesimulator/${appName}.app`),
    );
  }

  console.log(
    `Expo 52 / RN ${reactNativeVersion} ${platform}: Release build passed with ${imports.length} Expo modules.`,
  );
} finally {
  await fs.remove(temporary);
}
