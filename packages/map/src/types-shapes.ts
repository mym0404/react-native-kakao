import type { Coordinate } from './types';

export type ShapeColor = string;
/** Model-space meters; not an equal-ground-distance contract. */
export type ShapePoint = { x: number; y: number };
export type ShapeLayerPass = 'default' | 'overlay' | 'route';
export type ShapeInterpolation = 'linear' | 'cubicIn' | 'cubicOut' | 'cubicInOut';

export type ShapePolygonPart<T> = {
  outer: T[];
  holes?: T[][];
  styleIndex?: number;
  mergeOverlappedHoles?: boolean;
};

export type ShapeLinePart<T> = { points: T[]; styleIndex?: number };

export type GeographicPolygonGeometry = {
  type: 'geographicPolygon';
  parts: ShapePolygonPart<Coordinate>[];
};

export type ModelPolygonGeometry = {
  type: 'modelPolygon';
  base: Coordinate;
  orientation?: number;
  parts: ShapePolygonPart<ShapePoint>[];
};

export type GeographicPolylineGeometry = {
  type: 'geographicPolyline';
  parts: ShapeLinePart<Coordinate>[];
};

export type ModelPolylineGeometry = {
  type: 'modelPolyline';
  base: Coordinate;
  orientation?: number;
  parts: ShapeLinePart<ShapePoint>[];
};

export type ShapePrimitiveGeometry =
  | {
      type: 'modelCircle';
      base: Coordinate;
      /** Model-space meters. */
      radius: number;
      pointCount?: number;
      clockwise?: boolean;
      orientation?: number;
      styleIndex?: number;
    }
  | {
      type: 'modelRectangle';
      base: Coordinate;
      /** Model-space meters. */
      width: number;
      /** Model-space meters. */
      height: number;
      clockwise?: boolean;
      orientation?: number;
      styleIndex?: number;
    }
  | {
      type: 'geographicCircle';
      center: Coordinate;
      /** Meters. */
      radius: number;
      pointCount?: number;
      clockwise?: boolean;
      styleIndex?: number;
    }
  | {
      type: 'geographicRectangle';
      center: Coordinate;
      /** Meters. */
      width: number;
      /** Meters. */
      height: number;
      clockwise?: boolean;
      styleIndex?: number;
    }
  | {
      type: 'geographicCurve';
      start: Coordinate;
      end: Coordinate;
      side: 'left' | 'right';
      styleIndex?: number;
    }
  | {
      type: 'modelArc';
      base: Coordinate;
      /** Model-space meters. */
      radius: number;
      /** Degrees clockwise from north. */
      startAngle: number;
      /** Degrees clockwise from north. */
      endAngle: number;
      pointCount?: number;
      clockwise?: boolean;
      orientation?: number;
      styleIndex?: number;
    }
  | {
      type: 'geographicArc';
      center: Coordinate;
      /** Meters. */
      radius: number;
      /** Degrees clockwise from north. */
      startAngle: number;
      /** Degrees clockwise from north. */
      endAngle: number;
      pointCount?: number;
      clockwise?: boolean;
      styleIndex?: number;
    };

export type ShapeGeometry =
  | GeographicPolygonGeometry
  | ModelPolygonGeometry
  | GeographicPolylineGeometry
  | ModelPolylineGeometry
  | ShapePrimitiveGeometry;

export type PolygonStyleLevel = {
  level: number;
  fillColor: ShapeColor;
  strokeColor?: ShapeColor;
  /** Density-independent pixels. */
  strokeWidth?: number;
};

export type PolylineStyleLevel = {
  level: number;
  color: ShapeColor;
  /** Density-independent pixels. */
  width: number;
  strokeColor?: ShapeColor;
  /** Density-independent pixels. */
  strokeWidth?: number;
};

export type PolygonStyleSet = {
  type: 'polygon';
  id: string;
  styles: { levels: PolygonStyleLevel[] }[];
};

export type PolylineStyleSet = {
  type: 'polyline';
  id: string;
  cap?: 'butt' | 'round' | 'square';
  styles: { levels: PolylineStyleLevel[] }[];
};

export type ShapeStyleSet = PolygonStyleSet | PolylineStyleSet;

export type ShapeLayerSpec = {
  id: string;
  zIndex?: number;
  visible?: boolean;
  /** `route` requires SDK support; capability is reported by the native manager. */
  pass?: ShapeLayerPass;
};

export type ShapeSpec = {
  id: string;
  layerId: string;
  styleSetId: string;
  zIndex?: number;
  visible?: boolean;
  geometry: ShapeGeometry;
};

export type ShapeScene = {
  styleSets?: ShapeStyleSet[];
  layers?: ShapeLayerSpec[];
  shapes?: ShapeSpec[];
};

export type ShapeWaveAnimation = {
  animationId: string;
  shapeIds: string[];
  duration: number;
  frames: {
    level: number;
    startAlpha: number;
    endAlpha: number;
    /** Density-independent pixels. */
    startRadius: number;
    /** Density-independent pixels. */
    endRadius: number;
  }[];
  interpolation?: ShapeInterpolation;
  repeat?: number;
  hideAtStop?: boolean;
};

export type ShapeCommand =
  | { type: 'setVisible'; ids: string[]; visible: boolean }
  | { type: 'setZIndex'; id: string; zIndex: number }
  | { type: 'setPosition'; id: string; position: Coordinate }
  | { type: 'setOrientation'; id: string; orientation: number }
  | { type: 'changeData'; id: string; styleSetId: string; geometry: ShapeGeometry }
  | { type: 'startWave'; animation: ShapeWaveAnimation }
  | { type: 'stopAnimation'; animationId: string }
  | { type: 'getState'; id: string }
  | { type: 'getCounts' }
  | { type: 'getCapabilities' }
  | { type: 'remove'; ids: string[] };

export type ShapeCounts = { type: 'counts'; layers: number; shapes: number; animations: number };

export type ShapeCommandResult =
  | { type: 'none' }
  | {
      type: 'state';
      id: string;
      layerId: string;
      visible: boolean;
      zIndex: number;
      geometryType: ShapeGeometry['type'];
      position: Coordinate | null;
      orientation: number | null;
    }
  | ShapeCounts
  | ({ type: 'capabilities' } & ShapeCapabilities);

export type ShapeCapabilities = {
  layerPasses: ShapeLayerPass[];
  geographicPrimitives: boolean;
  modelPrimitives: boolean;
  geographicPosition: boolean;
  geographicOrientation: boolean;
  modelPosition: boolean;
  modelOrientation: boolean;
  zIndexMutation: boolean;
  fractionalStyleWidth: boolean;
  waveAnimation: boolean;
  waveTargets: ('polygon' | 'polyline')[];
  waveNaturalStopEvent: boolean;
};

export type ShapeAnimationStopEvent = { animationId: string };
