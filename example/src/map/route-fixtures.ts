import { Image, Platform } from 'react-native';

import type { RouteCommand, RouteScene } from '../../../packages/map/src/types-routes';

const PANGYO_WEST = { latitude: 37.3945, longitude: 127.1088 } as const;
const PANGYO = { latitude: 37.3947, longitude: 127.1112 } as const;
const PANGYO_EAST = { latitude: 37.395, longitude: 127.114 } as const;
const PANGYO_NORTH = { latitude: 37.397, longitude: 127.113 } as const;

const bundledPatternUri =
  Platform.OS === 'web'
    ? ''
    : Image.resolveAssetSource(require('../../assets/icon.png'))?.uri ?? '';

export const routeFixtureScene = {
  styleSets: [
    {
      id: 'fixture-route-style',
      patterns: [
        {
          image: { uri: bundledPatternUri },
          symbol: { uri: bundledPatternUri },
          distance: 36,
          pinStart: true,
          pinEnd: true,
        },
      ],
      styles: [
        {
          levels: [
            {
              level: 0,
              width: 7,
              color: '#22C55EFF',
              strokeWidth: 2,
              strokeColor: '#14532DFF',
              patternIndex: 0,
            },
            {
              level: 16,
              width: 10,
              color: '#4ADE80FF',
              strokeWidth: 3,
              strokeColor: '#052E16FF',
              patternIndex: 0,
            },
          ],
        },
        { levels: [{ level: 0, width: 5, color: '#F97316FF' }] },
      ],
    },
  ],
  layers: [{ id: 'fixture-route-layer', zIndex: 4, visible: true }],
  routes: [
    {
      id: 'fixture-route',
      layerId: 'fixture-route-layer',
      styleSetId: 'fixture-route-style',
      zIndex: 2,
      visible: true,
      segments: [
        { coordinates: [PANGYO_WEST, PANGYO, PANGYO_EAST], styleIndex: 0, curve: 'none' },
        { coordinates: [PANGYO_EAST, PANGYO_NORTH], styleIndex: 1, curve: 'left' },
      ],
    },
  ],
} satisfies RouteScene;

export const emptyRouteFixtureScene = {} satisfies RouteScene;

export const routeFixtureApplyActions = {
  applyComplete: { type: 'applyRoutes', scene: routeFixtureScene },
  removeAll: { type: 'applyRoutes', scene: emptyRouteFixtureScene },
} as const;

export const routeFixtureCommands = {
  hide: { type: 'setVisible', ids: ['fixture-route'], visible: false },
  show: { type: 'setVisible', ids: ['fixture-route'], visible: true },
  setZIndex: { type: 'setZIndex', id: 'fixture-route', zIndex: 9 },
  changeSegments: {
    type: 'changeData',
    id: 'fixture-route',
    styleSetId: 'fixture-route-style',
    segments: [{ coordinates: [PANGYO_WEST, PANGYO_NORTH], styleIndex: 1, curve: 'right' }],
  },
  setProgress: {
    type: 'setProgress',
    id: 'fixture-route',
    progress: 0.6,
    mode: 'fill',
    duration: 500,
  },
  setProgressImmediate: {
    type: 'setProgress',
    id: 'fixture-route',
    progress: 0.25,
    mode: 'fill',
    duration: 0,
  },
  setProgressLong: {
    type: 'setProgress',
    id: 'fixture-route',
    progress: 0.8,
    mode: 'fill',
    duration: 5_000,
  },
  setProgressSuperseding: {
    type: 'setProgress',
    id: 'fixture-route',
    progress: 0.2,
    mode: 'fill',
    duration: 100,
  },
  requestedProgress: { type: 'getRequestedProgress', id: 'fixture-route' },
  progressAtCoordinate: {
    type: 'getProgressAtCoordinate',
    id: 'fixture-route',
    coordinate: PANGYO,
  },
  startForwardFill: {
    type: 'startProgressAnimation',
    animation: {
      animationId: 'fixture-route-forward-fill',
      routeIds: ['fixture-route'],
      direction: 'forward',
      mode: 'fill',
      duration: 900,
      interpolation: 'cubicInOut',
      repeat: 1,
      hideAtStop: false,
      resetToInitial: false,
    },
  },
  startBackwardClearAndReset: {
    type: 'startProgressAnimation',
    animation: {
      animationId: 'fixture-route-backward-clear',
      routeIds: ['fixture-route'],
      direction: 'backward',
      mode: 'clear',
      duration: 900,
      interpolation: 'cubicOut',
      repeat: 1,
      hideAtStop: true,
      resetToInitial: true,
    },
  },
  stopForwardFill: { type: 'stopAnimation', animationId: 'fixture-route-forward-fill' },
  remove: { type: 'remove', ids: ['fixture-route'] },
  state: { type: 'getState', id: 'fixture-route' },
  counts: { type: 'getCounts' },
  capabilities: { type: 'getCapabilities' },
} satisfies Record<string, RouteCommand>;

export const routeFixtureReplacementScene = {
  ...routeFixtureScene,
  routes: routeFixtureScene.routes.map((route) => ({
    ...route,
    segments: routeFixtureCommands.changeSegments.segments,
  })),
} satisfies RouteScene;

export const routeCapabilityCommands = {
  androidNativeProgress: { type: 'getProgress', id: 'fixture-route' },
  androidCoordinateAtProgress: {
    type: 'getCoordinateAtProgress',
    id: 'fixture-route',
    progress: 0.5,
  },
} satisfies Record<string, RouteCommand>;
