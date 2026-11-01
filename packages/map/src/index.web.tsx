import { forwardRef } from 'react';

import type { KakaoMapViewProps, KakaoMapViewRef } from './types';

export type { MapImageSource } from './types-assets';
export type * from './types-labels';
export type * from './types-shapes';
export type * from './types-routes';
export type * from './types-camera';

export type {
  CameraOptions,
  CameraUpdate,
  CameraPosition,
  CameraMoveEvent,
  Coordinate,
  KakaoMapError,
  KakaoMapViewProps,
  KakaoMapViewRef,
  MapClickEvent,
  MapGesture,
  MapInfo,
  MapOptions,
  MapOverlay,
  MapPadding,
  MapType,
  MapWidgetPosition,
  MapViewport,
  PoiClickEvent,
  ScreenPoint,
} from './types';

const unsupported = () =>
  Object.assign(new Error('KakaoMapView supports Android and iOS only.'), {
    code: 'ERR_KAKAO_MAP_UNSUPPORTED_PLATFORM',
  });

export async function initializeKakaoMapSDK(_nativeAppKey: string): Promise<void> {
  throw unsupported();
}
export const KakaoMapView = forwardRef<KakaoMapViewRef, KakaoMapViewProps>(function KakaoMapView() {
  throw unsupported();
});
