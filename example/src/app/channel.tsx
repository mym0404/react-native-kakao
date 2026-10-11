import { showMessage } from 'react-native-flash-message';
import {
  addChannel,
  channels,
  chatChannel,
  followChannel,
  getAddChannelUrl,
  getChatChannelUrl,
  openAddChannelUrl,
  openChatChannelUrl,
} from '@react-native-kakao/channel';

import { Btn } from '../component/Btn';
import { E2EApiAction } from '../component/E2EApiAction';
import { StyledScrollView } from '../component/StyledScrollView';

const SHDW_CHANNEL = '_hJhxbj';

export default function Page() {
  return (
    <StyledScrollView
      flex={1}
      contentContainerSx={{ pt: 12, pb: 48, alignItems: 'center', px: 4, gap: 4 }}
    >
      <Btn
        title={'follow channel'}
        onPress={() => {
          followChannel(SHDW_CHANNEL)
            .then(console.log)
            .catch((e) => showMessage({ type: 'warning', message: e.message }));
        }}
      />
      <Btn
        title={'add channel'}
        onPress={() => {
          addChannel(SHDW_CHANNEL)
            .then(console.log)
            .catch((e) => showMessage({ type: 'warning', message: e.message }));
        }}
      />
      <E2EApiAction
        id={'channel-add-url'}
        title={'get add channel url'}
        action={() => getAddChannelUrl(SHDW_CHANNEL)}
        onSuccess={console.log}
      />
      <Btn
        title={'open add channel url'}
        onPress={() => {
          openAddChannelUrl(SHDW_CHANNEL)
            .then(console.log)
            .catch((e) => showMessage({ type: 'warning', message: e.message }));
        }}
      />
      <Btn
        title={'chat channel'}
        onPress={() => {
          chatChannel(SHDW_CHANNEL)
            .then(console.log)
            .catch((e) => showMessage({ type: 'warning', message: e.message }));
        }}
      />
      <E2EApiAction
        id={'channel-chat-url'}
        title={'get chat channel url'}
        action={() => getChatChannelUrl(SHDW_CHANNEL)}
        onSuccess={console.log}
      />
      <Btn
        title={'open chat channel url'}
        onPress={() => {
          openChatChannelUrl(SHDW_CHANNEL)
            .then(console.log)
            .catch((e) => showMessage({ type: 'warning', message: e.message }));
        }}
      />
      <Btn
        title={'get connected channels'}
        onPress={() => {
          channels()
            .then(console.log)
            .catch((e) => showMessage({ type: 'warning', message: e.message }));
        }}
      />
    </StyledScrollView>
  );
}
