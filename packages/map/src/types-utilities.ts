import type { MapViewport } from './types';

export type MapPoiCategory =
  | 'policyCategory'
  | 'address'
  | 'district'
  | 'busStop'
  | 'railroadPlatform'
  | 'railroadEntrance'
  | 'railroadLine'
  | 'brand'
  | 'place'
  | 'climb'
  | 'climbWave'
  | 'road'
  | 'roadNumber'
  | 'roadInfo'
  | 'facilities'
  | 'publicFacilities'
  | 'apartNumber'
  | 'apartDetail'
  | 'houseNumber'
  | 'land'
  | 'indoor'
  | 'indoorPlace'
  | 'detailCategory';

export type MapCoordinateSystem = 'wgs84' | 'wtm' | 'wcong' | 'kakao';
export type MapCoordinateValue = { x: number; y: number };
export type MapCacheKind = 'disk' | 'memory' | 'viewInfo' | 'all';
export type MapPoiScale = 'small' | 'regular' | 'large' | 'xLarge';
export type MapPoiState = {
  visible: boolean;
  clickable: boolean;
  scale: MapPoiScale;
  language: string | null;
};

export type MapUtilityCommand =
  | { type: 'getCapabilities' }
  | { type: 'getState' }
  | { type: 'setPoiVisible'; visible: boolean }
  | { type: 'setPoiCategoryVisible'; category: MapPoiCategory; visible: boolean }
  | { type: 'setPoiCategoryMaxCount'; category: MapPoiCategory; count: number }
  | { type: 'resetPoiCategoryMaxCount'; category: MapPoiCategory }
  | { type: 'setTapInterval'; milliseconds: number }
  | { type: 'setCameraAnimationEnabled'; enabled: boolean }
  | { type: 'setEnabled'; enabled: boolean }
  | { type: 'setVisible'; visible: boolean }
  | { type: 'setKeepLevelOnResize'; enabled: boolean }
  | { type: 'getViewport' }
  | { type: 'setViewport'; viewport: MapViewport }
  | { type: 'refresh' }
  | { type: 'registerFont'; resourceName: string; name?: string }
  | { type: 'getVersion'; component: 'sdk' | 'engine' }
  | {
      type: 'convertCoordinate';
      from: MapCoordinateSystem;
      to: MapCoordinateSystem;
      coordinate: MapCoordinateValue;
    }
  | { type: 'clearCache'; kind: MapCacheKind };

export type MapUtilityCapabilities = {
  type: 'capabilities';
  poi: {
    visibility: boolean;
    visibilityReadable: boolean;
    categoryVisibility: boolean;
    categoryMaxCount: boolean;
    stateRequest: boolean;
    categories: MapPoiCategory[];
  };
  settings: {
    tapInterval: boolean;
    cameraAnimationEnabled: boolean;
    cameraAnimationEnabledReadable: boolean;
    enabled: boolean;
    visible: boolean;
    keepLevelOnResize: boolean;
    refresh: boolean;
    focusedReadable: boolean;
  };
  viewport: { readable: boolean; writable: boolean };
  fontRegistration: boolean;
  versionComponents: ('sdk' | 'engine')[];
  coordinateSystems: MapCoordinateSystem[];
  coordinateConversions: `${MapCoordinateSystem}:${MapCoordinateSystem}`[];
  cacheKinds: MapCacheKind[];
};

export type MapUtilityState = {
  type: 'state';
  tapInterval: number;
  cameraAnimationEnabled?: boolean;
  poiVisible?: boolean;
  enabled?: boolean;
  visible?: boolean;
  keepLevelOnResize?: boolean;
  focused?: boolean;
};

export type MapUtilityResult =
  | { type: 'none' }
  | MapUtilityCapabilities
  | MapUtilityState
  | { type: 'version'; component: 'sdk' | 'engine'; version: string }
  | { type: 'viewport'; viewport: MapViewport }
  | {
      type: 'coordinate';
      system: MapCoordinateSystem;
      coordinate: MapCoordinateValue;
    };

export type MapPoiStateResult = { type: 'poiState'; state: MapPoiState };
