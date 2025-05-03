import { camelCaseObject, filterNonNullishKeys, is } from '@mj-studio/js-util';
import { kFetch, kFetchFormUrlEncoded, kGlobalStorage, kRunWebAPI } from '@react-native-kakao/core';
import * as querystring from 'querystring';

import {
  type KakaoLoginToken,
  type KakaoScopeInfo,
  type KakaoServiceTerms,
  type KakaoShippingAddressResult,
  type KakaoUser,
  type KakaoUserAPI,
} from './index';

declare const Kakao: {
  Auth: {
    authorize: Function;
    logout: Function;
    setAccessToken: Function;
  };
  API: { request: Function };
};

function isoToUnix(value?: string | number) {
  if (!is.string(value)) {
    return value;
  }

  return Date.parse(value) / 1000;
}

const KakaoUser: KakaoUserAPI = {
  getAccessToken: () =>
    kRunWebAPI(async () => {
      const { id, expires_in, app_id } = (
        await kFetch<{
          id: number;
          expires_in: number;
          app_id: number;
        }>('https://kapi.kakao.com/v1/user/access_token_info', {
          headers: {
            ...kGlobalStorage.headers,
          },
        })
      ).body;

      return {
        id,
        expiresIn: expires_in,
        appId: app_id,
      };
    }),
  issueAccessTokenWithCodeWeb: ({ clientSecret, code, redirectUri }) =>
    kRunWebAPI(async () => {
      const res = await kFetchFormUrlEncoded<{
        token_type: string;
        access_token: string;
        id_token?: string;
        expires_in: number;
        refresh_token: string;
        refresh_token_expires_in: number;
        scope?: string;
      }>('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        body: filterNonNullishKeys({
          grant_type: 'authorization_code',
          client_id: kGlobalStorage.restApiKey,
          redirect_uri: encodeURIComponent(redirectUri),
          code,
          client_secret: clientSecret,
        }),
      }).then((r) => r.body);

      return camelCaseObject(res) as any;
    }),
  setAccessTokenWeb: (token: string) => {
    kGlobalStorage.accessToken = token;

    return new Promise((r) => {
      Kakao.Auth.setAccessToken(token);
      r(42);
    });
  },
  login: (params): Promise<KakaoLoginToken> =>
    kRunWebAPI(() => {
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
    }),
  logout: () => kRunWebAPI(() => Kakao.Auth.logout()),
  isLogined: async (): Promise<boolean> => {
    try {
      const { appId } = await KakaoUser.getAccessToken();

      return !!appId;
    } catch (e) {
      return false;
    }
  },
  isKakaoTalkLoginAvailable: async () => false,
  unlink: () => kRunWebAPI(() => Kakao.API.request({ url: '/v1/user/unlink' })),
  scopes: (scopes?: string[]) =>
    kRunWebAPI(async () => {
      const response = await Kakao.API.request({
        url: `/v2/user/scopes${scopes ? '?' + querystring.stringify({ scopes }) : ''}`,
      });

      return camelCaseObject(response.scopes) as KakaoScopeInfo[];
    }),
  revokeScopes: (scopes: string[]) =>
    kRunWebAPI(() =>
      Kakao.API.request({
        url: '/v2/user/revoke/scopes',
        data: {
          scopes,
        },
      }),
    ),
  serviceTerms: () =>
    kRunWebAPI(
      async () =>
        camelCaseObject(
          (
            await Kakao.API.request({
              url: '/v2/user/service_terms',
            })
          ).service_terms.map((v) => ({
            ...v,
            agreed_at: v.agreed_at ? isoToUnix(v.agreed_at) : null,
          })),
        ) as KakaoServiceTerms[],
    ),
  shippingAddresses: () =>
    kRunWebAPI(
      async () =>
        camelCaseObject(
          await Kakao.API.request({
            url: '/v1/user/shipping_address',
          }),
        ) as KakaoShippingAddressResult,
    ),
  me: () =>
    kRunWebAPI(async () => {
      const ret: any = camelCaseObject(await Kakao.API.request({ url: '/v2/user/me' }));
      const kakaoAccount = ret.kakaoAccount ?? {};
      const properties = ret.properties ?? {};

      return {
        ...ret,
        ...properties,
        ...kakaoAccount,
        email: kakaoAccount.email,
        name: null,
        nickname: kakaoAccount.profile.nickname,
        profileImageUrl: properties.profileImage,
        thumbnailImageUrl: properties.thumbnailImage,
        phoneNumber: kakaoAccount.profile.phoneNumber,
        isEmailValid: ret.isEmailValid,
        isEmailVerified: ret.isEmailVerified,
        connectedAt: isoToUnix(ret.connectedAt),
        synchedAt: isoToUnix(ret.synchedAt),
      } as KakaoUser;
    }),
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
  issueAccessTokenWithCodeWeb,
  getAccessToken,
} = KakaoUser;

export default KakaoUser;
