import type {
  GeographicPolygonGeometry,
  ModelPolygonGeometry,
  PolygonStyleSet,
  ShapeWaveAnimation,
} from './types-shapes';

export type DimScreenCover = 'map' | 'mapAndRoute' | 'mapAndLabel' | 'all';

export type DimScreenHighlight = {
  id: string;
  styleSetId: string;
  geometry: GeographicPolygonGeometry | ModelPolygonGeometry;
  visible?: boolean;
  zIndex?: number;
};

export type DimScreenOptions = {
  enabled: boolean;
  color: string;
  /** iOS SDK 2.12.19 does not support `mapAndRoute`. */
  cover: DimScreenCover;
  /** Android only; the iOS dim screen has no z-order property. */
  zIndex?: number;
  styleSets?: PolygonStyleSet[];
  highlights?: DimScreenHighlight[];
  animations?: ShapeWaveAnimation[];
};

export type DimScreenStatus = {
  /** Null when the platform SDK exposes no getter for the applied configuration. */
  enabled: boolean | null;
  color: string | null;
  cover: DimScreenCover | null;
  highlights: {
    id: string;
    visible: boolean;
    geometryType: DimScreenHighlight['geometry']['type'];
  }[];
  /** `running` is null when the native SDK does not expose animator state. */
  animations: { id: string; running: boolean | null }[];
  counts: { highlights: number; animations: number };
  capabilities: {
    coversRoute: boolean;
    modelHighlights: boolean;
    modelOrientation: boolean;
    animations: boolean;
    animationDuration: boolean;
    animationState: boolean;
    nativeConfigurationState: boolean;
  };
};

export type DimScreenEvent = { type: 'animationStopped'; id: string };
