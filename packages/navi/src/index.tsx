import { NativeModules, Platform } from 'react-native';

import type { KakaoNaviLocation, KakaoNaviOption, Spec } from './spec/NativeKakaoNavi';

const LINKING_ERROR =
  "The package '@react-native-kakao/navi' doesn't seem to be linked. Make sure: \n\n" +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

// @ts-expect-error
const isTurboModuleEnabled = global.__turboModuleProxy != null;

const Module = isTurboModuleEnabled
  ? require('./spec/NativeKakaoNavi').default
  : NativeModules.RNCKakaoNavi;

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

export type { KakaoNaviLocation, KakaoNaviOption } from './spec/NativeKakaoNavi';

export function navigateTo({
  destination,
  option,
  viaList,
  openWebInstallUrlIfNaviAppNotAvailable,
}: {
  destination: KakaoNaviLocation;
  option?: KakaoNaviOption;
  viaList?: KakaoNaviLocation[];
  openWebInstallUrlIfNaviAppNotAvailable?: boolean;
}) {
  return Native.navigateOrShareTo(
    destination,
    option,
    viaList,
    openWebInstallUrlIfNaviAppNotAvailable ?? true,
    false,
  );
}

export function shareTo({
  destination,
  option,
  viaList,
  openWebInstallUrlIfNaviAppNotAvailable,
}: {
  destination: KakaoNaviLocation;
  option?: KakaoNaviOption;
  viaList?: KakaoNaviLocation[];
  openWebInstallUrlIfNaviAppNotAvailable?: boolean;
}) {
  return Native.navigateOrShareTo(
    destination,
    option,
    viaList,
    openWebInstallUrlIfNaviAppNotAvailable ?? true,
    true,
  );
}
