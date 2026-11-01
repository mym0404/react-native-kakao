import type { ViewProps } from 'react-native';

import type {
  CameraOptions,
  CameraPosition,
  Coordinate,
  KakaoMapError,
  MapWidgetPosition,
  ScreenPoint,
} from './types';
import type { MapImageSource } from './types-assets';

export type RoadViewImageSource = MapImageSource;

export type RoadViewLookAt =
  | { type: 'coordinate'; coordinate: Coordinate }
  /** Angles are expressed in degrees. */
  | { type: 'orientation'; pan: number; tilt: number };

export type RoadViewMarker = (
  | {
      type: 'coordinate';
      coordinate: Coordinate;
      /** Android-only direction angle in degrees. */
      directionAngle?: number;
    }
  /** Angles are expressed in degrees. */
  | { type: 'orientation'; pan: number; tilt: number }
) & { image?: RoadViewImageSource };

export type RoadViewRequest = {
  coordinate?: Coordinate;
  panoramaId?: string;
  /** Android-only search radii in meters. */
  searchRange?: { primary: number; extended: number };
  lookAt?: RoadViewLookAt;
  markers?: RoadViewMarker[];
};

export type RoadViewCapture = {
  index: number;
  date: string;
  address?: string;
};

export type RoadViewResult = {
  panoramaId: string;
  coordinate: Coordinate;
  date?: string;
  captures?: RoadViewCapture[];
};

export type RoadViewUpdate = {
  panoramaId?: string;
  pan?: number;
  tilt?: number;
};

export type RoadViewInfo = {
  pan: number;
  tilt: number;
  capabilities: {
    coordinateDirectionMarkers: boolean;
    customSearchRange: boolean;
    datedCaptures: boolean;
    focusEvents: boolean;
    nextRequest: boolean;
    noResultEvents: boolean;
    mapLink: boolean;
    refresh: boolean;
  };
};

export type KakaoRoadViewProps = ViewProps & {
  initialRequest?: RoadViewRequest;
  visible?: boolean;
  logo?: MapWidgetPosition;
  onRoadViewReady?: () => void;
  onError?: (error: KakaoMapError) => void;
  onRoadViewResult?: (event: RoadViewResult) => void;
  onRoadViewNoResult?: () => void;
  onRoadViewRequestFailed?: (error: KakaoMapError) => void;
  onRoadViewUpdated?: (event: RoadViewUpdate) => void;
  onRoadViewResized?: (event: { width: number; height: number }) => void;
  onRoadViewClick?: (point: ScreenPoint) => void;
  onRoadViewFocusChanged?: (event: { focused: boolean }) => void;
};

export type KakaoRoadViewRef = {
  request: (request: RoadViewRequest) => Promise<void>;
  /** Android only. */
  requestNext: (request: RoadViewRequest) => Promise<void>;
  /** Android only. Uses an index returned in RoadViewResult.captures. */
  moveToCapture: (index: number) => Promise<void>;
  getInfo: () => Promise<RoadViewInfo>;
  /** iOS only. */
  refresh: () => Promise<void>;
  /** Standalone views reject this call. KakaoMapRoadView links only its owned map. */
  linkMap: (linkId: string) => Promise<void>;
  unlinkMap: () => Promise<void>;
};

export type KakaoMapRoadViewProps = KakaoRoadViewProps & {
  layout?: 'horizontal' | 'vertical';
  /** Portion of the component allocated to the map. Must be greater than 0 and less than 1. */
  mapFraction?: number;
  linked?: boolean;
  initialCamera?: CameraOptions;
  onMapReady?: () => void;
};

export type KakaoMapRoadViewRef = KakaoRoadViewRef & {
  setLinked: (linked: boolean) => Promise<void>;
  moveMapCamera: (camera: CameraOptions, options?: { duration?: number }) => Promise<void>;
  getMapCamera: () => Promise<CameraPosition>;
};

export type MapZoneEvent = {
  zoneType: string;
  zoneId: string;
  detailId: string;
  details: string[];
  links: Record<string, { zoneId: string; detailId: string }[]>;
};

export type MapZoneCommands = {
  setZoneCheckRectScale: (
    zoneType: string,
    level: number,
    scale: { x: number; y: number },
  ) => Promise<void>;
  showZoneDetail: (zoneType: string, zoneId: string, detailId: string) => Promise<void>;
  hideZoneDetail: (zoneType: string) => Promise<void>;
};
