import { NativeModules, Platform } from 'react-native';

import type { Spec } from './spec/NativeKakaoCore';
import { kAssert } from './util/kAssert';
import type { KakaoPackageErrorCodes } from './util/kCreateWebError';
import { kCreateWebError } from './util/kCreateWebError';
import { kFetch, kFetchFormUrlEncoded } from './util/kFetch';
import kGlobalStorage from './util/kGlobalStorage';

const LINKING_ERROR =
  "The package '@react-native-kakao/core' doesn't seem to be linked. Make sure: \n\n" +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const isTurboModuleEnabled = global.__turboModuleProxy != null;

const Module = isTurboModuleEnabled
  ? require('./spec/NativeKakaoCore').default
  : NativeModules.RNCKakaoCore;

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

export async function initializeKakaoSDK(
  appKey: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options: { web?: { javascriptKey: string; restApiKey: string } },
): Promise<void> {
  Native.initializeKakaoSDK(appKey);
}

export function getKeyHashAndroid(): Promise<string | undefined> {
  return Native.getKeyHashAndroid();
}

const KakaoCore = {
  initializeKakaoSDK,
  getKeyHashAndroid,
};
export default KakaoCore;
export type KakaoCoreAPI = typeof KakaoCore;
export type { KakaoPackageErrorCodes };
export { kAssert, kCreateWebError, kGlobalStorage, kFetch, kFetchFormUrlEncoded };
