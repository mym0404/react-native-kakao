import { useState } from 'react';
import { useMount } from '@mj-studio/react-util';
import {
  isKakaoTalkLoginAvailable,
  loginWithKakaoAccount,
  loginWithKakaoTalk,
} from '@react-native-kakao/user';

import { Btn } from '../component/Btn';
import { StyledScrollView } from '../component/StyledScrollView';
import { Txt } from '../component/Txt';

export default function Page() {
  const [isKakaoTalkEnable, setKakaoTalkEnable] = useState(false);

  useMount(() => {
    isKakaoTalkLoginAvailable().then(setKakaoTalkEnable);
  });

  return (
    <StyledScrollView
      flex={1}
      contentContainerSx={{ pt: 12, pb: 48, alignItems: 'center', px: 4, gap: 4 }}
    >
      <Txt>{`Kakao Talk Available: ${isKakaoTalkEnable}`}</Txt>
      <Btn
        title={'Login With Kakao Talk'}
        onPress={() => {
          loginWithKakaoTalk();
        }}
      />
      <Btn
        title={'Login With Kakao Account'}
        onPress={() => {
          loginWithKakaoAccount();
        }}
      />
    </StyledScrollView>
  );
}
