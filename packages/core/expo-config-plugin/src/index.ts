/* eslint-disable @typescript-eslint/no-shadow */
import {
  withInfoPlist,
  withAndroidManifest,
  type ConfigPlugin,
} from '@expo/config-plugins';

const withNaverMap: ConfigPlugin<{
  nativeAppKey: string;
  android?: {};
  ios?: {};
}> = (
  config,
  {
    nativeAppKey,
    /* android = {}, ios = {}*/
  }
) => {
  if (!nativeAppKey) {
    throw new Error(
      "[@react-native-kakao/core] 'nativeAppKey' missing in expo config plugin value"
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

  config = withAndroidManifest(config, (config) => {
    // const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(
    //   config.modResults
    // );

    return config;
  });

  // config = AndroidConfig.Permissions.withPermissions(
  //   config,
  //   [
  //       ? 'android.permission.ACCESS_FINE_LOCATION'
  //       ? 'android.permission.ACCESS_COARSE_LOCATION'
  //       ? 'android.permission.ACCESS_BACKGROUND_LOCATION'
  //   ].filter(Boolean)
  // );

  return config;
};

export default withNaverMap;
