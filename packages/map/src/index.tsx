import { forwardRef, type Ref, useImperativeHandle, useRef } from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import { requireNativeModule, requireNativeView } from 'expo';

import type {
  CameraMoveEvent,
  CameraPosition,
  KakaoMapError,
  KakaoMapViewProps,
  KakaoMapViewRef,
  MapClickEvent,
} from './types';

export type {
  CameraOptions,
  CameraPosition,
  CameraMoveEvent,
  KakaoMapError,
  KakaoMapViewProps,
  KakaoMapViewRef,
  MapClickEvent,
} from './types';

const moduleName = 'RNCKakaoMap';
const NativeView = requireNativeView<
  Omit<KakaoMapViewProps, 'onError' | 'onCameraMoveStart' | 'onCameraIdle' | 'onMapClick'> & {
    ref: Ref<NativeMapRef>;
    onError?: (event: NativeSyntheticEvent<KakaoMapError>) => void;
    onCameraMoveStart?: (event: NativeSyntheticEvent<CameraMoveEvent>) => void;
    onCameraIdle?: (
      event: NativeSyntheticEvent<CameraMoveEvent & { camera: CameraPosition }>,
    ) => void;
    onMapClick?: (event: NativeSyntheticEvent<MapClickEvent>) => void;
  }
>(moduleName);

type NativeMapRef = {
  moveCamera: (camera: NonNullable<KakaoMapViewProps['camera']>, duration: number) => Promise<void>;
  getCamera: () => Promise<CameraPosition>;
};

export function initializeKakaoMapSDK(nativeAppKey: string): Promise<void> {
  return requireNativeModule<{ initialize: (key: string) => Promise<void> }>(moduleName).initialize(
    nativeAppKey,
  );
}

export const KakaoMapView = forwardRef<KakaoMapViewRef, KakaoMapViewProps>(function KakaoMapView(
  { onMapReady, onError, onCameraMoveStart, onCameraIdle, onMapClick, ...props },
  ref,
) {
  const nativeRef = useRef<NativeMapRef>(null);
  useImperativeHandle(
    ref,
    () => ({
      async moveCamera(camera, options) {
        await getView().moveCamera(camera, options?.duration ?? 0);
      },
      async getCamera() {
        return getView().getCamera();
      },
    }),
    [],
  );

  return (
    <NativeView
      {...props}
      ref={nativeRef}
      onMapReady={() => onMapReady?.()}
      onError={(event) => onError?.(event.nativeEvent)}
      onCameraMoveStart={(event) => onCameraMoveStart?.(event.nativeEvent)}
      onCameraIdle={(event) => onCameraIdle?.(event.nativeEvent)}
      onMapClick={(event) => onMapClick?.(event.nativeEvent)}
    />
  );

  function getView() {
    if (!nativeRef.current) {
      throw Object.assign(new Error('The map view is not mounted.'), {
        code: 'ERR_KAKAO_MAP_VIEW_DESTROYED',
      });
    }

    return nativeRef.current;
  }
});
