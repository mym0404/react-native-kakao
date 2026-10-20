import { Fragment, useState } from 'react';
import { showMessage } from 'react-native-flash-message';
import { formatJson } from '@mj-studio/js-util';
import {
  getFriends,
  getTalkProfile,
  type KakaoTalkProfile,
  selectMultipleFriends,
  selectSingleFriend,
} from '@react-native-kakao/social';

import { Btn } from '../component/Btn';
import { E2EApiAction } from '../component/E2EApiAction';
import { PrettyResult } from '../component/PrettyResult';
import { StyledScrollView } from '../component/StyledScrollView';

const pickerMode = 'full';

export default function Page() {
  const [profile, setProfile] = useState<KakaoTalkProfile>();

  return (
    <StyledScrollView
      flex={1}
      w={'100%'}
      contentContainerSx={{ pt: 12, pb: 48, alignItems: 'center', px: 4, gap: 4 }}
    >
      <E2EApiAction
        id={'talk-profile'}
        title={'Get Profile'}
        action={getTalkProfile}
        onSuccess={setProfile}
      />
      <PrettyResult label={'Profile'} result={profile} />
      {[
        { id: 'default', enableIndex: undefined },
        { id: 'enabled', enableIndex: true },
        { id: 'disabled', enableIndex: false },
      ].map(({ id, enableIndex }) => (
        <Fragment key={id}>
          <E2EApiAction
            id={`picker-index-single-${id}`}
            title={`Single Friend Index: ${id}`}
            action={async () => {
              const result = await selectSingleFriend({
                mode: pickerMode,
                options: { enableIndex },
              });

              return { hasSelection: result != null, hasUuid: !!result?.uuid };
            }}
          />
          <E2EApiAction
            id={`picker-index-multiple-${id}`}
            title={`Multiple Friends Index: ${id}`}
            action={async () => {
              const result = await selectMultipleFriends({
                mode: pickerMode,
                options: { enableIndex },
              });

              return { totalCount: result.totalCount, selectedCount: result.users.length };
            }}
          />
        </Fragment>
      ))}
      <Btn
        title={'Select Single Friend'}
        onPress={() =>
          selectSingleFriend({ mode: 'popup', options: {} })
            .then((res) => showMessage({ message: formatJson(res) }))
            .catch((e) => {
              if (e && typeof e === 'object') {
                if (e.code === 'TokenNotFound') {
                  showMessage({ type: 'warning', message: '토큰을 얻어오지 못했습니다' });
                } else {
                  // ...
                }
              }
            })
        }
      />
      <Btn
        title={'Select Multiple Friends'}
        onPress={() =>
          selectMultipleFriends({ mode: 'popup', options: {} })
            .then((res) => showMessage({ message: formatJson(res) }))
            .catch((e) => showMessage({ type: 'warning', message: e.message }))
        }
      />
      <Btn
        title={'Get Friends'}
        onPress={() =>
          getFriends({ options: {} })
            .then((res) => showMessage({ message: formatJson(res) }))
            .catch((e) => showMessage({ type: 'warning', message: e.message }))
        }
      />
    </StyledScrollView>
  );
}
