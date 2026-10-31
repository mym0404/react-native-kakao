import type { Coordinate, ScreenPoint } from './types';
import type { MapImageSource } from './types-assets';

export type LabelTransition = 'none' | 'alpha' | 'scale';
export type LabelTransitionStyle = {
  entrance: LabelTransition;
  exit: LabelTransition;
  enableEntrance?: boolean;
  enableExit?: boolean;
};
export type LabelTransform =
  | 'none'
  | 'absoluteRotation'
  | 'default'
  | 'absoluteRotationKeepUpright'
  | 'absoluteRotationDecal'
  | 'decal';
export type LabelCompetition =
  | 'none'
  | 'all'
  | 'upper'
  | 'upperLower'
  | 'upperSame'
  | 'same'
  | 'sameLower'
  | 'lower';
export type LabelCompetitionUnit = 'iconAndText' | 'iconFirst';
export type LabelOrdering = 'rank' | 'leftBottom';
export type LabelInterpolation = 'linear' | 'cubicIn' | 'cubicOut' | 'cubicInOut';
export type LabelTextLayout = 'center' | 'top' | 'bottom' | 'left' | 'right';

export type LabelBadgeStyle = {
  id: string;
  image: MapImageSource;
  offset?: ScreenPoint;
  zOrder?: number;
};

export type LabelTextLineStyle = {
  fontFamily?: string;
  fontSize: number;
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
  /** Logical spacing; Android requires at least -2 native pixels after conversion. */
  characterSpacing?: number;
  /** Line-height multiplier, at least 1. Defaults to 1. */
  lineSpacing?: number;
  aspectRatio?: number;
};

export type PerLevelLabelStyle = {
  level: number;
  image?: MapImageSource;
  anchor?: ScreenPoint;
  padding?: number;
  iconTransition?: LabelTransitionStyle;
  textTransition?: LabelTransitionStyle;
  textLayout?: LabelTextLayout;
  textLines?: LabelTextLineStyle[];
  badges?: LabelBadgeStyle[];
};

export type LabelStyle = { id: string; levels: PerLevelLabelStyle[] };
export type PathTextStyle = {
  id: string;
  levels: { level: number; text: LabelTextLineStyle }[];
};

export type LabelLayer = {
  id: string;
  visible?: boolean;
  clickable?: boolean;
  zOrder?: number;
  competition?: LabelCompetition;
  competitionUnit?: LabelCompetitionUnit;
  ordering?: LabelOrdering;
  competitionExceptions?: string[];
};

export type LodLabelLayer = LabelLayer & { radius?: number };

export type LabelText = { value: string; styleIndex?: number };
export type LabelBadge = LabelBadgeStyle & { visible?: boolean };

export type MapLabel = {
  id: string;
  layerId: string;
  styleId: string;
  coordinate: Coordinate;
  text?: LabelText[];
  rank?: number;
  clickable?: boolean;
  visible?: boolean;
  transform?: LabelTransform;
  pixelOffset?: ScreenPoint;
  orientation?: number;
  scale?: ScreenPoint;
  badges?: LabelBadge[];
};

export type LodMapLabel = Omit<MapLabel, 'pixelOffset' | 'orientation' | 'scale'>;

export type PathMapLabel = {
  id: string;
  layerId: string;
  styleId: string;
  points: Coordinate[];
  text: string;
  rank?: number;
  visible?: boolean;
};

export type LabelAnimationKeyframe = {
  duration: number;
  interpolation?: LabelInterpolation;
  alpha?: number;
  scale?: ScreenPoint;
  translation?: ScreenPoint;
  rotation?: number;
};

export type LabelAnimation = {
  id: string;
  labelIds: string[];
  effect: 'drop' | 'alpha' | 'scale' | 'scaleAlpha' | 'transform';
  keyframes: LabelAnimationKeyframe[];
  repeatCount?: number;
  hideAtStop?: boolean;
  removeAtStop?: boolean;
  resetToInitialState?: boolean;
};

export type LabelScene = {
  styles?: LabelStyle[];
  pathTextStyles?: PathTextStyle[];
  layers?: LabelLayer[];
  lodLayers?: LodLabelLayer[];
  labels?: MapLabel[];
  lodLabels?: LodMapLabel[];
  pathLabels?: PathMapLabel[];
  animations?: LabelAnimation[];
};

export type LabelCommand =
  | { type: 'show'; id: string; visible: boolean; autoMove?: boolean; duration?: number }
  | { type: 'move'; id: string; coordinate: Coordinate; duration?: number }
  | {
      type: 'movePath';
      id: string;
      points: Coordinate[];
      duration: number;
      /** These two path parameters pass through raw SDK values; their units are undocumented. */
      cornerRadius?: number;
      jumpThreshold?: number;
      rotate?: boolean;
      baseRotation?: number;
    }
  | { type: 'rotate'; id: string; rotation: number; duration?: number }
  | { type: 'scale'; id: string; scale: ScreenPoint; duration?: number }
  | { type: 'sharePosition'; sourceId: string; targetId: string; enabled: boolean }
  | { type: 'shareTransform'; sourceId: string; targetId: string; enabled: boolean }
  | { type: 'setBadgeVisibility'; id: string; badgeId: string; visible: boolean; style?: boolean }
  | { type: 'startAnimation'; id: string }
  | { type: 'stopAnimation'; id: string }
  | { type: 'startTracking'; id: string; rotate?: boolean }
  | { type: 'stopTracking' };

export type LabelClickEvent = {
  id: string;
  layerId: string;
  kind: 'label' | 'lodLabel';
  coordinate: Coordinate;
};

export type LabelAnimationEvent = { id: string; finished: boolean };

export type LabelCapabilities = {
  pathText: 'polylineLabel' | 'waveText';
  pathTextRank: boolean;
  pathTextStyleAddition: true;
  pathTextStyleDefinitionUpdate: boolean;
  pathTextStyleRegistrationRemoval: boolean;
  lodPositionMutation: false;
  lodAutoMove: boolean;
  autoMoveDuration: boolean;
  labelScaleCommand: boolean;
  competitionExceptions: boolean;
  supportedTransforms: LabelTransform[];
  keyframeRepeatCount: false;
  trackingStateSource: 'native' | 'managed';
  remoteImages: boolean;
};

export type LabelRuntimeState = {
  labels: (
    | { id: string; kind: 'label'; visible: boolean; coordinate: Coordinate }
    /** iOS does not expose the current LOD label position. */
    | { id: string; kind: 'lodLabel'; visible: boolean; coordinate?: Coordinate }
    | { id: string; kind: 'pathLabel'; visible: boolean }
  )[];
  animationIds: string[];
  tracking: { active: boolean; source: 'native' | 'managed' };
};
