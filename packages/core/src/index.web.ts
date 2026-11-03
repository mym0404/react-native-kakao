import { kAssert } from './util/kAssert';
import { kCreateWebError } from './util/kCreateWebError';
import { kFetch, kFetchFormUrlEncoded } from './util/kFetch';
import kGlobalStorage from './util/kGlobalStorage';
import { kRunWebAPI } from './util/kRunWebAPI';
import type { KakaoCoreAPI } from './index';

declare const Kakao: {
  VERSION: string;
  init: (appKey: string) => void;
  isInitialized: () => boolean;
};

const KakaoCore: KakaoCoreAPI = {
  getKakaoSDKInfo: () =>
    kRunWebAPI(() => ({ version: Kakao.VERSION, isInitialized: Kakao.isInitialized() })),
  getKeyHashAndroid: async () => {
    return undefined;
  },
  initializeKakaoSDK: async (appKey: string, options) => {
    kAssert(options?.web?.javascriptKey, '[initializeKakaoSDK] javascriptKey is missing');
    kAssert(options?.web?.restApiKey, '[initializeKakaoSDK] restApiKey is missing');

    await kRunWebAPI(() => {
      kGlobalStorage.javascriptKey = options?.web?.javascriptKey!;
      kGlobalStorage.restApiKey = options?.web?.restApiKey!;
      if (!Kakao.isInitialized()) {
        Kakao.init(options!.web!.javascriptKey);
      }

      kAssert(Kakao.isInitialized(), 'Kakao.isInitialized returns false');
    });
  },
};

export const { getKeyHashAndroid, initializeKakaoSDK, getKakaoSDKInfo } = KakaoCore;
export default KakaoCore;
export { kAssert, kCreateWebError, kGlobalStorage, kFetch, kFetchFormUrlEncoded, kRunWebAPI };
