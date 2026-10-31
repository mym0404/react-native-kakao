import { Image, Platform, Pressable } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { getKakaoSDKInfo, initializeKakaoSDK, type KakaoSDKInfo } from '@react-native-kakao/core';
import { login, logout } from '@react-native-kakao/user';
import { Link } from 'expo-router';

import { Box } from '../component/Box';
import { Btn } from '../component/Btn';
import { E2EApiAction } from '../component/E2EApiAction';
import { StyledScrollView } from '../component/StyledScrollView';
import { Txt } from '../component/Txt';
import { px } from '../util/px';

export default function Page() {
  return (
    <StyledScrollView
      testID={'home-scroll'}
      flex={1}
      contentContainerSx={{ pt: 12, pb: 48, alignItems: 'center', px: 4 }}
    >
      <Image
        source={require('../../assets/icon.png')}
        style={{ width: 200, height: 200, resizeMode: 'contain' }}
      />
      <Txt weight={'900'} mt={10} t={'h1'}>
        {'React Native Kakao'}
      </Txt>
      <Txt weight={'bold'} mt={4} t={'b3'} opacity={0.5}>
        {'Native Kakao Sdk All In One Solution'}
      </Txt>
      <Box my={10} w={'100%'} h={px(1)} bg={'text'} opacity={0.8} />
      <Box gap={4} w={'100%'} alignItems={'center'}>
        <Btn
          minW={px(240)}
          title={'Login'}
          onPress={() => {
            login({
              web: {
                redirectUri: 'http://localhost',
                prompt: ['select_account'],
              },
            })
              .then(() => {
                showMessage({
                  type: 'success',
                  message: 'Login Success',
                });
              })
              .catch((e) =>
                showMessage({
                  type: 'warning',
                  message: e.message,
                }),
              );
          }}
        />
        <Btn
          minW={px(240)}
          title={'Log Out'}
          onPress={() => {
            logout()
              .then(() => {
                showMessage({
                  type: 'success',
                  message: 'Logout Success',
                });
              })
              .catch((e) =>
                showMessage({
                  type: 'warning',
                  message: e.message,
                }),
              );
          }}
        />
        {(['user', 'share', 'navi', 'social', 'channel', 'cert'] as const).map((module) => (
          <Link key={module} testID={`menu-${module}`} href={`/${module}`} asChild>
            <Pressable>
              <Txt textDecorationLine={'underline'} align={'center'}>
                {`@react-native-kakao/${module}`}
              </Txt>
            </Pressable>
          </Link>
        ))}
        <E2EApiAction
          id={'sdk-info'}
          title={'Get SDK Info'}
          action={async () => {
            const info = await getKakaoSDKInfo();

            return {
              version: info.version,
              isInitialized: info.isInitialized,
              hasAppKey: info.appKey != null,
              hasKaHeader: info.kaHeader != null,
              hasRedirectUri: info.redirectUri != null,
              loggingEnabled: info.loggingEnabled ?? null,
            };
          }}
        />
        {Platform.OS !== 'web' ? (
          <>
            <E2EApiAction
              id={'sdk-options'}
              title={'Check Native SDK Options'}
              action={async () => {
                const before = await getKakaoSDKInfo();
                const { appKey, redirectUri } = before;
                if (!appKey || !redirectUri) {
                  throw new Error('Initialize the SDK before checking native options.');
                }

                const customScheme = 'rnkakao-verification';
                let configured: KakaoSDKInfo;
                try {
                  await initializeKakaoSDK(appKey, { customScheme, loggingEnabled: true });
                  configured = await getKakaoSDKInfo();
                } finally {
                  await initializeKakaoSDK(appKey, {
                    customScheme: redirectUri.split('://')[0],
                    loggingEnabled: before.loggingEnabled,
                  });
                }

                const restored = await getKakaoSDKInfo();

                return {
                  didApplyCustomScheme: configured.redirectUri === `${customScheme}://oauth`,
                  didEnableLogging: configured.loggingEnabled === true,
                  didRestoreScheme: restored.redirectUri === redirectUri,
                  didRestoreLogging: restored.loggingEnabled === before.loggingEnabled,
                };
              }}
            />
            <E2EApiAction
              id={'sdk-android-identifier'}
              title={'Check Android SDK Identifier'}
              action={async () => {
                const before = await getKakaoSDKInfo();
                if (!before.appKey || !before.redirectUri) {
                  throw new Error('Initialize the SDK before checking its identifier.');
                }

                const sdkIdentifier = ' rnkakao_verification/1';
                const options = {
                  customScheme: before.redirectUri.split('://')[0],
                  loggingEnabled: before.loggingEnabled,
                };
                let configured: KakaoSDKInfo;
                try {
                  await initializeKakaoSDK(before.appKey, {
                    ...options,
                    android: { sdkIdentifier },
                  });
                  configured = await getKakaoSDKInfo();
                } finally {
                  await initializeKakaoSDK(before.appKey, options);
                }

                const restored = await getKakaoSDKInfo();

                return {
                  didApplyAndroidIdentifier:
                    Platform.OS === 'android' ? configured.kaHeader?.endsWith(sdkIdentifier) : null,
                  didIgnoreAndroidIdentifier:
                    Platform.OS === 'ios' ? configured.kaHeader === before.kaHeader : null,
                  didRemainInitialized: configured.isInitialized,
                  didPreserveScheme: configured.redirectUri === before.redirectUri,
                  didRestoreHeader: restored.kaHeader === before.kaHeader,
                };
              }}
            />
          </>
        ) : null}
      </Box>
    </StyledScrollView>
  );
}
