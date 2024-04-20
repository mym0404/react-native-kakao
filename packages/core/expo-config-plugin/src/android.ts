import type { ConfigPlugin } from '@expo/config-plugins';
import { AndroidConfig, withAndroidManifest } from '@expo/config-plugins';
import type { ManifestActivity } from '@expo/config-plugins/build/android/Manifest';

import type { KakaoAndroidConfig } from './type';

const withAndroid: ConfigPlugin<{
  nativeAppKey: string;
  android: KakaoAndroidConfig;
}> = (config, { android: { authCodeHandlerActivity }, nativeAppKey }) => {
  config = withAndroidManifest(config, (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

    if (authCodeHandlerActivity) {
      const newPreviewActivity: ManifestActivity = {
        '$': {
          'android:name': 'com.kakao.sdk.auth.AuthCodeHandlerActivity',
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
      };

      if (!mainApplication.activity) {
        mainApplication.activity = [];
        mainApplication.activity.push(newPreviewActivity);

        return config;
      }
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
