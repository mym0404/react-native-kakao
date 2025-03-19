import { kRunWebAPI } from '@react-native-kakao/core';
import * as querystring from 'querystring';

import type { KakaoChannelAPI } from './index';

declare const Kakao: {
  Channel: {
    followChannel: Function;
    addChannel: Function;
    chat: Function;
  };
  API: {
    request: Function;
  };
};

const KakaoChannel: KakaoChannelAPI = {
  followChannel: (channelPublicId: string): Promise<boolean> =>
    kRunWebAPI(async () => {
      const result = await Kakao.Channel.followChannel({ channelPublicId });

      if (result && channelPublicId === result.channel_public_id && result.status === 'success') {
        return true;
      }

      return false;
    }),
  addChannel: (channelPublicId: string): Promise<void> =>
    kRunWebAPI(() => Kakao.Channel.addChannel({ channelPublicId })),
  getAddChannelUrl: (): Promise<string> =>
    kRunWebAPI(() => {
      throw { message: 'Use addChannel directly in web' };
    }),
  openAddChannelUrl: (): Promise<string> =>
    kRunWebAPI(() => {
      throw { message: 'Use addChannel directly in web' };
    }),
  chatChannel: (channelPublicId: string): Promise<void> =>
    kRunWebAPI(() => Kakao.Channel.chat({ channelPublicId })),
  getChatChannelUrl: (): Promise<string> =>
    kRunWebAPI(() => {
      throw { message: 'Use chatChannel directly in web' };
    }),
  openChatChannelUrl: (): Promise<string> =>
    kRunWebAPI(() => {
      throw { message: 'Use chatChannel directly in web' };
    }),
  channels: (params) =>
    kRunWebAPI(() =>
      Kakao.API.request({
        url: `/v1/api/talk/channels${params?.channelPublicIds ? `?${querystring.stringify({ channel_ids: params.channelPublicIds })}` : ''}`,
      }),
    ),
};

export const {
  addChannel,
  followChannel,
  channels,
  chatChannel,
  getAddChannelUrl,
  getChatChannelUrl,
  openAddChannelUrl,
  openChatChannelUrl,
} = KakaoChannel;
export default KakaoChannel;
