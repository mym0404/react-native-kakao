import type { ConfigPlugin } from 'expo/config-plugins';
import { AndroidConfig, withAndroidManifest } from 'expo/config-plugins';

import type { KakaoAndroidConfig } from './type';

const withAndroid: ConfigPlugin<{
  nativeAppKey: string;
  android: KakaoAndroidConfig;
}> = (
  config,
  {
    android: {
      authCodeHandlerActivity,
      forwardKakaoLinkIntentFilterToMainActivity,
      followChannelHandlerActivity,
    },
    nativeAppKey,
  },
) => {
  config = withAndroidManifest(config, (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

    mainApplication.activity?.push(<AndroidConfig.Manifest.ManifestActivity>{
      $: {},
    });

    const injectActivity = ({
      activityName,
      activity,
    }: {
      activityName: string;
      activity: AndroidConfig.Manifest.ManifestActivity;
    }) => {
      mainApplication.activity = [
        ...(mainApplication.activity || []).filter(
          (a) => a && a.$ && a.$['android:name'] !== activityName && a.$['android:name'],
        ),
        activity,
      ];
    };

    const mainActivity = mainApplication.activity?.find(
      (a) => a && a.$ && a.$['android:name']?.includes('MainActivity'),
    );

    if (authCodeHandlerActivity) {
      const name = 'com.kakao.sdk.auth.AuthCodeHandlerActivity';

      injectActivity({
        activity: {
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
        },
        activityName: name,
      });
    }

    if (followChannelHandlerActivity) {
      const name = 'com.kakao.sdk.talk.FollowChannelHandlerActivity';

      injectActivity({
        activity: {
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
                    'android:host': 'channel',
                    'android:scheme': `kakao${nativeAppKey}`,
                  },
                },
              ],
            },
          ],
        },
        activityName: name,
      });
    }

    if (forwardKakaoLinkIntentFilterToMainActivity && mainActivity) {
      if (
        !mainActivity['intent-filter'] ||
        !mainActivity['intent-filter']?.some((f) =>
          f.data?.some(
            (d) =>
              d.$?.['android:host'] === 'kakaolink' &&
              d.$?.['android:scheme'] === `kakao${nativeAppKey}`,
          ),
        )
      ) {
        mainActivity['intent-filter'] = [
          ...(mainActivity['intent-filter'] || []),
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
                  'android:host': 'kakaolink',
                  'android:scheme': `kakao${nativeAppKey}`,
                },
              },
            ],
          },
        ];
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
