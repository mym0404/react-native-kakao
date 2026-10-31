import type { Coordinate } from './types';
import type { MapImageSource } from './types-assets';
import type { ShapeColor, ShapeInterpolation } from './types-shapes';

export type RoutePattern = {
  /** Kakao route patterns use the source bitmap size; width and height overrides are rejected. */
  image: MapImageSource;
  /** Kakao route symbols use the source bitmap size; width and height overrides are rejected. */
  symbol?: MapImageSource;
  /** Density-independent pixels between patterns. */
  distance: number;
  pinStart?: boolean;
  pinEnd?: boolean;
};

export type RouteStyleLevel = {
  level: number;
  /** Density-independent pixels. */
  width: number;
  color: ShapeColor;
  /** Density-independent pixels. */
  strokeWidth?: number;
  strokeColor?: ShapeColor;
  patternIndex?: number;
};

export type RouteStyleSet = {
  id: string;
  styles: { levels: RouteStyleLevel[] }[];
  patterns?: RoutePattern[];
};

export type RouteLayerSpec = { id: string; zIndex?: number; visible?: boolean };

export type RouteSegmentSpec = {
  coordinates: Coordinate[];
  styleIndex?: number;
  /** Curves connect every adjacent coordinate pair. */
  curve?: 'none' | 'left' | 'right';
};

export type RouteSpec = {
  id: string;
  layerId: string;
  styleSetId: string;
  zIndex?: number;
  visible?: boolean;
  segments: RouteSegmentSpec[];
};

export type RouteScene = {
  styleSets?: RouteStyleSet[];
  layers?: RouteLayerSpec[];
  routes?: RouteSpec[];
};

export type RouteProgressAnimation = {
  animationId: string;
  routeIds: string[];
  direction: 'forward' | 'backward';
  mode: 'fill' | 'clear';
  duration: number;
  interpolation?: ShapeInterpolation;
  repeat?: number;
  hideAtStop?: boolean;
  resetToInitial?: boolean;
};

export type RouteCommand =
  | { type: 'setVisible'; ids: string[]; visible: boolean }
  | { type: 'setZIndex'; id: string; zIndex: number }
  | { type: 'changeData'; id: string; styleSetId: string; segments: RouteSegmentSpec[] }
  | { type: 'setProgress'; id: string; progress: number; mode: 'fill' | 'clear'; duration?: number }
  | { type: 'getProgress'; id: string }
  | { type: 'getRequestedProgress'; id: string }
  | { type: 'getProgressAtCoordinate'; id: string; coordinate: Coordinate }
  | { type: 'getCoordinateAtProgress'; id: string; progress: number }
  | { type: 'getState'; id: string }
  | { type: 'getCounts' }
  | { type: 'getCapabilities' }
  | { type: 'startProgressAnimation'; animation: RouteProgressAnimation }
  | { type: 'stopAnimation'; animationId: string }
  | { type: 'remove'; ids: string[] };

export type RouteCounts = { type: 'counts'; layers: number; routes: number; animations: number };

export type RouteCommandResult =
  | { type: 'none' }
  | { type: 'progress'; progress: number; source: 'native' | 'requested' }
  | ({ type: 'coordinate'; orientation?: number } & Coordinate)
  | {
      type: 'state';
      id: string;
      layerId: string;
      visible: boolean;
      zIndex: number;
      nativeProgress: number | null;
      requestedProgress: number;
    }
  | RouteCounts
  | ({ type: 'capabilities' } & RouteCapabilities);

export type RouteCapabilities = {
  curves: boolean;
  patterns: boolean;
  patternSymbols: boolean;
  patternImageSizing: boolean;
  progressAtCoordinate: boolean;
  coordinateAtProgress: boolean;
  nativeProgressRead: boolean;
  fractionalStyleWidth: boolean;
  progressAnimationRepeat: boolean;
};

export type RouteAnimationStopEvent = { animationId: string };

/** Completion of the latest requested route progress transition, not a native progress measurement. */
export type RouteProgressEvent = { id: string; progress: number; source: 'requested' };
