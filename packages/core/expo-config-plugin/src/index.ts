import { type ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';

import { withAndroid } from './android';
import { withIos } from './ios';
import type { KakaoAndroidConfig, KakaoIosConfig } from './type';

const withKakao: ConfigPlugin<{
  nativeAppKey: string;
  android?: KakaoAndroidConfig;
  ios?: KakaoIosConfig;
}> = (config, { nativeAppKey, android, ios }) => {
  if (!nativeAppKey) {
    throw new Error(
      "[@react-native-kakao/core] 'nativeAppKey' missing in expo config plugin value",
    );
  }

  if (android) {
    config = withAndroid(config, { android, nativeAppKey });
  }

  if (ios) {
    config = withIos(config, { ios, nativeAppKey });
  }

  return config;
};

// @ts-ignore
const pkg = require('@react-native-kakao/core/package.json');
export default createRunOncePlugin(withKakao, pkg.name, pkg.version);
