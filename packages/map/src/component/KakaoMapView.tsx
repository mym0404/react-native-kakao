import { type ForwardedRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import type { ViewProps } from 'react-native';
import { kAssert } from '@react-native-kakao/core';

import NativeKakaoMapComponent from '../spec/RNCKakaoMapViewNativeComponent';
import type { Camera } from '../type/type';
import { Const } from '../util/Const';
import { nullCamera } from '../util/Util';

interface KakaoMapProps extends ViewProps {
  baseMapType?: 'map' | 'skyview';
  overlays?: ('hill_shading' | 'roadview_line' | 'bicycle_road' | 'hybrid')[];
  camera?: Camera;
  initialCamera?: Camera;
  cameraMinLevel?: number;
  cameraMaxLevel?: number;
  cameraAnimationDuration?: number;

  buildingScale?: number;
  poiEnabled?: boolean;
  poiClickable?: boolean;
  poiScale?: 'small' | 'regular' | 'large' | 'xlarge';
  language?: 'ko' | 'en';
}
interface KakaoMapRef {}

const KakaoMapView = forwardRef(
  (
    {
      baseMapType = 'map',
      buildingScale = 0.5,
      poiEnabled = true,
      poiClickable = true,
      poiScale = 'regular',
      language,
      overlays,
      camera: cameraProp,
      cameraMinLevel = Const.nullNumber,
      cameraMaxLevel = Const.nullNumber,
      cameraAnimationDuration = 0,
      ...rest
    }: KakaoMapProps,
    ref: ForwardedRef<KakaoMapRef>,
  ) => {
    kAssert(
      buildingScale >= 0 && buildingScale <= 1,
      '[KakaoMapView] buildingScale range should be 0..1',
    );
    useImperativeHandle(ref, () => ({}), []);

    const camera: Camera = useMemo(() => {
      return { ...nullCamera, ...cameraProp };
    }, [cameraProp]);

    return (
      <NativeKakaoMapComponent
        baseMapType={baseMapType}
        buildingScale={buildingScale}
        camera={camera}
        cameraMinLevel={cameraMinLevel}
        cameraMaxLevel={cameraMaxLevel}
        cameraAnimationDuration={cameraAnimationDuration}
        poiEnabled={poiEnabled}
        poiClickable={poiClickable}
        poiScale={poiScale}
        language={language}
        overlays={overlays}
        {...rest}
      />
    );
  },
);

export { KakaoMapView };
export type { KakaoMapProps, KakaoMapRef };
