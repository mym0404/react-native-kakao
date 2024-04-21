import { NativeModules, Platform } from 'react-native';

import type { Spec } from './spec/NativeKakaoCore';
import { kAssert } from './util/kAssert';

const LINKING_ERROR =
  "The package '@react-native-kakao/core' doesn't seem to be linked. Make sure: \n\n" +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

// @ts-expect-error
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

export function initializeKakaoSDK(appKey: string) {
  Native.initializeKakaoSDK(appKey);
}
export { kAssert };
