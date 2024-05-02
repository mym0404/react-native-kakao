import { kAssert } from './util/kAssert';
import { kCreateWebError } from './util/kCreateWebError';
import { kFetch, kFetchFormUrlEncoded } from './util/kFetch';
import kGlobalStorage from './util/kGlobalStorage';
import type { KakaoCoreAPI } from './index';

declare const Kakao: {
  init: Function;
  isInitialized: Function;
};

const KakaoCore: KakaoCoreAPI = {
  getKeyHashAndroid: async () => {
    return undefined;
  },
  initializeKakaoSDK: async (appKey: string, options) => {
    kAssert(options?.web?.javascriptKey, '[initializeKakaoSDK] javascriptKey is missing');
    kAssert(options?.web?.restApiKey, '[initializeKakaoSDK] restApiKey is missing');

    try {
      kGlobalStorage.javascriptKey = options?.web?.javascriptKey!;
      kGlobalStorage.restApiKey = options?.web?.restApiKey!;
      if (!Kakao.isInitialized()) {
        Kakao.init(options!.web!.javascriptKey);
      }

      kAssert(Kakao.isInitialized(), 'Kakao.isInitialized returns false');
    } catch (e) {
      throw e;
    }
  },
};

export const { getKeyHashAndroid, initializeKakaoSDK } = KakaoCore;
export default KakaoCore;
export { kAssert, kCreateWebError, kGlobalStorage, kFetch, kFetchFormUrlEncoded };
