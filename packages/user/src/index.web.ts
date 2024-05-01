import { filterNonNullishKeys } from '@mj-studio/js-util';
import { kCreateWebError } from '@react-native-kakao/core';

import type {
  KakaoLoginToken,
  KakaoScopeInfo,
  KakaoServiceTerms,
  KakaoShippingAddressResult,
  KakaoUser,
  KakaoUserAPI,
} from './index';

declare const Kakao: {
  Auth: {
    authorize: Function;
    logout: Function;
    setAccessToken: Function;
  };
};

const KakaoUser: KakaoUserAPI = {
  setAccessTokenWeb: (token: string) => {
    Kakao.Auth.setAccessToken(token);
  },
  login: async (params): Promise<KakaoLoginToken> => {
    const { loginHint, nonce, prompt, redirectUri, scope, state, throughTalk, serviceTerms } =
      params?.web ?? {};

    return Kakao.Auth.authorize(
      filterNonNullishKeys({
        loginHint,
        nonce,
        prompt: prompt?.join(','),
        redirectUri,
        scope: scope?.join(','),
        serviceTerms: serviceTerms?.join(','),
        state,
        throughTalk,
      }),
    );
  },
  logout: () => Kakao.Auth.logout().catch(kCreateWebError),
  isLogined: (): Promise<boolean> => {},
  isKakaoTalkLoginAvailable: (): Promise<boolean> => {},
  unlink: (): Promise<void> => {},
  scopes: (scopes?: string[]): Promise<KakaoScopeInfo[]> => {},
  revokeScopes: (scopes: string[]): Promise<void> => {},
  serviceTerms: (): Promise<KakaoServiceTerms[]> => {},
  shippingAddresses: (): Promise<KakaoShippingAddressResult> => {},
  me: (): Promise<KakaoUser> => {},
};

export const {
  isKakaoTalkLoginAvailable,
  isLogined,
  login,
  logout,
  me,
  revokeScopes,
  scopes,
  serviceTerms,
  shippingAddresses,
  unlink,
  setAccessTokenWeb,
} = KakaoUser;
console.log(KakaoUser);

export default KakaoUser;
