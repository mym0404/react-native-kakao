import { useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useMount } from '@mj-studio/react-util';
import { Link } from 'expo-router';

import { Box } from '../component/Box';
import { StyledScrollView } from '../component/StyledScrollView';
import { Txt } from '../component/Txt';
import { px } from '../util/px';
import timing = Animated.timing;
import loop = Animated.loop;

export default function Page() {
  const anim = useRef(new Animated.Value(0)).current;
  useMount(() => {
    loop(
      timing(anim, { toValue: 1, useNativeDriver: true, duration: 10000, easing: Easing.linear }),
    ).start();
  });

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
      <Link href={'/user'}>
        <Txt textDecorationLine={'underline'}>{'@react-native-kakao/user'}</Txt>
      </Link>
    </StyledScrollView>
  );
}
