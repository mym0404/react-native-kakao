import type { KakaoChannel } from './spec/NativeKakaoChannel';
import Native from './spec/NativeKakaoChannel';

export type { KakaoChannel } from './spec/NativeKakaoChannel';
export function followChannel(channelPublicId: string): Promise<boolean> {
  return Native.followChannel(channelPublicId);
}

export function addChannel(channelPublicId: string): Promise<void> {
  return Native.addChannel(channelPublicId);
}

export function getAddChannelUrl(channelPublicId: string): Promise<string> {
  return Native.getAddChannelUrl(channelPublicId);
}

export function openAddChannelUrl(channelPublicId: string): Promise<string> {
  return Native.openAddChannelUrl(channelPublicId);
}

export function chatChannel(channelPublicId: string): Promise<void> {
  return Native.chatChannel(channelPublicId);
}

export function getChatChannelUrl(channelPublicId: string): Promise<string> {
  return Native.getChatChannelUrl(channelPublicId);
}

export function openChatChannelUrl(channelPublicId: string): Promise<string> {
  return Native.openChatChannelUrl(channelPublicId);
}

export function channels({ channelPublicIds = [] }: { channelPublicIds?: string[] } = {}): Promise<
  KakaoChannel[]
> {
  return Native.channels(channelPublicIds);
}

const KakaoChannel = {
  followChannel,
  addChannel,
  getAddChannelUrl,
  openAddChannelUrl,
  chatChannel,
  getChatChannelUrl,
  openChatChannelUrl,
  channels,
};

export default KakaoChannel;
export type KakaoChannelAPI = typeof KakaoChannel;
