import type { KakaoChannelAPI } from './index';

// @ts-ignore
const KakaoChannel: KakaoChannelAPI = {
  // followChannel: (channelPublicId: string): Promise<boolean> => {},
  // addChannel: (channelPublicId: string): Promise<void> => {},
  // getAddChannelUrl: (channelPublicId: string): Promise<string> => {},
  // openAddChannelUrl: (channelPublicId: string): Promise<string> => {},
  // chatChannel: (channelPublicId: string): Promise<void> => {},
  // getChatChannelUrl: (channelPublicId: string): Promise<string> => {},
  // openChatChannelUrl: (channelPublicId: string): Promise<string> => {},
  // channels: (params) => {},
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
