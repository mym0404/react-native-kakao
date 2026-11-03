import type {
  KakaoTalkDisableSelectOption,
  KakaoTalkFriend,
  KakaoTalkFriendProfile,
  KakaoTalkFriendSelectOptions,
  KakaoTalkFriendSelectResult,
  KakaoTalkGetFriendsOptions,
  KakaoTalkGetFriendsResult,
  KakaoTalkPartnerFriendSelectOptions,
  KakaoTalkProfile,
} from './spec/NativeKakaoSocial';
import Native from './spec/NativeKakaoSocial';
import { validatePartnerFriendOptions } from './validatePartnerFriendOptions';

export type {
  KakaoTalkProfile,
  KakaoTalkFriendProfile,
  KakaoTalkFriendSelectOptions,
  KakaoTalkFriendSelectResult,
  KakaoTalkGetFriendsOptions,
  KakaoTalkFriend,
  KakaoTalkGetFriendsResult,
  KakaoTalkDisableSelectOption,
  KakaoTalkPartnerFriendSelectOptions,
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

export async function selectSinglePartnerFriend({
  mode = 'full',
  options = {},
}: {
  mode?: 'full' | 'popup';
  options?: KakaoTalkPartnerFriendSelectOptions;
} = {}): Promise<KakaoTalkFriendProfile | undefined> {
  validatePartnerFriendOptions(options, false);

  const { users } = await Native.selectPartnerFriends(false, mode, options);

  return users[0];
}

export async function selectMultiplePartnerFriends({
  mode = 'full',
  options = {},
}: {
  mode?: 'full' | 'popup';
  options?: KakaoTalkPartnerFriendSelectOptions;
} = {}): Promise<KakaoTalkFriendSelectResult> {
  validatePartnerFriendOptions(options, true);

  return Native.selectPartnerFriends(true, mode, options);
}

const KakaoSocial = {
  getTalkProfile,
  selectSingleFriend,
  selectMultipleFriends,
  selectSinglePartnerFriend,
  selectMultiplePartnerFriends,
  getFriends,
};
export default KakaoSocial;
export type KakaoSocialAPI = typeof KakaoSocial;
