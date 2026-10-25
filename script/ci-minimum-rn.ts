import { $, fs, os, path } from 'zx';

const platform = process.argv[2];
if (platform !== 'android' && platform !== 'ios') {
  throw new Error('Usage: node script/ci-minimum-rn.ts <android|ios>');
}

const root = path.resolve(import.meta.dirname, '..');
const version = '0.76.0';
const appName = 'KakaoCompatibility';
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'rnkakao-minimum-'));
const app = path.join(temporary, appName);
const run = $({ cwd: root });

try {
  await run`yarn dlx @react-native-community/cli@15.1.3 init ${appName} --version ${version} --directory ${app} --skip-install --install-pods false --skip-git-init`;

  const manifest = await fs.readJson(path.join(app, 'package.json'));
  const packages = await fs.readdir(path.join(root, 'packages'));
  const imports: string[] = [];
  for (const directory of packages) {
    const packagePath = path.join(root, 'packages', directory);
    const manifestPath = path.join(packagePath, 'package.json');
    if (!(await fs.pathExists(manifestPath))) {
      continue;
    }

    const item = await fs.readJson(manifestPath);
    if (item.private || !item.codegenConfig) {
      continue;
    }

    if (item.peerDependencies['react-native'] !== `>=${version}`) {
      throw new Error(`${item.name}: update the minimum RN build when its support range changes.`);
    }

    const archive = path.join(temporary, `${directory}.tgz`);
    await $({ cwd: packagePath })`yarn pack --out ${archive}`;
    manifest.dependencies[item.name] = `file:${archive}`;
    imports.push(`import '${item.name}';`);
  }

  if (!imports.length) {
    throw new Error('No Kakao native modules were found.');
  }

  await fs.writeJson(path.join(app, 'package.json'), manifest, { spaces: 2 });
  await fs.writeFile(path.join(app, '.yarnrc.yml'), 'nodeLinker: node-modules\n');
  await fs.writeFile(path.join(app, 'yarn.lock'), '');

  const index = path.join(app, 'index.js');
  await fs.writeFile(index, `${imports.join('\n')}\n${await fs.readFile(index, 'utf8')}`);

  const androidBuild = path.join(app, 'android/build.gradle');
  await fs.appendFile(
    androidBuild,
    '\nallprojects { repositories { maven { url "https://devrepo.kakao.com/nexus/content/groups/public/" } } }\n',
  );

  const install = $({ cwd: app, env: { ...process.env, YARN_ENABLE_IMMUTABLE_INSTALLS: 'false' } });
  await install`yarn install`;

  const installed = await fs.readJson(path.join(app, 'node_modules/react-native/package.json'));
  if (installed.version !== version) {
    throw new Error(`Expected RN ${version}, got ${installed.version}`);
  }

  if (platform === 'android') {
    await $({
      cwd: path.join(app, 'android'),
    })`./gradlew :app:assembleRelease --no-daemon --console=plain -PnewArchEnabled=true -PreactNativeArchitectures=${process.arch === 'arm64' ? 'arm64-v8a' : 'x86_64'}`;
    await fs.access(path.join(app, 'android/app/build/outputs/apk/release/app-release.apk'));
  } else {
    await fs.copy(path.join(root, 'example/Gemfile'), path.join(app, 'Gemfile'));
    await fs.copy(path.join(root, 'example/Gemfile.lock'), path.join(app, 'Gemfile.lock'));
    await install`bundle install`;
    await $({
      cwd: path.join(app, 'ios'),
      env: { ...process.env, RCT_NEW_ARCH_ENABLED: '1' },
    })`bundle exec pod install`;
    await install`xcodebuild -workspace ios/${appName}.xcworkspace -scheme ${appName} -configuration Release -sdk iphonesimulator -destination ${'generic/platform=iOS Simulator'} -derivedDataPath ${path.join(temporary, 'build')} -quiet ARCHS=${process.arch === 'arm64' ? 'arm64' : 'x86_64'} ONLY_ACTIVE_ARCH=YES CODE_SIGNING_ALLOWED=NO`;
    await fs.access(
      path.join(temporary, `build/Build/Products/Release-iphonesimulator/${appName}.app`),
    );
  }

  console.log(
    `RN ${version} ${platform}: Release build passed with ${imports.length} Kakao modules and the New Architecture.`,
  );
} finally {
  await fs.remove(temporary);
}
