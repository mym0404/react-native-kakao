import { kAssert, kRunWebAPI } from '@react-native-kakao/core';

import type { KakaoChannel as KakaoChannelInfo, KakaoChannelAPI } from './index';

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
  getAddChannelUrl: (channelPublicId) => kRunWebAPI(() => getChannelUrl(channelPublicId, 'friend')),
  openAddChannelUrl: (channelPublicId) => openChannelUrl(channelPublicId, 'friend'),
  chatChannel: (channelPublicId: string): Promise<void> =>
    kRunWebAPI(() => Kakao.Channel.chat({ channelPublicId })),
  getChatChannelUrl: (channelPublicId) => kRunWebAPI(() => getChannelUrl(channelPublicId, 'chat')),
  openChatChannelUrl: (channelPublicId) => openChannelUrl(channelPublicId, 'chat'),
  channels: ({ channelPublicIds = [] } = {}) =>
    kRunWebAPI(async () => {
      const response: {
        channels?: {
          channel_uuid: string;
          channel_public_id: string;
          relation: string;
          updated_at?: string;
        }[];
      } = await Kakao.API.request({
        url: '/v2/api/talk/channels',
        data: channelPublicIds.length
          ? { channel_ids: channelPublicIds.join(','), channel_id_type: 'channel_public_id' }
          : undefined,
      });

      return (response.channels ?? []).map((channel) => ({
        uuid: channel.channel_uuid,
        encodedId: channel.channel_public_id,
        relation: channel.relation.toLowerCase() as KakaoChannelInfo['relation'],
        updatedAt: channel.updated_at ? Date.parse(channel.updated_at) / 1000 : undefined,
      }));
    }),
};

function getChannelUrl(channelPublicId: string, action: 'friend' | 'chat') {
  kAssert(channelPublicId, 'channelPublicId is missing');

  return `https://pf.kakao.com/${encodeURIComponent(channelPublicId)}/${action}`;
}

function openChannelUrl(channelPublicId: string, action: 'friend' | 'chat') {
  return kRunWebAPI(() => {
    const url = getChannelUrl(channelPublicId, action);
    const popup = window.open(url, '_blank');
    kAssert(!!popup, 'The channel popup was blocked by the browser');
    popup!.opener = null;

    return url;
  });
}

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
