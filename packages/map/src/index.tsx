import { forwardRef, type Ref, useImperativeHandle, useRef } from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import { requireNativeModule, requireNativeView } from 'expo';

import type {
  CameraMoveEvent,
  CameraPosition,
  CameraUpdate,
  Coordinate,
  KakaoMapError,
  KakaoMapViewProps,
  KakaoMapViewRef,
  MapClickEvent,
  MapInfo,
  MapPadding,
  MapViewport,
  PoiClickEvent,
  ScreenPoint,
} from './types';
import type { AdvancedCameraOperationEvent } from './types-camera';

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

const moduleName = 'RNCKakaoMap';
const NativeView = requireNativeView<
  Omit<
    KakaoMapViewProps,
    | 'onError'
    | 'onCameraMoveStart'
    | 'onCameraIdle'
    | 'onMapClick'
    | 'onMapLongClick'
    | 'onTerrainClick'
    | 'onViewportClick'
    | 'onVisibilityChanged'
    | 'onFocusChanged'
    | 'onPoiClick'
    | 'onMapTypeChanged'
    | 'onPaddingChanged'
    | 'onViewportChanged'
    | 'onCameraOperation'
  > & {
    ref: Ref<NativeMapRef>;
    onError?: (event: NativeSyntheticEvent<KakaoMapError>) => void;
    onCameraMoveStart?: (event: NativeSyntheticEvent<CameraMoveEvent>) => void;
    onCameraIdle?: (
      event: NativeSyntheticEvent<CameraMoveEvent & { camera: CameraPosition }>,
    ) => void;
    onMapClick?: (event: NativeSyntheticEvent<MapClickEvent>) => void;
    onMapLongClick?: (event: NativeSyntheticEvent<Coordinate>) => void;
    onTerrainClick?: (event: NativeSyntheticEvent<Coordinate>) => void;
    onViewportClick?: (event: NativeSyntheticEvent<MapClickEvent>) => void;
    onVisibilityChanged?: (event: NativeSyntheticEvent<{ visible: boolean }>) => void;
    onFocusChanged?: (event: NativeSyntheticEvent<{ focused: boolean }>) => void;
    onPoiClick?: (event: NativeSyntheticEvent<PoiClickEvent>) => void;
    onMapTypeChanged?: (event: NativeSyntheticEvent<{ viewInfoName: string }>) => void;
    onPaddingChanged?: (event: NativeSyntheticEvent<MapPadding>) => void;
    onViewportChanged?: (event: NativeSyntheticEvent<MapViewport>) => void;
    onCameraOperation?: (event: NativeSyntheticEvent<AdvancedCameraOperationEvent>) => void;
  }
>(moduleName);

type NativeMapRef = Omit<KakaoMapViewRef, 'moveCamera' | 'updateCamera'> & {
  moveCamera: (camera: NonNullable<KakaoMapViewProps['camera']>, duration: number) => Promise<void>;
  getCamera: () => Promise<CameraPosition>;
  updateCamera: (update: CameraUpdate, duration: number) => Promise<void>;
  getMapInfo: () => Promise<MapInfo>;
  screenToCoordinate: (point: ScreenPoint) => Promise<Coordinate>;
  coordinateToScreen: (coordinate: Coordinate) => Promise<ScreenPoint>;
  clearCache: () => Promise<void>;
};

export function initializeKakaoMapSDK(nativeAppKey: string): Promise<void> {
  return requireNativeModule<{ initialize: (key: string) => Promise<void> }>(moduleName).initialize(
    nativeAppKey,
  );
}

export const KakaoMapView = forwardRef<KakaoMapViewRef, KakaoMapViewProps>(function KakaoMapView(
  {
    onMapReady,
    onError,
    onCameraMoveStart,
    onCameraIdle,
    onMapClick,
    onMapLongClick,
    onTerrainClick,
    onViewportClick,
    onVisibilityChanged,
    onFocusChanged,
    onPoiClick,
    onCompassClick,
    onMapTypeChanged,
    onPaddingChanged,
    onViewportChanged,
    onCameraOperation,
    ...props
  },
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
      async updateCamera(update, options) {
        await getView().updateCamera(update, options?.duration ?? 0);
      },
      async getMapInfo() {
        return getView().getMapInfo();
      },
      async screenToCoordinate(point) {
        return getView().screenToCoordinate(point);
      },
      async coordinateToScreen(coordinate) {
        return getView().coordinateToScreen(coordinate);
      },
      async clearCache() {
        await getView().clearCache();
      },
      async executeCameraCommand(command) {
        return getView().executeCameraCommand(command);
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
      onMapLongClick={(event) => onMapLongClick?.(event.nativeEvent)}
      onTerrainClick={(event) => onTerrainClick?.(event.nativeEvent)}
      onViewportClick={(event) => onViewportClick?.(event.nativeEvent)}
      onVisibilityChanged={(event) => onVisibilityChanged?.(event.nativeEvent)}
      onFocusChanged={(event) => onFocusChanged?.(event.nativeEvent)}
      onPoiClick={(event) => onPoiClick?.(event.nativeEvent)}
      onCompassClick={() => onCompassClick?.()}
      onMapTypeChanged={(event) => onMapTypeChanged?.(event.nativeEvent)}
      onPaddingChanged={(event) => onPaddingChanged?.(event.nativeEvent)}
      onViewportChanged={(event) => onViewportChanged?.(event.nativeEvent)}
      onCameraOperation={(event) => onCameraOperation?.(event.nativeEvent)}
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
