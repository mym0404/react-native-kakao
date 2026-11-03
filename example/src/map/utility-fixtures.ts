import type { MapPoiCategory, MapUtilityCommand } from '../../../packages/map/src/types-utilities';

const PANGYO_WGS84 = { x: 127.1112, y: 37.3947 } as const;

export const utilityFixtureCategories = [
  'place',
  'road',
  'busStop',
  'railroadPlatform',
] satisfies MapPoiCategory[];

export const utilityFixtureCommands = {
  capabilities: { type: 'getCapabilities' },
  state: { type: 'getState' },
  hidePlaces: { type: 'setPoiCategoryVisible', category: 'place', visible: false },
  showPlaces: { type: 'setPoiCategoryVisible', category: 'place', visible: true },
  limitPlaces: { type: 'setPoiCategoryMaxCount', category: 'place', count: 2 },
  resetPlaces: { type: 'resetPoiCategoryMaxCount', category: 'place' },
  setTapInterval: { type: 'setTapInterval', milliseconds: 300 },
  disableCameraAnimation: { type: 'setCameraAnimationEnabled', enabled: false },
  enableCameraAnimation: { type: 'setCameraAnimationEnabled', enabled: true },
  viewport: { type: 'getViewport' },
  insetViewport: {
    type: 'setViewport',
    viewport: { x: 16, y: 24, width: 240, height: 320 },
  },
  registerFixtureFont: { type: 'registerFont', resourceName: 'map_fixture', name: 'MapFixture' },
  refresh: { type: 'refresh' },
  sdkVersion: { type: 'getVersion', component: 'sdk' },
  engineVersion: { type: 'getVersion', component: 'engine' },
  wgs84ToWtm: {
    type: 'convertCoordinate',
    from: 'wgs84',
    to: 'wtm',
    coordinate: PANGYO_WGS84,
  },
  clearDiskCache: { type: 'clearCache', kind: 'disk' },
} satisfies Record<string, MapUtilityCommand>;
