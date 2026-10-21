import { camelCaseObject, filterNonNullishKeys, is } from '@mj-studio/js-util';
import {
  kAssert,
  kCreateWebError,
  kFetch,
  kFetchFormUrlEncoded,
  kGlobalStorage,
  kRunWebAPI,
} from '@react-native-kakao/core';

import {
  type KakaoLoginToken,
  type KakaoScopeInfo,
  type KakaoServiceTerms,
  type KakaoShippingAddressResult,
  type KakaoUser as KakaoUserProfile,
  type KakaoUserAPI,
} from './index';
import { validateShippingAddressOptions } from './validateShippingAddressOptions';

declare const Kakao: {
  isInitialized: () => boolean;
  Auth: {
    authorize: Function;
    logout: Function;
    setAccessToken: Function;
    selectShippingAddress: () => Promise<{ address_id: number }>;
    getAccessToken: () => string | null;
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
  loginWithKakao: () =>
    kRunWebAPI(() => {
      throw {
        code: 'Package-UnsupportedPlatform',
        message:
          'loginWithKakao is supported on Android and iOS. Use login with web.redirectUri on web.',
      };
    }),
  refreshToken: () =>
    kRunWebAPI(() => {
      throw {
        code: 'Package-UnsupportedPlatform',
        message: 'The Kakao JavaScript SDK does not support refreshToken.',
      };
    }),
  hasToken: () => kRunWebAPI(() => Kakao.Auth.getAccessToken() != null),
  getAccessToken: () =>
    kRunWebAPI(async () => {
      const { id, expires_in, app_id }: { id: number; expires_in: number; app_id: number } =
        await Kakao.API.request({ url: '/v1/user/access_token_info' });

      return {
        id,
        expiresIn: expires_in,
        appId: app_id,
      };
    }),
  issueAccessTokenWithCode: ({ code, codeVerifier, redirectUri, web }) =>
    kRunWebAPI(async () => {
      kAssert(
        is.string(code) && code.length > 0 && is.string(redirectUri) && redirectUri.length > 0,
        '[issueAccessTokenWithCode] code and redirectUri are required on web',
      );

      if (typeof Kakao === 'undefined' || !Kakao.isInitialized()) {
        kCreateWebError({
          code: 'Package-SDKNotInitialized',
          message: 'Initialize the Kakao SDK before exchanging an authorization code.',
        });
      }

      const token = await KakaoUser.issueAccessTokenWithCodeWeb({
        code,
        codeVerifier,
        redirectUri: redirectUri!,
        clientSecret: web?.clientSecret,
      });

      if (
        !is.string(token.accessToken) ||
        !token.accessToken ||
        !is.string(token.refreshToken) ||
        !token.refreshToken ||
        !is.string(token.tokenType) ||
        (token.idToken != null && !is.string(token.idToken)) ||
        !Number.isFinite(token.expiresIn) ||
        token.expiresIn < 0 ||
        !Number.isFinite(token.refreshTokenExpiresIn) ||
        token.refreshTokenExpiresIn < 0 ||
        (token.scope != null && !is.string(token.scope))
      ) {
        kCreateWebError({
          code: 'Package-APIResponseNotFound',
          message: 'issueAccessTokenWithCode returned invalid token data.',
        });
      }

      const issuedAt = Math.floor(Date.now() / 1000);
      KakaoUser.setAccessTokenWeb(token.accessToken);

      return {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        tokenType: token.tokenType,
        idToken: token.idToken,
        accessTokenExpiresIn: token.expiresIn,
        refreshTokenExpiresIn: token.refreshTokenExpiresIn,
        accessTokenExpiresAt: issuedAt + token.expiresIn,
        refreshTokenExpiresAt: issuedAt + token.refreshTokenExpiresIn,
        scopes: token.scope?.split(' ').filter(Boolean) ?? [],
      };
    }),
  issueAccessTokenWithCodeWeb: ({ clientSecret, code, codeVerifier, redirectUri }) =>
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
          redirect_uri: redirectUri,
          code,
          code_verifier: codeVerifier,
          client_secret: clientSecret,
        }),
      }).then((r) => r.body);

      return camelCaseObject(res) as any;
    }),
  setAccessTokenWeb: (token: string) => {
    Kakao.Auth.setAccessToken(token);
    kGlobalStorage.accessToken = token;
  },
  login: (params): Promise<KakaoLoginToken> =>
    kRunWebAPI(() => {
      const { loginHint, nonce, prompt, redirectUri, scope, state, throughTalk, serviceTerms } =
        params?.web ?? {};
      const channelPublicIds = params?.channelPublicIds;

      return Kakao.Auth.authorize(
        filterNonNullishKeys({
          loginHint: params?.loginHint ?? loginHint,
          channelPublicId: channelPublicIds?.length ? channelPublicIds.join(',') : undefined,
          nonce: params?.nonce ?? nonce,
          prompt: (
            prompt ??
            params?.prompts?.map((value) =>
              value === 'SelectAccount' ? 'select_account' : value.toLowerCase(),
            )
          )?.join(','),
          redirectUri,
          scope: (scope ?? params?.scopes)?.join(','),
          serviceTerms: (serviceTerms ?? params?.serviceTerms)?.join(','),
          state,
          throughTalk: throughTalk ?? (params?.useKakaoAccountLogin ? false : undefined),
        }),
      );
    }),
  signup: ({ properties } = {}) =>
    kRunWebAPI(async () => {
      await Kakao.API.request({
        url: '/v1/user/signup',
        data: filterNonNullishKeys({ properties }),
      });
    }),
  logout: () =>
    kRunWebAPI(async () => {
      try {
        await Kakao.Auth.logout();
      } finally {
        kGlobalStorage.clearAccessToken();
      }
    }),
  isLogined: async (): Promise<boolean> => {
    try {
      const { appId } = await KakaoUser.getAccessToken();

      return !!appId;
    } catch (e) {
      return false;
    }
  },
  isKakaoTalkLoginAvailable: async () => false,
  unlink: () =>
    kRunWebAPI(async () => {
      await Kakao.API.request({ url: '/v1/user/unlink' });
      Kakao.Auth.setAccessToken(null);
      kGlobalStorage.clearAccessToken();
    }),
  scopes: (scopes?: string[]) =>
    kRunWebAPI(async () => {
      const response = await Kakao.API.request({
        url: '/v2/user/scopes',
        data: scopes?.length ? { scopes } : undefined,
      });

      return camelCaseObject(response.scopes ?? []) as KakaoScopeInfo[];
    }),
  revokeScopes: async (scopes: string[]) => {
    await revokeScopesWithResult(scopes);
  },
  revokeScopesWithResult,
  serviceTerms: ({ result, tags } = {}) =>
    kRunWebAPI(async () => {
      const response: {
        service_terms?:
          | {
              tag: string;
              agreed_at?: string | null;
              agreed: boolean;
              required: boolean;
              revocable: boolean;
              agreed_by?: string | null;
            }[]
          | null;
      } = await Kakao.API.request({
        url: '/v2/user/service_terms',
        data: filterNonNullishKeys({ result, tags: tags?.join(',') }),
      });

      return (response.service_terms ?? []).map(
        (term): KakaoServiceTerms =>
          filterNonNullishKeys({
            tag: term.tag,
            agreedAt: term.agreed_at ? isoToUnix(term.agreed_at) : undefined,
            agreed: term.agreed,
            required: term.required,
            revocable: term.revocable,
            agreedBy:
              term.agreed_by == null
                ? undefined
                : term.agreed_by === 'KAUTH' || term.agreed_by === 'KAPI'
                  ? term.agreed_by
                  : 'unknown',
          }),
      );
    }),
  revokeServiceTerms: (tags) =>
    kRunWebAPI(async () => {
      const response: {
        revoked_service_terms?: { tag: string; agreed: boolean }[] | null;
      } = await Kakao.API.request({
        url: '/v2/user/revoke/service_terms',
        data: { tags: tags.join(',') },
      });

      return response.revoked_service_terms ?? [];
    }),
  shippingAddresses: ({ addressId, fromUpdatedAt, pageSize } = {}) =>
    kRunWebAPI(async () => {
      validateShippingAddressOptions({ addressId, fromUpdatedAt, pageSize });

      const query = new URLSearchParams(
        Object.entries(
          filterNonNullishKeys(
            addressId != null
              ? { address_id: addressId }
              : { from_updated_at: fromUpdatedAt, page_size: pageSize },
          ),
        ).map(([key, value]) => [key, String(value)]),
      );

      const { body } = await kFetch<Record<string, unknown>>(
        `https://kapi.kakao.com/v1/user/shipping_address?${query}`,
        { headers: { Authorization: `Bearer ${Kakao.Auth.getAccessToken() ?? ''}` } },
      );

      const response = camelCaseObject(body) as {
        userId?: number;
        shippingAddressesNeedsAgreement?: boolean;
        shippingAddresses?: (Omit<
          KakaoShippingAddressResult['shippingAddresses'][number],
          'updatedAt'
        > & {
          updatedAt?: string | number;
        })[];
      };

      return {
        userId: response.userId,
        needsAgreement: response.shippingAddressesNeedsAgreement,
        shippingAddresses: (response.shippingAddresses ?? []).map((address) => ({
          ...address,
          updatedAt: isoToUnix(address.updatedAt),
        })),
      };
    }),
  selectShippingAddress: () =>
    kRunWebAPI(async () => {
      try {
        const { address_id } = await Kakao.Auth.selectShippingAddress();

        return address_id;
      } catch (error) {
        if (error != null && typeof error === 'object' && 'error_code' in error) {
          throw {
            code: String(error.error_code),
            message: 'error_msg' in error ? String(error.error_msg) : undefined,
          };
        }

        throw error;
      }
    }),
  updateProfile: ({ properties }) =>
    kRunWebAPI(async () => {
      await Kakao.API.request({ url: '/v1/user/update_profile', data: { properties } });
    }),
  me: ({ propertyKeys, secureResource = true } = {}) =>
    kRunWebAPI(async () => {
      const response: { properties?: Record<string, string> } = await Kakao.API.request({
        url: '/v2/user/me',
        data: filterNonNullishKeys({
          property_keys: propertyKeys,
          secure_resource: secureResource,
        }),
      });

      const ret = camelCaseObject(response) as {
        id: number;
        hasSignedUp?: boolean | null;
        forPartner?: { uuid?: string };
        groupUserToken?: string;
        connectedAt?: string;
        synchedAt?: string;
        kakaoAccount?: Partial<KakaoUserProfile> & {
          profile?: Partial<
            Pick<
              KakaoUserProfile,
              'nickname' | 'profileImageUrl' | 'thumbnailImageUrl' | 'isDefaultImage'
            >
          >;
        };
        properties?: { nickname?: string; profileImage?: string; thumbnailImage?: string };
      };
      const kakaoAccount = ret.kakaoAccount ?? {};
      const properties = ret.properties ?? {};
      const profile = kakaoAccount.profile ?? {};
      const legalGender = kakaoAccount.legalGender;

      return {
        id: ret.id,
        hasSignedUp: ret.hasSignedUp ?? null,
        properties: response.properties ?? {},
        uuid: ret.forPartner?.uuid ?? null,
        groupUserToken: ret.groupUserToken ?? null,
        isDefaultImage: profile.isDefaultImage ?? null,
        isLeapMonth: kakaoAccount.isLeapMonth ?? null,
        legalName: kakaoAccount.legalName ?? null,
        legalNameNeedsAgreement: kakaoAccount.legalNameNeedsAgreement ?? null,
        legalBirthDate: kakaoAccount.legalBirthDate ?? null,
        legalBirthDateNeedsAgreement: kakaoAccount.legalBirthDateNeedsAgreement ?? null,
        legalGender: legalGender === 'female' || legalGender === 'male' ? legalGender : null,
        legalGenderNeedsAgreement: kakaoAccount.legalGenderNeedsAgreement ?? null,
        email: kakaoAccount.email,
        name: kakaoAccount.name,
        nickname: profile.nickname ?? properties.nickname,
        profileImageUrl: profile.profileImageUrl ?? properties.profileImage,
        thumbnailImageUrl: profile.thumbnailImageUrl ?? properties.thumbnailImage,
        phoneNumber: kakaoAccount.phoneNumber,
        isEmailValid: kakaoAccount.isEmailValid,
        isEmailVerified: kakaoAccount.isEmailVerified,
        ageRange: kakaoAccount.ageRange,
        birthday: kakaoAccount.birthday,
        birthdayType: kakaoAccount.birthdayType,
        birthyear: kakaoAccount.birthyear,
        gender: kakaoAccount.gender,
        isKorean: kakaoAccount.isKorean,
        ageRangeNeedsAgreement: kakaoAccount.ageRangeNeedsAgreement,
        birthdayNeedsAgreement: kakaoAccount.birthdayNeedsAgreement,
        birthyearNeedsAgreement: kakaoAccount.birthyearNeedsAgreement,
        emailNeedsAgreement: kakaoAccount.emailNeedsAgreement,
        genderNeedsAgreement: kakaoAccount.genderNeedsAgreement,
        isKoreanNeedsAgreement: kakaoAccount.isKoreanNeedsAgreement,
        phoneNumberNeedsAgreement: kakaoAccount.phoneNumberNeedsAgreement,
        profileNeedsAgreement: kakaoAccount.profileNeedsAgreement,
        nameNeedsAgreement: kakaoAccount.nameNeedsAgreement,
        profileImageNeedsAgreement: kakaoAccount.profileImageNeedsAgreement,
        profileNicknameNeedsAgreement: kakaoAccount.profileNicknameNeedsAgreement,
        connectedAt: isoToUnix(ret.connectedAt),
        synchedAt: isoToUnix(ret.synchedAt),
      } as KakaoUserProfile;
    }),
};

export function revokeScopesWithResult(scopes: string[]): Promise<KakaoScopeInfo[]> {
  return kRunWebAPI(async () => {
    const response = await Kakao.API.request({
      url: '/v2/user/revoke/scopes',
      data: { scopes },
    });

    return camelCaseObject(response.scopes ?? []) as KakaoScopeInfo[];
  });
}

export const {
  loginWithKakao,
  refreshToken,
  issueAccessTokenWithCode,
  isKakaoTalkLoginAvailable,
  isLogined,
  hasToken,
  login,
  signup,
  logout,
  me,
  updateProfile,
  revokeScopes,
  scopes,
  serviceTerms,
  revokeServiceTerms,
  shippingAddresses,
  selectShippingAddress,
  unlink,
  setAccessTokenWeb,
  issueAccessTokenWithCodeWeb,
  getAccessToken,
} = KakaoUser;

export default KakaoUser;
