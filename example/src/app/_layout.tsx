import { useEffect, useRef } from 'react';
import FlashMessage from 'react-native-flash-message';
import { capitalize } from '@mj-studio/js-util';
import { useMount } from '@mj-studio/react-util';
import Core from '@react-native-kakao/core';
import { KakaoMap } from '@react-native-kakao/map';
import { issueAccessTokenWithCodeWeb, setAccessTokenWeb } from '@react-native-kakao/user';
import { StyledSystemProvider } from '@react-native-styled-system/core';
import { Stack, useGlobalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Box } from '../component/Box';
import { Txt } from '../component/Txt';
import AppTheme from '../design/AppTheme';

export default function RootLayout() {
  // const { top } = useSafeAreaInsets();

  const { code } = useGlobalSearchParams<{ code?: string }>();
  const accessTokenIssued = useRef(false);
  useEffect(() => {
    const go = async () => {
      const { accessToken } = await issueAccessTokenWithCodeWeb({
        code: code!,
        redirectUri: 'http://localhost',
      });
      setAccessTokenWeb(accessToken);
      accessTokenIssued.current = true;
    };

    if (code && !accessTokenIssued.current) {
      go();
    }
  }, [code]);

  useMount(() => {
    Core.initializeKakaoSDK('fb975c77483d1edbe69467fca6bb2a6e', {
      web: {
        javascriptKey: '7bd64215ea748be5c4a2bbcea40ebee9',
        restApiKey: '8b32d258f3f3fb553d86cfaa20964077',
      },
    });
    KakaoMap.initializeKakaoMapSDK('fb975c77483d1edbe69467fca6bb2a6e').then(console.log);
  });

  return (
    <StyledSystemProvider theme={AppTheme}>
      <StatusBar style={'light'} />
      <Box flex={1} bg={'bg'}>
        {/*<Link href={'/'}>*/}
        {/*  <RowCenter p={4} pt={px(top + 12)} gap={2}>*/}
        {/*    <Image source={require('../../assets/icon.png')} style={{ width: 32, height: 32 }} />*/}
        {/*    <Txt t={'b1'} weight={'700'}>*/}
        {/*      {'React Native Kakao'}*/}
        {/*    </Txt>*/}
        {/*  </RowCenter>*/}
        {/*</Link>*/}
        <Stack
          screenOptions={{
            headerShown: true,
            contentStyle: { backgroundColor: 'black' },
            headerTintColor: 'white',
            headerStyle: { backgroundColor: 'black' },
            headerTitle: (props) => <Txt weight={'bold'}>{capitalize(props.children)}</Txt>,
            animation: 'fade_from_bottom',
          }}
        />
      </Box>
      <FlashMessage position={'top'} duration={5000} type={'success'} />
    </StyledSystemProvider>
  );
}
