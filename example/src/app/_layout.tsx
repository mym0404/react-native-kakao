import { Image } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMount } from '@mj-studio/react-util';
import { initializeKakaoSDK } from '@react-native-kakao/core';
import { StyledSystemProvider } from '@react-native-styled-system/core';
import { Link, Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Box } from '../component/Box';
import { RowCenter } from '../component/Row';
import { Txt } from '../component/Txt';
import AppTheme from '../design/AppTheme';
import { px } from '../util/px';

export default function RootLayout() {
  const { top } = useSafeAreaInsets();

  useMount(() => {
    initializeKakaoSDK('5a9383961eadba5496cb4ff895e91a89');
  });

  return (
    <StyledSystemProvider theme={AppTheme}>
      <StatusBar style={'light'} />
      <Box flex={1} bg={'bg'}>
        <Link href={'/'}>
          <RowCenter p={4} pt={px(top + 12)} gap={2}>
            <Image source={require('../../assets/icon.png')} style={{ width: 32, height: 32 }} />
            <Txt t={'b1'} weight={'700'}>
              {'React Native Kakao'}
            </Txt>
          </RowCenter>
        </Link>
        <Slot />
      </Box>
      <FlashMessage position={'top'} />
    </StyledSystemProvider>
  );
}
