import { NativeModules, Platform } from 'react-native';

import type { Spec } from './spec/NativeKakaoChannel';

const LINKING_ERROR =
  "The package '@react-native-kakao/channel' doesn't seem to be linked. Make sure: \n\n" +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

// @ts-expect-error
const isTurboModuleEnabled = global.__turboModuleProxy != null;

const Module = isTurboModuleEnabled
  ? require('./spec/NativeKakaoChannel').default
  : NativeModules.RNCKakaoChannel;

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
console.log(Native);
