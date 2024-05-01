import type { KakaoChannel, Spec } from './spec/NativeKakaoChannel';

const KakaoChannel: Spec = {
  getConstants: () => {
    return {};
  },
  followChannel: (channelPublicId: string): Promise<boolean> => {},
  addChannel: (channelPublicId: string): Promise<void> => {},
  getAddChannelUrl: (channelPublicId: string): Promise<string> => {},
  openAddChannelUrl: (channelPublicId: string): Promise<string> => {},
  chatChannel: (channelPublicId: string): Promise<void> => {},
  getChatChannelUrl: (channelPublicId: string): Promise<string> => {},
  openChatChannelUrl: (channelPublicId: string): Promise<string> => {},
  channels: (channelPublicIds?: string[]): Promise<KakaoChannel[]> => {},
};

export const {
  addChannel,
  getConstants,
  followChannel,
  channels,
  chatChannel,
  getAddChannelUrl,
  getChatChannelUrl,
  openAddChannelUrl,
  openChatChannelUrl,
} = KakaoChannel;
export default KakaoChannel;
