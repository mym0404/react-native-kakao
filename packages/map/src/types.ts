import type { ViewProps } from 'react-native';

import type {
  AdvancedCameraCommand,
  AdvancedCameraCommandResult,
  AdvancedCameraOperationEvent,
} from './types-camera';
import type {
  LabelAnimationEvent,
  LabelCapabilities,
  LabelClickEvent,
  LabelCommand,
  LabelRuntimeState,
  LabelScene,
} from './types-labels';

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type ScreenPoint = { x: number; y: number };
export type MapViewport = ScreenPoint & { width: number; height: number };
export type MapPadding = { top: number; right: number; bottom: number; left: number };
export type MapType = 'normal' | 'skyview';
export type MapOverlay = 'roadviewLine' | 'hillShading' | 'bicycleRoad' | 'hybrid';
export type MapGesture =
  | 'doubleTapZoomIn'
  | 'twoFingerTapZoomOut'
  | 'pan'
  | 'rotate'
  | 'zoom'
  | 'tilt'
  | 'longTapAndDrag'
  | 'rotateZoom'
  | 'oneFingerZoom';
export type MapWidgetPosition = ScreenPoint & {
  gravity:
    | 'topLeft'
    | 'topCenter'
    | 'topRight'
    | 'centerLeft'
    | 'center'
    | 'centerRight'
    | 'bottomLeft'
    | 'bottomCenter'
    | 'bottomRight';
};
export type MapOptions = {
  mapType?: MapType;
  /** Mutually exclusive with mapType. Custom configurations may require a Kakao agreement. */
  viewInfo?: { name: string; appName?: string };
  overlays?: MapOverlay[];
  /** Raw SDK overlay IDs for separately licensed map data. */
  customOverlays?: string[];
  language?: string;
  poi?: {
    visible?: boolean;
    clickable?: boolean;
    scale?: 'small' | 'regular' | 'large' | 'xLarge';
  };
  buildingScale?: number;
  padding?: MapPadding;
  zoomRange?: { min: number; max: number };
  gestures?: Partial<Record<MapGesture, boolean>>;
  compass?: { visible?: boolean; position?: MapWidgetPosition };
  scaleBar?: {
    visible?: boolean;
    position?: MapWidgetPosition;
    autoHide?: boolean;
    fade?: { inDuration: number; outDuration: number; retentionDuration: number };
  };
  logo?: MapWidgetPosition;
};

export type MapInfo = {
  mapType: MapType;
  viewInfoName: string;
  zoomRange: { min: number; max: number };
  padding: MapPadding;
  size: { width: number; height: number };
  viewport: MapViewport;
  language: string;
  supportedLanguages: string[];
  capabilities: { coordinateToScreen: boolean };
};

export type CameraUpdate =
  | { type: 'position'; position: Coordinate }
  | { type: 'zoom'; zoomLevel: number }
  | { type: 'orientation'; rotation: number; tilt: number }
  | { type: 'fit'; coordinates: Coordinate[] };

export type CameraPosition = Coordinate & {
  zoomLevel: number;
  /** Degrees from the vertical. The SDK may limit tilt at the current zoom. */
  tilt: number;
  /** Counterclockwise camera angle from north in degrees; returned as [0, 360). */
  rotation: number;
};

export type CameraOptions = Omit<CameraPosition, 'tilt' | 'rotation'> & {
  tilt?: number;
  rotation?: number;
};

export type KakaoMapError = { code: string; message: string };
export type CameraMoveEvent = { reason: 'gesture' | 'developer' };
export type MapClickEvent = { latitude: number; longitude: number; x: number; y: number };
export type PoiClickEvent = Coordinate & { id: string; layerId: string };

export type KakaoMapViewProps = ViewProps & {
  initialCamera?: CameraOptions;
  camera?: CameraOptions;
  /** Applies the supplied fields; omitted fields retain their current SDK values. */
  options?: MapOptions;
  labels?: LabelScene;
  onMapReady?: () => void;
  onError?: (error: KakaoMapError) => void;
  onCameraMoveStart?: (event: CameraMoveEvent) => void;
  onCameraIdle?: (event: CameraMoveEvent & { camera: CameraPosition }) => void;
  onMapClick?: (event: MapClickEvent) => void;
  onMapLongClick?: (event: Coordinate) => void;
  onTerrainClick?: (event: Coordinate) => void;
  /** Android only: receives SDK viewport taps, including object taps. */
  onViewportClick?: (event: MapClickEvent) => void;
  /** Android only. */
  onVisibilityChanged?: (event: { visible: boolean }) => void;
  /** iOS only. */
  onFocusChanged?: (event: { focused: boolean }) => void;
  onPoiClick?: (event: PoiClickEvent) => void;
  onCompassClick?: () => void;
  onMapTypeChanged?: (event: { viewInfoName: string }) => void;
  onPaddingChanged?: (event: MapPadding) => void;
  onViewportChanged?: (event: MapViewport) => void;
  onLabelClick?: (event: LabelClickEvent) => void;
  onLabelAnimationStopped?: (event: LabelAnimationEvent) => void;
  onLabelsChanged?: (event: LabelRuntimeState) => void;
  onCameraOperation?: (event: AdvancedCameraOperationEvent) => void;
};

export type KakaoMapViewRef = {
  /** Resolves on command dispatch. Duration is milliseconds; omitted means immediate. */
  moveCamera: (camera: CameraOptions, options?: { duration?: number }) => Promise<void>;
  getCamera: () => Promise<CameraPosition>;
  updateCamera: (update: CameraUpdate, options?: { duration?: number }) => Promise<void>;
  getMapInfo: () => Promise<MapInfo>;
  screenToCoordinate: (point: ScreenPoint) => Promise<Coordinate>;
  /** Android only: iOS SDK does not expose this projection. */
  coordinateToScreen: (coordinate: Coordinate) => Promise<ScreenPoint>;
  clearCache: () => Promise<void>;
  runLabelCommand: (command: LabelCommand) => Promise<void>;
  getLabelCapabilities: () => Promise<LabelCapabilities>;
  getLabelState: () => Promise<LabelRuntimeState>;
  /** Android only: resolves with the SDK's asynchronous POI state response. */
  executeCameraCommand: (command: AdvancedCameraCommand) => Promise<AdvancedCameraCommandResult>;
};
