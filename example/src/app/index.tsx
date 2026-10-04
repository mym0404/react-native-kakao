import { Image } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { login, logout } from '@react-native-kakao/user';
import { Link } from 'expo-router';

import { Box } from '../component/Box';
import { Btn } from '../component/Btn';
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
        <Link testID={'menu-user'} href={'/user'}>
          <Txt textDecorationLine={'underline'} align={'center'}>
            {'@react-native-kakao/user'}
          </Txt>
        </Link>
        <Link testID={'menu-share'} href={'/share'}>
          <Txt textDecorationLine={'underline'} align={'center'}>
            {'@react-native-kakao/share'}
          </Txt>
        </Link>
        <Link testID={'menu-navi'} href={'/navi'}>
          <Txt textDecorationLine={'underline'} align={'center'}>
            {'@react-native-kakao/navi'}
          </Txt>
        </Link>
        <Link testID={'menu-social'} href={'/social'}>
          <Txt textDecorationLine={'underline'} align={'center'}>
            {'@react-native-kakao/social'}
          </Txt>
        </Link>
        <Link testID={'menu-channel'} href={'/channel'}>
          <Txt textDecorationLine={'underline'} align={'center'}>
            {'@react-native-kakao/channel'}
          </Txt>
        </Link>
      </Box>
    </StyledScrollView>
  );
}
