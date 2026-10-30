import { forwardRef } from 'react';

import type { KakaoMapViewProps, KakaoMapViewRef } from './types';

export type {
  CameraOptions,
  CameraPosition,
  CameraMoveEvent,
  KakaoMapError,
  KakaoMapViewProps,
  KakaoMapViewRef,
  MapClickEvent,
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
