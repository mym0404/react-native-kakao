import { useState } from 'react';
import { showMessage } from 'react-native-flash-message';
import { formatJson } from '@mj-studio/js-util';
import {
  getTalkProfile,
  type KakaoTalkProfile,
  selectMultipleFriends,
  selectSingleFriend,
} from '@react-native-kakao/social';

import { Btn } from '../component/Btn';
import { PrettyResult } from '../component/PrettyResult';
import { StyledScrollView } from '../component/StyledScrollView';

export default function Page() {
  const [profile, setProfile] = useState<KakaoTalkProfile>();

  return (
    <StyledScrollView
      flex={1}
      w={'100%'}
      contentContainerSx={{ pt: 12, pb: 48, alignItems: 'center', px: 4, gap: 4 }}
    >
      <Btn
        title={'Get Profile'}
        onPress={() =>
          getTalkProfile()
            .then(setProfile)
            .catch((e) => showMessage({ type: 'warning', message: e.message }))
        }
      />
      <PrettyResult label={'Profile'} result={profile} />
      <Btn
        title={'Select Single Friend'}
        onPress={() =>
          selectSingleFriend({ mode: 'full', options: {} })
            .then((res) => showMessage({ message: formatJson(res) }))
            .catch((e) => showMessage({ type: 'warning', message: e.message }))
        }
      />
      <Btn
        title={'Select Multiple Friends'}
        onPress={() =>
          selectMultipleFriends({ mode: 'full', options: {} })
            .then((res) => showMessage({ message: formatJson(res) }))
            .catch((e) => showMessage({ type: 'warning', message: e.message }))
        }
      />
    </StyledScrollView>
  );
}
