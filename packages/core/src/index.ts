import Native from './spec/NativeKakaoCore';
import { kAssert } from './util/kAssert';
import type { KakaoPackageErrorCodes } from './util/kCreateWebError';
import { kCreateWebError } from './util/kCreateWebError';
import { kFetch, kFetchFormUrlEncoded } from './util/kFetch';
import kGlobalStorage from './util/kGlobalStorage';
import { kRunWebAPI } from './util/kRunWebAPI';

export type { KakaoSDKInfo } from './spec/NativeKakaoCore';

export type KakaoSDKOptions = {
  customScheme?: string;
  loggingEnabled?: boolean;
  web?: { javascriptKey: string; restApiKey: string };
};

export async function initializeKakaoSDK(appKey: string, options?: KakaoSDKOptions): Promise<void> {
  kAssert(appKey.length > 0, '[initializeKakaoSDK] appKey is missing');
  kAssert(
    options?.customScheme == null || /^[A-Za-z][A-Za-z0-9+.-]*$/.test(options.customScheme),
    '[initializeKakaoSDK] customScheme must be a URL scheme without ://',
  );

  await Native.initializeKakaoSDK(appKey, options?.loggingEnabled ?? false, options?.customScheme);
}

export function getKakaoSDKInfo() {
  return Native.getKakaoSDKInfo();
}

export function getKeyHashAndroid(): Promise<string | undefined> {
  return Native.getKeyHashAndroid();
}

const KakaoCore = {
  initializeKakaoSDK,
  getKakaoSDKInfo,
  getKeyHashAndroid,
};
export default KakaoCore;
export type KakaoCoreAPI = typeof KakaoCore;
export type { KakaoPackageErrorCodes };
export { kAssert, kCreateWebError, kGlobalStorage, kFetch, kFetchFormUrlEncoded, kRunWebAPI };
