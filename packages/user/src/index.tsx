import { NativeModules, Platform } from 'react-native';

import type { Spec } from './spec/NativeKakaoUser';

const LINKING_ERROR =
  "The package '@react-native-kakao/user' doesn't seem to be linked. Make sure: \n\n" +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

// @ts-expect-error
const isTurboModuleEnabled = global.__turboModuleProxy != null;

const Module = isTurboModuleEnabled
  ? require('./spec/NativeKakaoUser').default
  : NativeModules.KakaoShare;

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

export type KakaoLoginToken = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  idToken?: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  scopes: string[];
};
export type KakaoScopeInfo = {
  id: string;
  agreed: boolean;
  displayName: string;
  revocable?: boolean;
  using: boolean;
  delegated?: boolean;
  type: string;
};
export type KakaoServiceTerms = {
  tag: string;
  agreedAt: number;
};
export type KakaoAppServiceTerms = {
  tag: string;
  createdAt: number;
  updatedAt: number;
};
export type KakaoShippingAddressResult = {
  userId?: number;
  needsAgreement?: boolean;
  shippingAddresses: KakaoShippingAddress[];
};
export type KakaoShippingAddress = {
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
};
export function login({
  serviceTerms,
  prompts,
  useKakaoAccountLoginIos,
}: {
  serviceTerms?: string[];
  prompts?: string[];
  useKakaoAccountLoginIos?: boolean;
} = {}): Promise<KakaoLoginToken> {
  return Native.login(serviceTerms ?? [], prompts ?? [], useKakaoAccountLoginIos ?? false);
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

export function serviceTerms(): Promise<{
  allowedServiceTerms?: KakaoServiceTerms[];
  appServiceTerms?: KakaoAppServiceTerms[];
}> {
  return Native.serviceTerms();
}

export function shippingAddresses(): Promise<KakaoShippingAddressResult> {
  return Native.shippingAddresses();
}