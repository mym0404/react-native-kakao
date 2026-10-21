import { mobile } from '@e2e-dev/mobile';
import type { E2EConfig } from 'e2e';
import { relative, resolve } from 'node:path';

import appConfig from './example/app.json';

const platform = process.env.KAKAO_E2E_PLATFORM;
if (platform !== 'ios' && platform !== 'android') {
  throw new Error('Use yarn e2e test [android|ios|both]');
}

const device = process.env.KAKAO_E2E_DEVICE;
const output = process.env.KAKAO_E2E_OUTPUT;
if (!device || !output) {
  throw new Error('E2E device and output are required');
}

export default {
  projectId: 'react-native-kakao',
  tests: ['script/e2e/scenarios.e2e.ts'],
  workers: 1,
  retries: 0,
  timeout: 240000,
  cleanupTimeout: 30000,
  launchTimeout: 120000,
  actionTimeout: 120000,
  assertionTimeout: 15000,
  cache: 'off',
  trace: 'off',
  video: 'off',
  output: relative(import.meta.dirname, resolve(output)),
  reporters: ['list', 'junit', 'markdown'],
  targets: [
    {
      name: platform,
      engine: mobile({
        platform,
        device,
        session: process.env.KAKAO_E2E_SESSION,
        snapshot: 'full',
      }),
      app: {
        appPath: process.env.KAKAO_E2E_APP,
        bundleId:
          platform === 'ios' ? appConfig.expo.ios.bundleIdentifier : appConfig.expo.android.package,
      },
    },
  ],
} satisfies E2EConfig;
