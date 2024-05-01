import { NativeModules, Platform } from 'react-native';

import type { KakaoChannel, Spec } from './spec/NativeKakaoChannel';

export type { KakaoChannel } from './spec/NativeKakaoChannel';
const LINKING_ERROR =
  "The package '@react-native-kakao/channel' doesn't seem to be linked. Make sure: \n\n" +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

// @ts-expect-error
const isTurboModuleEnabled = global.__turboModuleProxy != null;

const Module = isTurboModuleEnabled
  ? require('./spec/NativeKakaoChannel').default
  : NativeModules.RNCKakaoChannel;

const Native: Spec = Module
  ? Module
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      },
    );

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

export function channels({ channelPublicIds }: { channelPublicIds?: string[] } = {}): Promise<
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
