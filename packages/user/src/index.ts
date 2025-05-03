import { NativeModules, Platform } from 'react-native';
import { is } from '@mj-studio/js-util';
import { kAssert } from '@react-native-kakao/core';

import type { Spec } from './spec/NativeKakaoUser';

const LINKING_ERROR =
  "The package '@react-native-kakao/user' doesn't seem to be linked. Make sure: \n\n" +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const isTurboModuleEnabled = global.__turboModuleProxy != null;

const Module = isTurboModuleEnabled
  ? require('./spec/NativeKakaoUser').default
  : NativeModules.RNCKakaoUser;

const Native: Spec = Module
  ? Module
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      },
    );

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
  email: string;
  name?: string | null;
  nickname: string;
  profileImageUrl: string;
  thumbnailImageUrl: string;
  phoneNumber?: string | null;
  ageRange?: string | null;
  birthday?: string | null;
  birthdayType?: string | null;
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
  ciNeedsAgreement?: boolean;
  nameNeedsAgreement?: boolean;
  profileImageNeedsAgreement?: boolean;
  profileNicknameNeedsAgreement?: boolean;
  legalBirthDateNeedsAgreement?: boolean;
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
}: {
  serviceTerms?: string[];
  prompts?: ('Login' | 'Create' | 'Cert' | 'UnifyDaum' | 'SelectAccount')[];
  scopes?: string[];
  useKakaoAccountLogin?: boolean;
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

  return Native.login(
    serviceTerms ?? [],
    prompts ?? [],
    useKakaoAccountLogin ?? false,
    scopes ?? [],
  );
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

export function isKakaoTalkLoginAvailable(): Promise<boolean> {
  return Native.isKakaoTalkLoginAvailable();
}

export function scopes(scopes?: string[]): Promise<KakaoScopeInfo[]> {
  return Native.scopes(scopes);
}

export function revokeScopes(scopes: string[]): Promise<void> {
  return Native.revokeScopes(scopes);
}

export function serviceTerms(): Promise<KakaoServiceTerms[]> {
  return Native.serviceTerms();
}

export function shippingAddresses(): Promise<KakaoShippingAddressResult> {
  return Native.shippingAddresses();
}

export function me(): Promise<KakaoUser> {
  return Native.me();
}

export function getAccessToken(): Promise<KakaoAccessTokenInfo> {
  return Native.getAccessToken();
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
  logout,
  unlink,
  isLogined,
  isKakaoTalkLoginAvailable,
  scopes,
  revokeScopes,
  serviceTerms,
  shippingAddresses,
  me,
  getAccessToken,
  setAccessTokenWeb,
  issueAccessTokenWithCodeWeb,
};
export default KakaoUser;
export type KakaoUserAPI = typeof KakaoUser;
