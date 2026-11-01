import type { DimScreenOptions } from '../../../packages/map/src/types-dim';
import type { PolygonStyleSet, ShapeWaveAnimation } from '../../../packages/map/src/types-shapes';

const PANGYO = { latitude: 37.3947, longitude: 127.1112 } as const;

export const dimFixtureStyle = {
  type: 'polygon',
  id: 'fixture-dim-style',
  styles: [
    {
      levels: [
        { level: 0, fillColor: '#00000000', strokeColor: '#F59E0BFF', strokeWidth: 2 },
        { level: 16, fillColor: '#FDE68A55', strokeColor: '#D97706FF', strokeWidth: 3 },
      ],
    },
  ],
} satisfies PolygonStyleSet;

export const dimFixtureAnimation = {
  animationId: 'fixture-dim-wave',
  shapeIds: ['fixture-geographic-highlight'],
  duration: 800,
  frames: [
    { level: 0, startAlpha: 0.8, endAlpha: 0, startRadius: 0, endRadius: 32 },
    { level: 16, startAlpha: 0.6, endAlpha: 0, startRadius: 4, endRadius: 48 },
  ],
  interpolation: 'cubicOut',
  repeat: 2,
  hideAtStop: false,
} satisfies ShapeWaveAnimation;

export const dimFixtureScenes = {
  geographicWithHole: {
    enabled: true,
    color: '#11182799',
    cover: 'mapAndLabel',
    styleSets: [dimFixtureStyle],
    highlights: [
      {
        id: 'fixture-geographic-highlight',
        styleSetId: dimFixtureStyle.id,
        zIndex: 4,
        geometry: {
          type: 'geographicPolygon',
          parts: [
            {
              outer: [
                { latitude: 37.3937, longitude: 127.1098 },
                { latitude: 37.3937, longitude: 127.1126 },
                { latitude: 37.3957, longitude: 127.1126 },
                { latitude: 37.3957, longitude: 127.1098 },
              ],
              holes: [
                [
                  { latitude: 37.3942, longitude: 127.1105 },
                  { latitude: 37.3942, longitude: 127.1119 },
                  { latitude: 37.3952, longitude: 127.1119 },
                  { latitude: 37.3952, longitude: 127.1105 },
                ],
              ],
            },
          ],
        },
      },
    ],
    animations: [dimFixtureAnimation],
  },
  modelPolygon: {
    enabled: true,
    color: '#0F172A88',
    cover: 'all',
    styleSets: [dimFixtureStyle],
    highlights: [
      {
        id: 'fixture-model-highlight',
        styleSetId: dimFixtureStyle.id,
        geometry: {
          type: 'modelPolygon',
          base: PANGYO,
          orientation: 0,
          parts: [
            {
              outer: [
                { x: -40, y: -30 },
                { x: 40, y: -30 },
                { x: 0, y: 50 },
              ],
            },
          ],
        },
      },
    ],
  },
  androidRouteCover: {
    enabled: true,
    color: '#00000066',
    cover: 'mapAndRoute',
    zIndex: 5,
  },
  iosModelOrientation: {
    enabled: true,
    color: '#0F172A88',
    cover: 'map',
    styleSets: [dimFixtureStyle],
    highlights: [
      {
        id: 'fixture-ios-oriented-model',
        styleSetId: dimFixtureStyle.id,
        geometry: {
          type: 'modelPolygon',
          base: PANGYO,
          orientation: 45,
          parts: [
            {
              outer: [
                { x: -32, y: -24 },
                { x: 32, y: -24 },
                { x: 0, y: 40 },
              ],
            },
          ],
        },
      },
    ],
  },
  disabled: { enabled: false, color: '#00000000', cover: 'map' },
} satisfies Record<string, DimScreenOptions>;

export const dimFixtureActions = {
  applyGeographicWithHole: { type: 'applyDimScreen', options: dimFixtureScenes.geographicWithHole },
  applyModelPolygon: { type: 'applyDimScreen', options: dimFixtureScenes.modelPolygon },
  applyAndroidRouteCover: { type: 'applyDimScreen', options: dimFixtureScenes.androidRouteCover },
  applyIosModelOrientation: {
    type: 'applyDimScreen',
    options: dimFixtureScenes.iosModelOrientation,
  },
  setHighlightVisible: {
    type: 'setDimHighlightVisible',
    id: 'fixture-geographic-highlight',
    visible: false,
  },
  startAnimation: { type: 'startDimAnimation', id: dimFixtureAnimation.animationId },
  stopAnimation: { type: 'stopDimAnimation', id: dimFixtureAnimation.animationId },
  status: { type: 'getDimScreenStatus' },
  removeAll: { type: 'applyDimScreen', options: dimFixtureScenes.disabled },
} as const;
