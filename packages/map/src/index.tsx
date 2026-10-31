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
import type { LabelAnimationEvent, LabelClickEvent, LabelRuntimeState } from './types-labels';
import type { ShapeAnimationStopEvent, ShapeCounts } from './types-shapes';

export type { MapImageSource } from './types-assets';
export type * from './types-labels';
export type * from './types-shapes';
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
    | 'onLabelClick'
    | 'onLabelAnimationStopped'
    | 'onLabelsChanged'
    | 'onShapeAnimationStop'
    | 'onShapesChanged'
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
    onLabelClick?: (event: NativeSyntheticEvent<LabelClickEvent>) => void;
    onLabelAnimationStopped?: (event: NativeSyntheticEvent<LabelAnimationEvent>) => void;
    onLabelsChanged?: (event: NativeSyntheticEvent<LabelRuntimeState>) => void;
    onShapeAnimationStop?: (event: NativeSyntheticEvent<ShapeAnimationStopEvent>) => void;
    onShapesChanged?: (event: NativeSyntheticEvent<ShapeCounts>) => void;
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
    onLabelClick,
    onLabelAnimationStopped,
    onLabelsChanged,
    onShapeAnimationStop,
    onShapesChanged,
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
      async runLabelCommand(command) {
        await getView().runLabelCommand(command);
      },
      async getLabelCapabilities() {
        return getView().getLabelCapabilities();
      },
      async getLabelState() {
        return getView().getLabelState();
      },
      async applyShapes(scene) {
        return getView().applyShapes(scene);
      },
      async executeShapeCommand(command) {
        return getView().executeShapeCommand(command);
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
      onLabelClick={(event) => onLabelClick?.(event.nativeEvent)}
      onLabelAnimationStopped={(event) => onLabelAnimationStopped?.(event.nativeEvent)}
      onLabelsChanged={(event) => onLabelsChanged?.(event.nativeEvent)}
      onShapeAnimationStop={(event) => onShapeAnimationStop?.(event.nativeEvent)}
      onShapesChanged={(event) => onShapesChanged?.(event.nativeEvent)}
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
