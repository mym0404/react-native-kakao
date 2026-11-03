import type { Coordinate, MapPadding, MapWidgetPosition, ScreenPoint } from './types';
import type { MapImageSource } from './types-assets';

export type GuiColor = string;
export type GuiAlignment =
  | 'topLeft'
  | 'topCenter'
  | 'topRight'
  | 'centerLeft'
  | 'center'
  | 'centerRight'
  | 'bottomLeft'
  | 'bottomCenter'
  | 'bottomRight';

type GuiComponent = {
  id: string;
  /** Android supports taps on any clickable component; iOS emits taps from `button` nodes. */
  clickable?: boolean;
  padding?: MapPadding;
  origin?: GuiAlignment;
  align?: GuiAlignment;
};

export type GuiLayout = GuiComponent & {
  type: 'layout';
  orientation: 'horizontal' | 'vertical';
  children: GuiNode[];
  android?: { background?: GuiImage };
  ios?: {
    backgroundColor?: GuiColor;
    splitLine?: { color: GuiColor; width: number };
  };
};

export type GuiImage = GuiComponent & {
  type: 'image';
  source: MapImageSource;
  size?: { width: number; height: number };
  stretch?: MapPadding;
  child?: GuiNode;
};

export type GuiText = GuiComponent & {
  type: 'text';
  text: string;
  textSize: number;
  color: GuiColor;
  stroke?: { color: GuiColor; width: number };
};

export type GuiButton = GuiComponent & {
  type: 'button';
  /** Android SDK 2.15.2 does not contain its documented button class. */
  platform: 'ios';
  source: MapImageSource;
  pressedSource: MapImageSource;
  size?: { width: number; height: number };
  pressedSize?: { width: number; height: number };
  child?: GuiNode;
};

export type GuiAnimatedImage = GuiComponent & {
  type: 'animatedImage';
  /** Android SDK 2.15.2 does not contain its documented animated-image class. */
  platform: 'ios';
  sources: MapImageSource[];
  duration: number;
  repeat?: number;
  autoStart?: boolean;
  size?: { width: number; height: number };
  child?: GuiNode;
};

export type GuiNode = GuiLayout | GuiImage | GuiText | GuiButton | GuiAnimatedImage;

export type MapInfoWindow = {
  id: string;
  position: Coordinate;
  body: GuiNode;
  tail?: GuiImage;
  bodyOffset?: ScreenPoint;
  tailOffset?: ScreenPoint;
  visible?: boolean;
  zIndex?: number;
  autoMove?: { enabled: boolean; duration?: number };
};

export type MapWidget = {
  id: string;
  position: MapWidgetPosition;
  root: GuiLayout;
  visible?: boolean;
  zIndex?: number;
  rotation?: number;
  ios?: {
    backgroundColor?: GuiColor;
    splitLine?: { color: GuiColor; width: number };
  };
};

export type GuiInterpolation = 'linear' | 'cubicIn' | 'cubicOut' | 'cubicInOut';

export type InfoWindowDropAnimation = {
  id: string;
  /** Info-window animators are unavailable in Android SDK 2.15.2. */
  platform: 'ios';
  infoWindowIds: string[];
  duration: number;
  pixelHeight: number;
  interpolation?: GuiInterpolation;
  repeat?: number;
  hideAtStop?: boolean;
  removeAtStop?: boolean;
};

export type MapGuiScene = {
  infoWindows?: MapInfoWindow[];
  widgets?: MapWidget[];
  animations?: InfoWindowDropAnimation[];
};

export type MapGuiEvent =
  | {
      type: 'tap';
      ownerType: 'infoWindow' | 'widget';
      ownerId: string;
      componentId: string;
    }
  | {
      type: 'componentAnimationState';
      ownerType: 'infoWindow' | 'widget';
      ownerId: string;
      componentId: string;
      state: 'started' | 'paused' | 'resumed' | 'stopped' | 'unknown';
    }
  | {
      type: 'guiMoveEnd';
      ownerType: 'infoWindow' | 'widget';
      ownerId: string;
      position: Coordinate;
    }
  | { type: 'animatorStopped'; id: string };

export type MapGuiCapabilities = {
  button: boolean;
  animatedImage: boolean;
  infoWindowAnimation: boolean;
  arbitraryComponentClicks: boolean;
  componentAnimationEvents: boolean;
  guiMoveEvents: boolean;
  autoMoveDuration: boolean;
};

export type MapGuiStatus = {
  infoWindows: { id: string; visible: boolean; position: Coordinate; zIndex: number }[];
  widgets: {
    id: string;
    visible: boolean;
    position: MapWidgetPosition;
    rotation: number;
    zIndex: number;
  }[];
  animations: { id: string; running: boolean }[];
  counts: { infoWindows: number; widgets: number; animations: number };
  capabilities: MapGuiCapabilities;
};

export type ShowInfoWindowOptions = { autoMove?: boolean; duration?: number };
export type MoveInfoWindowOptions = { duration?: number };
export type AnimatedImageAction = 'start' | 'pause' | 'resume' | 'stop';
