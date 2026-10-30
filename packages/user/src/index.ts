import { is } from '@mj-studio/js-util';
import { kAssert, kCreateWebError } from '@react-native-kakao/core';

import Native from './spec/NativeKakaoUser';
import { validateShippingAddressOptions } from './validateShippingAddressOptions';

export interface KakaoLoginToken {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  idToken?: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  scopes: string[];
}
export type KakaoTalkLaunchMethod = 'UniversalLink' | 'CustomScheme';

const defaultTalkLaunchMethod: KakaoTalkLaunchMethod = 'UniversalLink';
const webOnlyErrorCode = 'Package-UnsupportedPlatform';

export interface KakaoScopeInfo {
  id: string;
  agreed: boolean;
  displayName: string;
  revocable?: boolean | null;
  using: boolean;
  delegated?: boolean | null;
  type: string;
}
export interface KakaoServiceTerms {
  tag: string;
  agreedAt?: number;
  agreed: boolean;
  required: boolean;
  revocable: boolean;
  agreedBy?: 'KAUTH' | 'KAPI' | 'unknown';
}
export type KakaoRevokedServiceTerms = {
  tag: string;
  agreed: boolean;
};
export interface KakaoAppServiceTerms {
  tag: string;
  createdAt: number;
  updatedAt: number;
}
export interface KakaoShippingAddressResult {
  userId?: number;
  needsAgreement?: boolean;
  shippingAddresses: KakaoShippingAddress[];
}
export interface KakaoShippingAddress {
  id: number;
  name?: string;
  isDefault: boolean;
  updatedAt?: number;
  type?: string;
  baseAddress?: string;
  detailAddress?: string;
  receiverName?: string;
  receiverPhoneNumber1?: string;
  receiverPhoneNumber2?: string;
  zoneNumber?: string;
  zipCode?: string;
}
export interface KakaoUser {
  id: number;
  hasSignedUp?: boolean | null;
  uuid?: string | null;
  groupUserToken?: string | null;
  properties: Record<string, string>;
  email?: string | null;
  name?: string | null;
  nickname?: string | null;
  profileImageUrl?: string | null;
  thumbnailImageUrl?: string | null;
  isDefaultImage?: boolean | null;
  phoneNumber?: string | null;
  ageRange?: string | null;
  birthday?: string | null;
  birthdayType?: string | null;
  isLeapMonth?: boolean | null;
  birthyear?: string | null;
  gender?: string | null;
  isEmailValid?: boolean | null;
  isEmailVerified?: boolean | null;
  isKorean?: boolean | null;
  ageRangeNeedsAgreement?: boolean | null;
  birthdayNeedsAgreement?: boolean | null;
  birthyearNeedsAgreement?: boolean | null;
  emailNeedsAgreement?: boolean | null;
  genderNeedsAgreement?: boolean | null;
  isKoreanNeedsAgreement?: boolean | null;
  phoneNumberNeedsAgreement?: boolean | null;
  profileNeedsAgreement?: boolean | null;
  nameNeedsAgreement?: boolean | null;
  profileImageNeedsAgreement?: boolean | null;
  profileNicknameNeedsAgreement?: boolean | null;
  legalName?: string | null;
  legalNameNeedsAgreement?: boolean | null;
  legalBirthDate?: string | null;
  legalBirthDateNeedsAgreement?: boolean | null;
  legalGender?: 'female' | 'male' | null;
  legalGenderNeedsAgreement?: boolean | null;
  connectedAt?: number | null;
  synchedAt?: number | null;
}
export interface KakaoAccessTokenInfo {
  id?: number;
  appId: number;
  expiresIn: number;
}
export function login({
  serviceTerms,
  prompts,
  useKakaoAccountLogin,
  scopes,
  nonce,
  loginHint,
  channelPublicIds,
  ios,
}: {
  serviceTerms?: string[];
  prompts?: ('Login' | 'Create' | 'Cert' | 'SelectAccount')[];
  scopes?: string[];
  useKakaoAccountLogin?: boolean;
  nonce?: string;
  loginHint?: string;
  channelPublicIds?: string[];
  ios?: { launchMethod?: KakaoTalkLaunchMethod };
  web?: {
    redirectUri: string;
    scope?: string[];
    throughTalk?: boolean;
    prompt?: ('login' | 'none' | 'create' | 'select_account')[];
    loginHint?: string;
    serviceTerms?: string[];
    state?: string;
    nonce?: string;
  };
} = {}): Promise<KakaoLoginToken> {
  kAssert(
    !useKakaoAccountLogin ? !is.notEmptyArray(prompts) && !is.notEmptyArray(scopes) : true,
    '[login] `prompts` and `scopes` cannot be passed if useKakaoAccountLogin is false.',
  );

  kAssert(
    is.notEmptyArray(scopes)
      ? !is.notEmptyArray(prompts) &&
          !is.notEmptyArray(serviceTerms) &&
          !is.notEmptyArray(channelPublicIds)
      : true,
    '[login] `scopes` cannot be passed with `prompts`, `serviceTerms`, or `channelPublicIds`',
  );

  kAssert(
    loginHint == null ||
      (!is.notEmptyArray(scopes) &&
        !is.notEmptyArray(serviceTerms) &&
        !is.notEmptyArray(channelPublicIds)),
    '[login] `loginHint` cannot be passed with `scopes`, `serviceTerms`, or `channelPublicIds` on native platforms.',
  );

  return Native.login(
    serviceTerms ?? [],
    prompts ?? [],
    useKakaoAccountLogin ?? false,
    ios?.launchMethod ?? defaultTalkLaunchMethod,
    scopes ?? [],
    nonce,
    loginHint,
    channelPublicIds ?? [],
  );
}

export async function signup({ properties }: { properties?: Record<string, string> } = {}) {
  await Native.signup(properties);
}

export function loginWithKakao({
  uiMode = 'auto',
  prompts,
  loginHint,
  nonce,
  channelPublicIds,
  serviceTerms,
  ios,
}: {
  uiMode?: 'auto' | 'light' | 'dark';
  prompts?: ('Login' | 'Create' | 'Cert' | 'SelectAccount')[];
  loginHint?: string;
  nonce?: string;
  channelPublicIds?: string[];
  serviceTerms?: string[];
  ios?: {
    orientation?: 'auto' | 'portrait' | 'landscape';
    launchMethod?: KakaoTalkLaunchMethod;
  };
} = {}): Promise<KakaoLoginToken> {
  return Native.loginWithKakao(
    uiMode,
    ios?.orientation ?? 'auto',
    ios?.launchMethod ?? defaultTalkLaunchMethod,
    prompts ?? [],
    loginHint,
    nonce,
    channelPublicIds ?? [],
    serviceTerms ?? [],
  );
}

export function refreshToken(): Promise<KakaoLoginToken> {
  return Native.refreshToken();
}

export async function logout() {
  await Native.logout();
}

export async function unlink() {
  await Native.unlink();
}

export function isLogined() {
  return Native.isLogined();
}

export const hasToken = Native.hasToken;

export function isKakaoTalkLoginAvailable(): Promise<boolean> {
  return Native.isKakaoTalkLoginAvailable();
}

export function scopes(scopes?: string[]): Promise<KakaoScopeInfo[]> {
  return Native.scopes(scopes);
}

export async function revokeScopes(scopes: string[]): Promise<void> {
  await Native.revokeScopes(scopes);
}

export function revokeScopesWithResult(scopes: string[]): Promise<KakaoScopeInfo[]> {
  return Native.revokeScopes(scopes);
}

export function serviceTerms({
  result,
  tags,
}: {
  result?: 'agreed_service_terms' | 'app_service_terms';
  tags?: string[];
} = {}): Promise<KakaoServiceTerms[]> {
  return Native.serviceTerms(result, tags);
}

export function shippingAddresses({
  addressId,
  fromUpdatedAt,
  pageSize,
}: {
  addressId?: number;
  fromUpdatedAt?: number;
  pageSize?: number;
} = {}): Promise<KakaoShippingAddressResult> {
  validateShippingAddressOptions({ addressId, fromUpdatedAt, pageSize });

  return Native.shippingAddresses(addressId, fromUpdatedAt, pageSize);
}

export function revokeServiceTerms(tags: string[]): Promise<KakaoRevokedServiceTerms[]> {
  return Native.revokeServiceTerms(tags);
}

export function selectShippingAddress(): Promise<number> {
  return Native.selectShippingAddress();
}

export function me({
  propertyKeys,
  secureResource = true,
}: { propertyKeys?: string[]; secureResource?: boolean } = {}): Promise<KakaoUser> {
  return Native.me(propertyKeys, secureResource);
}

export function getAccessToken(): Promise<KakaoAccessTokenInfo> {
  return Native.getAccessToken();
}

export async function updateProfile({
  properties,
}: {
  properties: Record<string, string>;
}): Promise<void> {
  await Native.updateProfile(properties);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function setAccessTokenWeb(token: string): void {
  kCreateWebError({
    code: webOnlyErrorCode,
    message: '[setAccessTokenWeb] This API is only supported on web.',
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function issueAccessTokenWithCodeWeb(params: {
  redirectUri: string;
  clientSecret?: string;
  code: string;
}): Promise<{
  tokenType: string;
  accessToken: string;
  idToken?: string;
  expiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
  scope?: string;
}> {
  kCreateWebError({
    code: webOnlyErrorCode,
    message: '[issueAccessTokenWithCodeWeb] This API is only supported on web.',
  });
}

const KakaoUser = {
  login,
  loginWithKakao,
  refreshToken,
  signup,
  logout,
  unlink,
  isLogined,
  hasToken,
  isKakaoTalkLoginAvailable,
  scopes,
  revokeScopes,
  revokeScopesWithResult,
  serviceTerms,
  revokeServiceTerms,
  shippingAddresses,
  selectShippingAddress,
  me,
  updateProfile,
  getAccessToken,
  setAccessTokenWeb,
  issueAccessTokenWithCodeWeb,
};
export default KakaoUser;
export type KakaoUserAPI = typeof KakaoUser;
