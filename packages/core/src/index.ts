import Native from './spec/NativeKakaoCore';
import { kAssert } from './util/kAssert';
import type { KakaoPackageErrorCodes } from './util/kCreateWebError';
import { kCreateWebError } from './util/kCreateWebError';
import { kFetch, kFetchFormUrlEncoded } from './util/kFetch';
import kGlobalStorage from './util/kGlobalStorage';
import { kRunWebAPI } from './util/kRunWebAPI';

export async function initializeKakaoSDK(
  appKey: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options?: { web?: { javascriptKey: string; restApiKey: string } },
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
export { kAssert, kCreateWebError, kGlobalStorage, kFetch, kFetchFormUrlEncoded, kRunWebAPI };
