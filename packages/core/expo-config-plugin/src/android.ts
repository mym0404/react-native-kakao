import { AndroidConfig, type ConfigPlugin, withAndroidManifest } from '@expo/config-plugins';
import type { ManifestActivity } from '@expo/config-plugins/build/android/Manifest';

import type { KakaoAndroidConfig } from './type';

const withAndroid: ConfigPlugin<{
  nativeAppKey: string;
  android: KakaoAndroidConfig;
}> = (config, { android: { authCodeHandlerActivity }, nativeAppKey }) => {
  config = withAndroidManifest(config, (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

    mainApplication.activity?.push(<ManifestActivity>{
      $: {},
    });

    if (authCodeHandlerActivity) {
      const name = 'com.kakao.sdk.auth.AuthCodeHandlerActivity';
      const activity = {
        '$': {
          'android:name': name,
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.intent.action.VIEW',
                },
              },
            ],
            category: [
              { $: { 'android:name': 'android.intent.category.DEFAULT' } },
              { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
            ],
            data: [
              {
                $: {
                  'android:host': 'oauth',
                  'android:scheme': `kakao${nativeAppKey}`,
                },
              },
            ],
          },
        ],
      } satisfies ManifestActivity;

      mainApplication.activity = [
        ...(mainApplication.activity || []).filter((a) => a.$['android:name'] === name),
        activity,
      ];
    }

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

export { withAndroid };
