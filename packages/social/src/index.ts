import type {
  KakaoTalkFriend,
  KakaoTalkFriendProfile,
  KakaoTalkFriendSelectOptions,
  KakaoTalkFriendSelectResult,
  KakaoTalkGetFriendsOptions,
  KakaoTalkGetFriendsResult,
  KakaoTalkProfile,
} from './spec/NativeKakaoSocial';
import Native from './spec/NativeKakaoSocial';

export type {
  KakaoTalkProfile,
  KakaoTalkFriendProfile,
  KakaoTalkFriendSelectOptions,
  KakaoTalkFriendSelectResult,
  KakaoTalkGetFriendsOptions,
  KakaoTalkFriend,
  KakaoTalkGetFriendsResult,
};

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
export type KakaoSocialAPI = typeof KakaoSocial;
