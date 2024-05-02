import { NativeModules, Platform } from 'react-native';

import type {
  KakaoTalkFriend,
  KakaoTalkFriendProfile,
  KakaoTalkFriendSelectOptions,
  KakaoTalkFriendSelectResult,
  KakaoTalkGetFriendsOptions,
  KakaoTalkGetFriendsResult,
  KakaoTalkProfile,
  Spec,
} from './spec/NativeKakaoSocial';

export type {
  KakaoTalkProfile,
  KakaoTalkFriendProfile,
  KakaoTalkFriendSelectOptions,
  KakaoTalkFriendSelectResult,
  KakaoTalkGetFriendsOptions,
  KakaoTalkFriend,
  KakaoTalkGetFriendsResult,
};

const LINKING_ERROR =
  "The package '@react-native-kakao/social' doesn't seem to be linked. Make sure: \n\n" +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const isTurboModuleEnabled = global.__turboModuleProxy != null;

const Module = isTurboModuleEnabled
  ? require('./spec/NativeKakaoSocial').default
  : NativeModules.RNCKakaoSocial;

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

export function getTalkProfile(): Promise<KakaoTalkProfile> {
  return Native.getProfile();
}

export async function selectSingleFriend({
  mode = 'full',
  options = {},
}: {
  mode: 'full' | 'popup';
  options?: KakaoTalkFriendSelectOptions;
}): Promise<KakaoTalkFriendProfile | undefined> {
  const { users } = await Native.selectFriends(false, mode, options);

  return users[0];
}

export function selectMultipleFriends({
  mode = 'full',
  options = {},
}: {
  mode: 'full' | 'popup';
  options?: KakaoTalkFriendSelectOptions;
}) {
  return Native.selectFriends(true, mode, options);
}

export function getFriends({
  options = {},
}: {
  options?: KakaoTalkGetFriendsOptions;
}): Promise<KakaoTalkGetFriendsResult> {
  return Native.getFriends(options);
}

const KakaoSocial = { getTalkProfile, selectSingleFriend, selectMultipleFriends, getFriends };
export default KakaoSocial;
