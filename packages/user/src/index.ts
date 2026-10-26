import { is } from '@mj-studio/js-util';
import { kAssert } from '@react-native-kakao/core';

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
export interface KakaoScopeInfo {
  id: string;
  agreed: boolean;
  displayName: string;
  revocable?: boolean;
  using: boolean;
  delegated?: boolean;
  type: string;
}
export interface KakaoServiceTerms {
  tag: string;
  agreedAt?: number;
  agreed: boolean;
  required: boolean;
  revocable: boolean;
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
  email: string;
  name?: string | null;
  nickname: string;
  profileImageUrl: string;
  thumbnailImageUrl: string;
  isDefaultImage?: boolean | null;
  phoneNumber?: string | null;
  ageRange?: string | null;
  birthday?: string | null;
  birthdayType?: string | null;
  isLeapMonth?: boolean | null;
  birthyear?: string | null;
  gender?: string | null;
  isEmailValid: boolean;
  isEmailVerified: boolean;
  isKorean?: boolean;
  ageRangeNeedsAgreement?: boolean;
  birthdayNeedsAgreement?: boolean;
  birthyearNeedsAgreement?: boolean;
  emailNeedsAgreement?: boolean;
  genderNeedsAgreement?: boolean;
  isKoreanNeedsAgreement?: boolean;
  phoneNumberNeedsAgreement?: boolean;
  profileNeedsAgreement?: boolean;
  nameNeedsAgreement?: boolean;
  profileImageNeedsAgreement?: boolean;
  profileNicknameNeedsAgreement?: boolean;
  legalName?: string | null;
  legalNameNeedsAgreement?: boolean | null;
  legalBirthDate?: string | null;
  legalBirthDateNeedsAgreement?: boolean;
  legalGender?: 'female' | 'male' | null;
  legalGenderNeedsAgreement?: boolean | null;
  connectedAt?: number;
  synchedAt?: number;
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
}: {
  serviceTerms?: string[];
  prompts?: ('Login' | 'Create' | 'Cert' | 'SelectAccount')[];
  scopes?: string[];
  useKakaoAccountLogin?: boolean;
  nonce?: string;
  loginHint?: string;
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
    is.notEmptyArray(scopes) ? !is.notEmptyArray(prompts) && !is.notEmptyArray(serviceTerms) : true,
    '[login] `scopes` cannot be passed with `prompts` or `serviceTerms`',
  );

  kAssert(
    loginHint == null || (!is.notEmptyArray(scopes) && !is.notEmptyArray(serviceTerms)),
    '[login] `loginHint` cannot be passed with `scopes` or `serviceTerms` on native platforms.',
  );

  return Native.login(
    serviceTerms ?? [],
    prompts ?? [],
    useKakaoAccountLogin ?? false,
    scopes ?? [],
    nonce,
    loginHint,
  );
}

export async function signup({ properties }: { properties?: Record<string, string> } = {}) {
  await Native.signup(properties);
}

export function logout() {
  return Native.logout();
}

export function unlink() {
  return Native.unlink();
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

export function revokeScopes(scopes: string[]): Promise<void> {
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

export async function shippingAddresses({
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
  secureResource = true,
}: { secureResource?: boolean } = {}): Promise<KakaoUser> {
  return Native.me(secureResource);
}

export function getAccessToken(): Promise<KakaoAccessTokenInfo> {
  return Native.getAccessToken();
}

export function updateProfile({
  properties,
}: {
  properties: Record<string, string>;
}): Promise<void> {
  return Native.updateProfile(properties);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function setAccessTokenWeb(token: string) {}
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
  return {} as any;
}

const KakaoUser = {
  login,
  signup,
  logout,
  unlink,
  isLogined,
  hasToken,
  isKakaoTalkLoginAvailable,
  scopes,
  revokeScopes,
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
