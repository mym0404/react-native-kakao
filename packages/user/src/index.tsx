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
