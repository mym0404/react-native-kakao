import { Platform } from 'react-native';

import type { KakaoMapProps, KakaoMapRef } from './component/KakaoMapView';
import { KakaoMapView } from './component/KakaoMapView';
import type { Spec } from './spec/NativeKakaoMap';

const LINKING_ERROR =
  "The package '@react-native-kakao/map' doesn't seem to be linked. Make sure: \n\n" +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const isTurboModuleEnabled = global.__turboModuleProxy != null;

if (!isTurboModuleEnabled) {
  throw new Error('The package @react-native-kakao/map only supports fabric');
}

const Module = require('./spec/NativeKakaoMap').default;

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
// todo remove
console.log(Native);

const KakaoMap = {
  initializeKakaoMapSDK: async (appKey: string) => {
    return await Native.initializeKakaoMapSDK(appKey);
  },
};
export default KakaoMapView;
export type KakaoMapAPI = typeof KakaoMap;

export { KakaoMapView, KakaoMap };
export type { KakaoMapProps, KakaoMapRef };
