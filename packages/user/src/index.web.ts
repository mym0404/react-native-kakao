import { camelCaseObject, filterNonNullishKeys, is } from '@mj-studio/js-util';
import { kFetch, kFetchFormUrlEncoded, kGlobalStorage, kRunWebAPI } from '@react-native-kakao/core';

import {
  type KakaoLoginToken,
  type KakaoScopeInfo,
  type KakaoShippingAddressResult,
  type KakaoUser as KakaoUserProfile,
  type KakaoUserAPI,
} from './index';
import { validateShippingAddressOptions } from './validateShippingAddressOptions';

declare const Kakao: {
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
          redirect_uri: redirectUri,
          code,
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

      return Kakao.Auth.authorize(
        filterNonNullishKeys({
          loginHint: params?.loginHint ?? loginHint,
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

      return camelCaseObject(response.scopes) as KakaoScopeInfo[];
    }),
  revokeScopes: (scopes: string[]) =>
    kRunWebAPI(async () => {
      await Kakao.API.request({
        url: '/v2/user/revoke/scopes',
        data: {
          scopes,
        },
      });
    }),
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
            }[]
          | null;
      } = await Kakao.API.request({
        url: '/v2/user/service_terms',
        data: filterNonNullishKeys({ result, tags: tags?.join(',') }),
      });

      return (response.service_terms ?? []).map((term) => ({
        tag: term.tag,
        agreedAt: term.agreed_at ? isoToUnix(term.agreed_at) : undefined,
        agreed: term.agreed,
        required: term.required,
        revocable: term.revocable,
      }));
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
  me: ({ secureResource = true } = {}) =>
    kRunWebAPI(async () => {
      const ret = camelCaseObject(
        await Kakao.API.request({ url: '/v2/user/me', data: { secure_resource: secureResource } }),
      ) as {
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
        uuid: ret.forPartner?.uuid ?? null,
        groupUserToken: ret.groupUserToken ?? null,
        isDefaultImage: profile.isDefaultImage ?? null,
        isLeapMonth: kakaoAccount.isLeapMonth ?? null,
        legalName: kakaoAccount.legalName ?? null,
        legalNameNeedsAgreement: kakaoAccount.legalNameNeedsAgreement ?? null,
        legalBirthDate: kakaoAccount.legalBirthDate ?? null,
        legalBirthDateNeedsAgreement: kakaoAccount.legalBirthDateNeedsAgreement,
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

export const {
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
