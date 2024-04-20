import type { ConfigPlugin } from '@expo/config-plugins';
import { withInfoPlist } from '@expo/config-plugins';

import type { KakaoIosConfig } from './type';

const withIos: ConfigPlugin<{
  nativeAppKey: string;
  ios: KakaoIosConfig;
}> = (config, { nativeAppKey }) => {
  if (!nativeAppKey) {
    throw new Error(
      "[@react-native-kakao/core] 'nativeAppKey' missing in expo config plugin value",
    );
  }

  config = withInfoPlist(config, (config) => {
    if (!config.modResults.LSApplicationQueriesSchemes) {
      config.modResults.LSApplicationQueriesSchemes = [];
    }

    if (!config.modResults.CFBundleURLTypes) {
      config.modResults.CFBundleURLTypes = [];
    }

    // core
    config.modResults.CFBundleURLTypes = [
      ...config.modResults.CFBundleURLTypes,
      {
        CFBundleURLSchemes: [`kakao${nativeAppKey}`],
        CFBundleURLName: 'Kakao',
      },
    ];

    // kakao share
    config.modResults.LSApplicationQueriesSchemes = [
      ...config.modResults.LSApplicationQueriesSchemes,
      'kakaokompassauth',
      'kakaolink',
      'kakaoplus',
    ];

    return config;
  });

  return config;
};

export { withIos };
