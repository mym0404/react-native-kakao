import type { Coordinate, MapGesture, ScreenPoint } from './types';

export type AdvancedCameraAnimation = {
  /** Milliseconds. Zero dispatches without an animation. */
  duration: number;
  autoElevation?: boolean;
  consecutive?: boolean;
};

export type HeightCameraPosition = Coordinate & {
  /** Camera height in the native map coordinate system. */
  height: number;
  /** Degrees from the vertical. */
  tilt: number;
  /** Counterclockwise camera angle from north in degrees. */
  rotation: number;
};

export type CameraReferenceGesture = Extract<
  MapGesture,
  'rotate' | 'zoom' | 'tilt' | 'rotateZoom' | 'oneFingerZoom'
>;

type AnimatedAdvancedCameraCommand = {
  animation?: AdvancedCameraAnimation;
  /**
   * Requests an actual-completion event. Unsupported platforms reject this field rather than
   * reporting dispatch as completion.
   */
  operationId?: string;
};

export type AdvancedCameraCommand =
  | { type: 'getCapabilities' }
  | { type: 'getState' }
  | ({ type: 'moveToHeight'; camera: HeightCameraPosition } & AnimatedAdvancedCameraCommand)
  | ({
      type: 'transform';
      delta: Partial<Coordinate> & {
        height?: number;
        rotation?: number;
        tilt?: number;
      };
    } & AnimatedAdvancedCameraCommand)
  | ({
      type: 'fit';
      coordinates: Coordinate[];
      /** Logical React Native pixels. */
      padding?: number;
      levelLimit?: number;
    } & AnimatedAdvancedCameraCommand)
  | {
      type: 'canShow';
      coordinates: Coordinate[];
      zoomLevel: number;
      rotation?: number;
      weight?: number;
      /** Logical React Native pixels. */
      rect?: ScreenPoint & { width: number; height: number };
    }
  | { type: 'heightAtLevel'; zoomLevel: number }
  | ({ type: 'resetOrientation' } & AnimatedAdvancedCameraCommand)
  | { type: 'setBackToNorthDuringAutoElevation'; enabled: boolean }
  | { type: 'setReferencePointLock'; gesture: CameraReferenceGesture; locked: boolean };

export type AdvancedCameraCapabilities = {
  transform: boolean;
  absoluteHeight: boolean;
  heightAtLevel: boolean;
  fit: { padding: boolean; levelLimit: boolean };
  canShow: { basic: boolean; rotation: boolean; weight: boolean; rect: boolean };
  resetOrientation: boolean;
  backToNorthDuringAutoElevation: boolean;
  animation: {
    autoElevation: boolean;
    consecutive: boolean;
    operationCompletion: boolean;
  };
  referencePoint: { supported: boolean; gestures: CameraReferenceGesture[] };
};

export type AdvancedCameraState = HeightCameraPosition & { zoomLevel: number };

export type AdvancedCameraCommandResult =
  | { type: 'capabilities'; capabilities: AdvancedCameraCapabilities }
  | { type: 'state'; camera: AdvancedCameraState }
  | { type: 'dispatched'; operationId?: string }
  | { type: 'canShow'; value: boolean }
  | { type: 'heightAtLevel'; height: number }
  | { type: 'applied' };

export type AdvancedCameraOperationEvent = {
  operationId: string;
  status: 'completed' | 'superseded';
  /** Actual SDK state at the time the event was emitted. */
  camera?: AdvancedCameraState;
};
