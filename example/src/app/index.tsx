import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useMount } from '@mj-studio/react-util';
import { Link, useGlobalSearchParams } from 'expo-router';

import { Box } from '../component/Box';
import { Btn } from '../component/Btn';
import { StyledScrollView } from '../component/StyledScrollView';
import { Txt } from '../component/Txt';
import { px } from '../util/px';
import timing = Animated.timing;
import loop = Animated.loop;
import { login, logout, setAccessTokenWeb } from '@react-native-kakao/user';

export default function Page() {
  const anim = useRef(new Animated.Value(0)).current;
  useMount(() => {
    loop(
      timing(anim, { toValue: 1, useNativeDriver: true, duration: 10000, easing: Easing.linear }),
    ).start();
  });

  const params = useGlobalSearchParams();
  useEffect(() => {
    if (params?.code) {
      setAccessTokenWeb(params!.code as string);
    }
  }, [params]);

  return (
    <StyledScrollView flex={1} contentContainerSx={{ pt: 12, pb: 48, alignItems: 'center', px: 4 }}>
      <Animated.Image
        source={require('../../assets/icon.png')}
        style={[
          { width: 200, height: 200, resizeMode: 'contain' },
          {
            transform: [
              {
                rotate: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
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
        <Link href={'/user'}>
          <Txt textDecorationLine={'underline'} align={'center'}>
            {'@react-native-kakao/user'}
          </Txt>
        </Link>
        <Link href={'/share'}>
          <Txt textDecorationLine={'underline'} align={'center'}>
            {'@react-native-kakao/share'}
          </Txt>
        </Link>
        <Link href={'/navi'}>
          <Txt textDecorationLine={'underline'} align={'center'}>
            {'@react-native-kakao/navi'}
          </Txt>
        </Link>
        <Link href={'/social'}>
          <Txt textDecorationLine={'underline'} align={'center'}>
            {'@react-native-kakao/social'}
          </Txt>
        </Link>
        <Link href={'/channel'}>
          <Txt textDecorationLine={'underline'} align={'center'}>
            {'@react-native-kakao/channel'}
          </Txt>
        </Link>
      </Box>
    </StyledScrollView>
  );
}
