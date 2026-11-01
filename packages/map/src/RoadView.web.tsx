import { forwardRef } from 'react';

import type {
  KakaoMapRoadViewProps,
  KakaoMapRoadViewRef,
  KakaoRoadViewProps,
  KakaoRoadViewRef,
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

export const KakaoRoadView = forwardRef<KakaoRoadViewRef, KakaoRoadViewProps>(
  function KakaoRoadView() {
    throw Object.assign(new Error('KakaoRoadView supports Android and iOS only.'), {
      code: 'ERR_KAKAO_MAP_UNSUPPORTED_PLATFORM',
    });
  },
);

export const KakaoMapRoadView = forwardRef<KakaoMapRoadViewRef, KakaoMapRoadViewProps>(
  function KakaoMapRoadView() {
    throw Object.assign(new Error('KakaoMapRoadView supports Android and iOS only.'), {
      code: 'ERR_KAKAO_MAP_UNSUPPORTED_PLATFORM',
    });
  },
);
