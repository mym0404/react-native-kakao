import { kAssert } from '@react-native-kakao/core';

import type {
  KakaoNaviLocation,
  KakaoNaviOption,
  KakaoNaviRouteParams,
} from './spec/NativeKakaoNavi';
import Native from './spec/NativeKakaoNavi';

export type {
  KakaoNaviLocation,
  KakaoNaviOption,
  KakaoNaviRouteParams,
} from './spec/NativeKakaoNavi';

export function isKakaoNaviInstalled(): Promise<boolean> {
  return Native.isKakaoNaviInstalled();
}

export function getNavigateUrl(params: KakaoNaviRouteParams): Promise<string> {
  return makeNaviUrl(params, false);
}

export function getShareUrl(params: KakaoNaviRouteParams): Promise<string> {
  return makeNaviUrl(params, true);
}

async function makeNaviUrl(
  { destination, option, viaList }: KakaoNaviRouteParams,
  isShare: boolean,
) {
  kAssert(viaList == null || viaList.length <= 3, 'viaList must contain at most 3 stops.');

  return Native.makeNaviUrl(destination, isShare, option, viaList);
}

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
}): Promise<boolean> {
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
}): Promise<boolean> {
  return Native.navigateOrShareTo(
    destination,
    option,
    viaList,
    openWebInstallUrlIfNaviAppNotAvailable ?? true,
    true,
  );
}

const KakaoNavi = { isKakaoNaviInstalled, getNavigateUrl, getShareUrl, navigateTo, shareTo };
export default KakaoNavi;
export type KakaoNaviAPI = typeof KakaoNavi;
