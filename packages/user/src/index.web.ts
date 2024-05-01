import type {
  KakaoLoginToken,
  KakaoScopeInfo,
  KakaoServiceTerms,
  KakaoShippingAddressResult,
  KakaoUser,
  KakaoUserAPI,
} from './index';

declare global {
  const Kakao: {
    Auth: {
      authorize: Function;
    };
  };
}

const KakaoUser: KakaoUserAPI = {
  login(params): Promise<KakaoLoginToken> {
    const { loginHint, nonce, prompt, redirectUri, scope, state, throughTalk } = params?.web ?? {};

    return Kakao.Auth.authorize({
      loginHint,
      nonce,
      prompt,
      redirectUri,
      scope,
      state,
      throughTalk,
    });
  },
  logout: (): Promise<void> => {},
  isLogined(): Promise<boolean> {},
  isKakaoTalkLoginAvailable(): Promise<boolean> {},
  unlink(): Promise<void> {},
  scopes(scopes?: string[]): Promise<KakaoScopeInfo[]> {},
  revokeScopes(scopes: string[]): Promise<void> {},
  serviceTerms(): Promise<KakaoServiceTerms[]> {},
  shippingAddresses(): Promise<KakaoShippingAddressResult> {},
  me(): Promise<KakaoUser> {},
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
} = KakaoUser;
export default KakaoUser;
