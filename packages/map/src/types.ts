import type { ViewProps } from 'react-native';

export type CameraPosition = {
  latitude: number;
  longitude: number;
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

export type KakaoMapViewProps = ViewProps & {
  initialCamera?: CameraOptions;
  camera?: CameraOptions;
  onMapReady?: () => void;
  onError?: (error: KakaoMapError) => void;
  onCameraMoveStart?: (event: CameraMoveEvent) => void;
  onCameraIdle?: (event: CameraMoveEvent & { camera: CameraPosition }) => void;
  onMapClick?: (event: MapClickEvent) => void;
};

export type KakaoMapViewRef = {
  /** Resolves on command dispatch. Duration is milliseconds; omitted means immediate. */
  moveCamera: (camera: CameraOptions, options?: { duration?: number }) => Promise<void>;
  getCamera: () => Promise<CameraPosition>;
};
