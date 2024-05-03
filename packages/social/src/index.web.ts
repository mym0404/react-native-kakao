import type { KakaoSocialAPI } from './index';

// @ts-ignore
const KakaoSocial: KakaoSocialAPI = {};
export const { getFriends, getTalkProfile, selectMultipleFriends, selectSingleFriend } =
  KakaoSocial;
export default KakaoSocial;
