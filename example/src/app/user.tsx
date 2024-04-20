import { useState } from 'react';
import { formatJson } from '@mj-studio/js-util';
import { useMount } from '@mj-studio/react-util';
import { isKakaoTalkLoginAvailable, login } from '@react-native-kakao/user';

import { Btn } from '../component/Btn';
import { StyledScrollView } from '../component/StyledScrollView';
import { Txt } from '../component/Txt';

export default function Page() {
  const [isKakaoTalkEnable, setKakaoTalkEnable] = useState(false);
  const [result, setResult] = useState<object>();

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
        title={'Login'}
        onPress={() => {
          login().then((ret) => setResult(ret));
        }}
      />
      <Btn title={'Log Out'} onPress={() => {}} />
      <Btn title={'Deelte Token'} onPress={() => {}} />
      <Txt>{formatJson(result)}</Txt>
    </StyledScrollView>
  );
}
