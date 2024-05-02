import { camelCaseObject, filterNonNullishKeys, is } from '@mj-studio/js-util';
import {
  kCreateWebError,
  kFetch,
  kFetchFormUrlEncoded,
  kGlobalStorage,
} from '@react-native-kakao/core';
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
  getAccessToken: async () => {
    try {
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
    } catch (e: any) {
      throw kCreateWebError(e);
    }
  },
  issueAccessTokenWithCodeWeb: async ({ clientSecret, code, redirectUri }) => {
    try {
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
    } catch (e: any) {
      throw kCreateWebError(e);
    }
  },
  setAccessTokenWeb: (token: string) => {
    kGlobalStorage.accessToken = token;

    return new Promise((r) => {
      Kakao.Auth.setAccessToken(token);
      r(42);
    });
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
  isLogined: async (): Promise<boolean> => {
    try {
      const { appId } = await KakaoUser.getAccessToken();

      return !!appId;
    } catch (e) {
      return false;
    }
  },
  isKakaoTalkLoginAvailable: async (): Promise<boolean> => false,
  unlink: (): Promise<void> => Kakao.API.request({ url: '/v1/user/unlink' }).catch(kCreateWebError),
  scopes: async (scopes?: string[]): Promise<KakaoScopeInfo[]> => {
    try {
      const response = await Kakao.API.request({
        url: `/v2/user/scopes${scopes ? '?' + querystring.stringify({ scopes }) : ''}`,
      });

      return camelCaseObject(response.scopes) as KakaoScopeInfo[];
    } catch (e: any) {
      throw kCreateWebError(e);
    }
  },
  revokeScopes: async (scopes: string[]): Promise<void> => {
    try {
      await Kakao.API.request({
        url: '/v2/user/revoke/scopes',
        data: {
          scopes,
        },
      });
    } catch (e: any) {
      throw kCreateWebError(e);
    }
  },
  serviceTerms: async (): Promise<KakaoServiceTerms[]> => {
    try {
      return camelCaseObject(
        (
          await Kakao.API.request({
            url: '/v2/user/service_terms',
          })
        ).service_terms.map((v) => ({
          ...v,
          agreed_at: v.agreed_at ? isoToUnix(v.agreed_at) : null,
        })),
      ) as KakaoServiceTerms[];
    } catch (e: any) {
      throw kCreateWebError(e);
    }
  },
  shippingAddresses: async (): Promise<KakaoShippingAddressResult> => {
    try {
      return camelCaseObject(
        await Kakao.API.request({
          url: '/v1/user/shipping_address',
        }),
      ) as KakaoShippingAddressResult;
    } catch (e: any) {
      throw kCreateWebError(e);
    }
  },
  me: async (): Promise<KakaoUser> => {
    try {
      const ret = camelCaseObject(await Kakao.API.request({ url: '/v2/user/me' })) as KakaoUser;

      return {
        ...ret,
        connectedAt: isoToUnix(ret.connectedAt),
        synchedAt: isoToUnix(ret.synchedAt),
      };
    } catch (e: any) {
      throw kCreateWebError(e);
    }
  },
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
