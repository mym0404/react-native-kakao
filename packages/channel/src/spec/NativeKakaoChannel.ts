import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface KakaoChannel {
  uuid: string;
  encodedId: string;
  relation: 'added' | 'none' | 'blocked' | 'unknown';
  updatedAt?: number; // unix
}

export interface Spec extends TurboModule {
  followChannel(channelPublicId: string): Promise<boolean>;
  addChannel(channelPublicId: string): Promise<void>;
  getAddChannelUrl(channelPublicId: string): Promise<string>;
  openAddChannelUrl(channelPublicId: string): Promise<string>;
  chatChannel(channelPublicId: string): Promise<void>;
  getChatChannelUrl(channelPublicId: string): Promise<string>;
  openChatChannelUrl(channelPublicId: string): Promise<string>;
  channels(): Promise<KakaoChannel[]>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNCKakaoChannel');
