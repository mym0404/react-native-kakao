import { KakaoJavaScriptError } from './util/KakaoJavaScriptError';
import { kAssert } from './util/kAssert';
import type { KakaoCoreAPI } from './index';

const VERSION = '2.7.1';
const KAKAO_SDK_URL = `https://t1.kakaocdn.net/kakao_js_sdk/${VERSION}/kakao.min.js`;
const INTEGRITY_VALUE = 'sha384-kDljxUXHaJ9xAb2AzRd59KxjrFjzHa5TAoFQ6GbYTCAG0bjM55XohjjDT7tDDC01';
declare global {
  const Kakao: {
    init: Function;
    isInitialized: Function;
  };
}
function loadScript(url: string, integrity: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.integrity = integrity;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });
}

const KakaoCore: KakaoCoreAPI = {
  getKeyHashAndroid: async () => {
    return undefined;
  },
  initializeKakaoSDK: async (javascriptKey: string) => {
    try {
      await loadScript(KAKAO_SDK_URL, INTEGRITY_VALUE);
      Kakao.init(javascriptKey);
      console.log(Kakao.isInitialized());
    } catch (e) {
      throw new KakaoJavaScriptError('Kakao sdk install failed');
    }
  },
};

export const { getKeyHashAndroid, initializeKakaoSDK } = KakaoCore;
export default KakaoCore;
export { kAssert };
