import { forwardRef, type Ref, useImperativeHandle, useRef } from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import { requireNativeView } from 'expo';

import type { CameraPosition, KakaoMapError, ScreenPoint } from './types';
import type {
  KakaoMapRoadViewProps,
  KakaoMapRoadViewRef,
  KakaoRoadViewProps,
  KakaoRoadViewRef,
  RoadViewInfo,
  RoadViewRequest,
  RoadViewResult,
  RoadViewUpdate,
} from './types-roadview';

export type {
  KakaoMapRoadViewProps,
  KakaoMapRoadViewRef,
  KakaoRoadViewProps,
  KakaoRoadViewRef,
  MapZoneCommands,
  MapZoneEvent,
  RoadViewCapture,
  RoadViewImageSource,
  RoadViewInfo,
  RoadViewLookAt,
  RoadViewMarker,
  RoadViewRequest,
  RoadViewResult,
  RoadViewUpdate,
} from './types-roadview';

const roadViewModuleName = 'RNCKakaoRoadView';
const mapRoadViewModuleName = 'RNCKakaoMapRoadView';

type NativeRoadViewRef = {
  request: (request: RoadViewRequest) => Promise<void>;
  requestNext: (request: RoadViewRequest) => Promise<void>;
  moveToCapture: (index: number) => Promise<void>;
  getInfo: () => Promise<RoadViewInfo>;
  refresh: () => Promise<void>;
  linkMap: (linkId: string) => Promise<void>;
  unlinkMap: () => Promise<void>;
};

type NativeKakaoRoadViewProps = Omit<
  KakaoRoadViewProps,
  | 'onError'
  | 'onRoadViewResult'
  | 'onRoadViewRequestFailed'
  | 'onRoadViewUpdated'
  | 'onRoadViewResized'
  | 'onRoadViewClick'
  | 'onRoadViewFocusChanged'
> & {
  onError?: (event: NativeSyntheticEvent<KakaoMapError>) => void;
  onRoadViewResult?: (event: NativeSyntheticEvent<RoadViewResult>) => void;
  onRoadViewRequestFailed?: (event: NativeSyntheticEvent<KakaoMapError>) => void;
  onRoadViewUpdated?: (event: NativeSyntheticEvent<RoadViewUpdate>) => void;
  onRoadViewResized?: (event: NativeSyntheticEvent<{ width: number; height: number }>) => void;
  onRoadViewClick?: (event: NativeSyntheticEvent<ScreenPoint>) => void;
  onRoadViewFocusChanged?: (event: NativeSyntheticEvent<{ focused: boolean }>) => void;
};

const NativeRoadView = requireNativeView<
  Omit<NativeKakaoRoadViewProps, 'ref'> & {
    ref: Ref<NativeRoadViewRef>;
  }
>(roadViewModuleName);

type NativeMapRoadViewRef = NativeRoadViewRef & {
  setLinked: (linked: boolean) => Promise<void>;
  moveMapCamera: (
    camera: NonNullable<KakaoMapRoadViewProps['initialCamera']>,
    duration: number,
  ) => Promise<void>;
  getMapCamera: () => Promise<CameraPosition>;
};

const NativeMapRoadView = requireNativeView<
  NativeKakaoRoadViewProps &
    Omit<KakaoMapRoadViewProps, keyof KakaoRoadViewProps | 'onMapReady'> & {
      ref: Ref<NativeMapRoadViewRef>;
      onMapReady?: () => void;
    }
>(mapRoadViewModuleName);

export const KakaoRoadView = forwardRef<KakaoRoadViewRef, KakaoRoadViewProps>(
  function KakaoRoadView(
    {
      onRoadViewReady,
      onError,
      onRoadViewResult,
      onRoadViewNoResult,
      onRoadViewRequestFailed,
      onRoadViewUpdated,
      onRoadViewResized,
      onRoadViewClick,
      onRoadViewFocusChanged,
      ...props
    },
    ref,
  ) {
    const nativeRef = useRef<NativeRoadViewRef>(null);

    useImperativeHandle(
      ref,
      () => ({
        request: async (request) => getView().request(request),
        requestNext: async (request) => getView().requestNext(request),
        moveToCapture: async (index) => getView().moveToCapture(index),
        getInfo: async () => getView().getInfo(),
        refresh: async () => getView().refresh(),
        linkMap: async (linkId) => getView().linkMap(linkId),
        unlinkMap: async () => getView().unlinkMap(),
      }),
      [],
    );

    return (
      <NativeRoadView
        {...props}
        ref={nativeRef}
        onRoadViewReady={() => onRoadViewReady?.()}
        onError={(event) => onError?.(event.nativeEvent)}
        onRoadViewResult={(event) => onRoadViewResult?.(event.nativeEvent)}
        onRoadViewNoResult={() => onRoadViewNoResult?.()}
        onRoadViewRequestFailed={(event) => onRoadViewRequestFailed?.(event.nativeEvent)}
        onRoadViewUpdated={(event) => onRoadViewUpdated?.(event.nativeEvent)}
        onRoadViewResized={(event) => onRoadViewResized?.(event.nativeEvent)}
        onRoadViewClick={(event) => onRoadViewClick?.(event.nativeEvent)}
        onRoadViewFocusChanged={(event) => onRoadViewFocusChanged?.(event.nativeEvent)}
      />
    );

    function getView() {
      if (!nativeRef.current) {
        throw Object.assign(new Error('The roadview is not mounted.'), {
          code: 'ERR_KAKAO_MAP_VIEW_DESTROYED',
        });
      }

      return nativeRef.current;
    }
  },
);

export const KakaoMapRoadView = forwardRef<KakaoMapRoadViewRef, KakaoMapRoadViewProps>(
  function KakaoMapRoadView(
    {
      onMapReady,
      onRoadViewReady,
      onError,
      onRoadViewResult,
      onRoadViewNoResult,
      onRoadViewRequestFailed,
      onRoadViewUpdated,
      onRoadViewResized,
      onRoadViewClick,
      onRoadViewFocusChanged,
      ...props
    },
    ref,
  ) {
    const nativeRef = useRef<NativeMapRoadViewRef>(null);

    useImperativeHandle(
      ref,
      () => ({
        request: async (request) => getView().request(request),
        requestNext: async (request) => getView().requestNext(request),
        moveToCapture: async (index) => getView().moveToCapture(index),
        getInfo: async () => getView().getInfo(),
        refresh: async () => getView().refresh(),
        linkMap: async (linkId) => getView().linkMap(linkId),
        unlinkMap: async () => getView().unlinkMap(),
        setLinked: async (linked) => getView().setLinked(linked),
        moveMapCamera: async (camera, options) =>
          getView().moveMapCamera(camera, options?.duration ?? 0),
        getMapCamera: async () => getView().getMapCamera(),
      }),
      [],
    );

    return (
      <NativeMapRoadView
        {...props}
        ref={nativeRef}
        onMapReady={() => onMapReady?.()}
        onRoadViewReady={() => onRoadViewReady?.()}
        onError={(event) => onError?.(event.nativeEvent)}
        onRoadViewResult={(event) => onRoadViewResult?.(event.nativeEvent)}
        onRoadViewNoResult={() => onRoadViewNoResult?.()}
        onRoadViewRequestFailed={(event) => onRoadViewRequestFailed?.(event.nativeEvent)}
        onRoadViewUpdated={(event) => onRoadViewUpdated?.(event.nativeEvent)}
        onRoadViewResized={(event) => onRoadViewResized?.(event.nativeEvent)}
        onRoadViewClick={(event) => onRoadViewClick?.(event.nativeEvent)}
        onRoadViewFocusChanged={(event) => onRoadViewFocusChanged?.(event.nativeEvent)}
      />
    );

    function getView() {
      if (!nativeRef.current) {
        throw Object.assign(new Error('The map roadview is not mounted.'), {
          code: 'ERR_KAKAO_MAP_VIEW_DESTROYED',
        });
      }

      return nativeRef.current;
    }
  },
);
