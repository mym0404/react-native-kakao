import type { KakaoNaviLocation, KakaoNaviOption } from './spec/NativeKakaoNavi';
import Native from './spec/NativeKakaoNavi';

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

const KakaoNavi = { navigateTo, shareTo };
export default KakaoNavi;
export type KakaoNaviAPI = typeof KakaoNavi;
