import { Image } from 'react-native';
import { Link } from 'expo-router';

import { Box } from '../component/Box';
import { StyledScrollView } from '../component/StyledScrollView';
import { Txt } from '../component/Txt';
import { px } from '../util/px';

export default function Page() {
  return (
    <StyledScrollView flex={1} contentContainerSx={{ pt: 12, pb: 48, alignItems: 'center', px: 4 }}>
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
      <Link href={'/user'}>
        <Txt>{'User Page'}</Txt>
      </Link>
    </StyledScrollView>
  );
}
