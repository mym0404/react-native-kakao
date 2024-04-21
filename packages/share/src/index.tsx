import { NativeModules, Platform } from 'react-native';

import type { Spec } from './spec/NativeKakaoShare';

const LINKING_ERROR =
  "The package '@react-native-kakao/share' doesn't seem to be linked. Make sure: \n\n" +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

// @ts-expect-error
const isTurboModuleEnabled = global.__turboModuleProxy != null;

const Module = isTurboModuleEnabled
  ? require('./spec/NativeKakaoShare').default
  : NativeModules.RNCKakaoShare;

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

export function shareCustom({
  templateId,
  useWebBrowserIfKakaoTalkNotAvailable = true,
  serverCallbackArgs = {},
  templateArgs = {},
}: {
  templateId: number;
  useWebBrowserIfKakaoTalkNotAvailable?: boolean;
  templateArgs?: Record<string, string>;
  serverCallbackArgs?: Record<string, string>;
}) {
  return Native.shareCustom(
    templateId,
    useWebBrowserIfKakaoTalkNotAvailable,
    templateArgs,
    serverCallbackArgs,
  );
}
