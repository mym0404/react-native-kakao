import type {
  PolygonStyleSet,
  PolylineStyleSet,
  ShapeCommand,
  ShapeGeometry,
  ShapeScene,
  ShapeStyleSet,
  ShapeWaveAnimation,
} from '../../../packages/map/src/types-shapes';

export const modelPolygonFixtureId = 'fixture-model-polygon';
const modelArcFixtureId = 'fixture-model-arc';

const PANGYO = { latitude: 37.3947, longitude: 127.1112 } as const;
const PANGYO_EAST = { latitude: 37.3947, longitude: 127.1132 } as const;

export const shapeFixtureStyles = {
  polygon: {
    type: 'polygon',
    id: 'fixture-shape-polygon-style',
    styles: [
      {
        levels: [
          { level: 0, fillColor: '#38BDF855', strokeColor: '#0284C7FF', strokeWidth: 2 },
          { level: 16, fillColor: '#0EA5E988', strokeColor: '#075985FF', strokeWidth: 3 },
        ],
      },
      { levels: [{ level: 0, fillColor: '#F59E0B66', strokeColor: '#B45309FF', strokeWidth: 2 }] },
    ],
  } satisfies PolygonStyleSet,
  polyline: {
    type: 'polyline',
    id: 'fixture-shape-polyline-style',
    cap: 'round',
    styles: [
      {
        levels: [
          { level: 0, color: '#A855F7FF', width: 4, strokeColor: '#581C87FF', strokeWidth: 1 },
          { level: 16, color: '#C084FCFF', width: 6, strokeColor: '#3B0764FF', strokeWidth: 2 },
        ],
      },
    ],
  } satisfies PolylineStyleSet,
};

export const shapeFixtureWave = {
  animationId: 'fixture-shape-wave',
  shapeIds: ['fixture-geographic-polygon'],
  duration: 700,
  frames: [
    { level: 0, startAlpha: 0.8, endAlpha: 0, startRadius: 0, endRadius: 28 },
    { level: 16, startAlpha: 0.6, endAlpha: 0, startRadius: 4, endRadius: 40 },
  ],
  interpolation: 'cubicOut',
  repeat: 2,
  hideAtStop: false,
} satisfies ShapeWaveAnimation;

export const shapePolylineWave = {
  ...shapeFixtureWave,
  animationId: 'fixture-shape-polyline-wave',
  shapeIds: [modelArcFixtureId],
} satisfies ShapeWaveAnimation;

export const shapeFixtureScenes = {
  complete: {
    styleSets: [shapeFixtureStyles.polygon, shapeFixtureStyles.polyline],
    layers: [
      { id: 'fixture-shape-default-layer', zIndex: 10_002, pass: 'default', visible: true },
      { id: 'fixture-shape-overlay-layer', zIndex: 3, pass: 'overlay', visible: true },
      { id: 'fixture-shape-route-layer', zIndex: 4, pass: 'route', visible: true },
    ],
    shapes: [
      {
        id: 'fixture-geographic-polygon',
        layerId: 'fixture-shape-default-layer',
        styleSetId: shapeFixtureStyles.polygon.id,
        zIndex: 1,
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
              mergeOverlappedHoles: true,
            },
          ],
        },
      },
      {
        id: modelPolygonFixtureId,
        layerId: 'fixture-shape-overlay-layer',
        styleSetId: shapeFixtureStyles.polygon.id,
        geometry: {
          type: 'modelPolygon',
          base: PANGYO_EAST,
          orientation: 0,
          parts: [
            {
              outer: [
                { x: -36, y: -24 },
                { x: 36, y: -24 },
                { x: 0, y: 44 },
              ],
              styleIndex: 1,
            },
          ],
        },
      },
      {
        id: 'fixture-model-circle',
        layerId: 'fixture-shape-overlay-layer',
        styleSetId: shapeFixtureStyles.polygon.id,
        geometry: { type: 'modelCircle', base: PANGYO, radius: 28, pointCount: 48 },
      },
      {
        id: 'fixture-geographic-rectangle',
        layerId: 'fixture-shape-default-layer',
        styleSetId: shapeFixtureStyles.polygon.id,
        geometry: { type: 'geographicRectangle', center: PANGYO, width: 140, height: 90 },
      },
      {
        id: modelArcFixtureId,
        layerId: 'fixture-shape-route-layer',
        styleSetId: shapeFixtureStyles.polyline.id,
        geometry: {
          type: 'modelArc',
          base: PANGYO,
          radius: 54,
          startAngle: 30,
          endAngle: 300,
          pointCount: 40,
        },
      },
      {
        id: 'fixture-geographic-curve',
        layerId: 'fixture-shape-route-layer',
        styleSetId: shapeFixtureStyles.polyline.id,
        geometry: { type: 'geographicCurve', start: PANGYO, end: PANGYO_EAST, side: 'left' },
      },
    ],
  },
  empty: {},
} satisfies Record<string, ShapeScene>;

export const sharingShapeFixtureScene = {
  ...shapeFixtureScenes.complete,
  shapes: shapeFixtureScenes.complete.shapes.filter(({ id }) => id === modelPolygonFixtureId),
} satisfies ShapeScene;

export const shapeFixtureApplyActions = {
  applyComplete: { type: 'applyShapes', scene: shapeFixtureScenes.complete },
  removeAll: { type: 'applyShapes', scene: shapeFixtureScenes.empty },
} as const;

const calibrationStyle: PolygonStyleSet = {
  type: 'polygon',
  id: 'fixture-shape-calibration-style',
  styles: [{ levels: [{ level: 0, fillColor: '#FF00FFFF' }] }],
};

const lineCalibrationStyle: PolylineStyleSet = {
  type: 'polyline',
  id: 'fixture-shape-line-calibration-style',
  cap: 'butt',
  styles: [{ levels: [{ level: 0, color: '#00FFFFFF', width: 8, strokeWidth: 0 }] }],
};

const diagnosticScene = (
  id: string,
  geometry: ShapeGeometry,
  styleSet: ShapeStyleSet,
): ShapeScene => ({
  styleSets: [styleSet],
  layers: [{ id: `${id}-layer`, pass: 'route', zIndex: 10_002 }],
  shapes: [{ id, layerId: `${id}-layer`, styleSetId: styleSet.id, geometry }],
});

const modelTrianglePoints = [
  { x: -36, y: -24 },
  { x: 36, y: -24 },
  { x: 0, y: 44 },
];

const arcPoint = (radius: number, angle: number) => {
  const radians = (angle * Math.PI) / 180;

  return { x: radius * Math.sin(radians), y: radius * Math.cos(radians) };
};

const modelCirclePolylinePoints = Array.from({ length: 65 }, (_, index) => {
  return arcPoint(20, (index * 360) / 64);
});

const circleComparisonFixtures = [16, 17, 18].flatMap((zoomLevel) =>
  (['model', 'geographic'] as const).map((kind) => ({
    id: `${kind}Circle36MetersZoom${zoomLevel}`,
    zoomLevel,
    scene: diagnosticScene(
      `fixture-${kind}-circle-36m-z${zoomLevel}`,
      kind === 'model'
        ? { type: 'modelCircle', base: PANGYO, radius: 36, pointCount: 120 }
        : { type: 'geographicCircle', center: PANGYO, radius: 36, pointCount: 120 },
      calibrationStyle,
    ),
  })),
);

const circleComparisonScenes = Object.fromEntries(
  circleComparisonFixtures.map(({ id, scene }) => [id, scene]),
);
export const isolatedShapeFixtureZoomLevels: Record<string, number> = Object.fromEntries(
  circleComparisonFixtures.map(({ id, zoomLevel }) => [id, zoomLevel]),
);

export const isolatedShapeFixtureScenes: Record<string, ShapeScene> = {
  ...Object.fromEntries(
    shapeFixtureScenes.complete.shapes.map((shape) => [
      shape.geometry.type,
      {
        styleSets: shapeFixtureScenes.complete.styleSets,
        layers: shapeFixtureScenes.complete.layers,
        shapes: [shape],
      },
    ]),
  ),
  ...circleComparisonScenes,
  modelTriangleOriginal: diagnosticScene(
    'fixture-model-triangle-original',
    { type: 'modelPolygon', base: PANGYO, parts: [{ outer: modelTrianglePoints }] },
    shapeFixtureStyles.polygon,
  ),
  modelTriangleReversed: diagnosticScene(
    'fixture-model-triangle-reversed',
    { type: 'modelPolygon', base: PANGYO, parts: [{ outer: [...modelTrianglePoints].reverse() }] },
    shapeFixtureStyles.polygon,
  ),
  modelPolylineTwoPoints: diagnosticScene(
    'fixture-model-polyline-two-points',
    {
      type: 'modelPolyline',
      base: PANGYO,
      orientation: 0,
      parts: [
        {
          points: [
            { x: -50, y: 0 },
            { x: 50, y: 0 },
          ],
        },
      ],
    },
    lineCalibrationStyle,
  ),
  modelCirclePolyline: diagnosticScene(
    'fixture-model-circle-polyline',
    { type: 'modelPolyline', base: PANGYO, parts: [{ points: modelCirclePolylinePoints }] },
    shapeFixtureStyles.polyline,
  ),
  modelArcTwoPoints: diagnosticScene(
    'fixture-model-arc-two-points',
    {
      type: 'modelPolyline',
      base: PANGYO,
      parts: [{ points: [arcPoint(54, 30), arcPoint(54, 300)] }],
    },
    shapeFixtureStyles.polyline,
  ),
  modelArcFull: diagnosticScene(
    'fixture-model-arc-full',
    {
      type: 'modelArc',
      base: PANGYO,
      radius: 54,
      startAngle: 30,
      endAngle: 300,
      pointCount: 40,
    },
    shapeFixtureStyles.polyline,
  ),
};

export const shapeFixtureCommands = {
  removePolygon: { type: 'remove', ids: ['fixture-geographic-polygon'] },
  hidePolygon: { type: 'setVisible', ids: ['fixture-geographic-polygon'], visible: false },
  showPolygon: { type: 'setVisible', ids: ['fixture-geographic-polygon'], visible: true },
  moveModel: { type: 'setPosition', id: modelPolygonFixtureId, position: PANGYO },
  changePolygonData: {
    type: 'changeData',
    id: 'fixture-geographic-polygon',
    styleSetId: shapeFixtureStyles.polygon.id,
    geometry: { type: 'geographicCircle', center: PANGYO, radius: 80, pointCount: 48 },
  },
  startWave: { type: 'startWave', animation: shapeFixtureWave },
  stopWave: { type: 'stopAnimation', animationId: shapeFixtureWave.animationId },
  polygonState: { type: 'getState', id: 'fixture-geographic-polygon' },
  counts: { type: 'getCounts' },
  capabilities: { type: 'getCapabilities' },
} satisfies Record<string, ShapeCommand>;

export const shapeCapabilityCommands = {
  iosGeographicOrientation: {
    type: 'setOrientation',
    id: 'fixture-geographic-polygon',
    orientation: 45,
  },
  startPolylineWave: { type: 'startWave', animation: shapePolylineWave },
  stopPolylineWave: { type: 'stopAnimation', animationId: shapePolylineWave.animationId },
  androidZIndexMutation: { type: 'setZIndex', id: modelPolygonFixtureId, zIndex: 8 },
  iosModelOrientation: { type: 'setOrientation', id: modelPolygonFixtureId, orientation: 45 },
  androidGeographicPosition: {
    type: 'setPosition',
    id: 'fixture-geographic-polygon',
    position: PANGYO_EAST,
  },
} satisfies Record<string, ShapeCommand>;

for (const id of ['modelPolylineTwoPoints', 'modelArcFull']) {
  const scene = isolatedShapeFixtureScenes[id];
  if (scene) {
    isolatedShapeFixtureScenes[`${id}Overlay`] = {
      ...scene,
      layers: scene.layers?.map((layer) => ({ ...layer, pass: 'overlay' })),
    };
  }
}

for (const id of ['modelTriangleOriginal', 'modelTriangleReversed']) {
  const scene = isolatedShapeFixtureScenes[id];
  if (scene) {
    isolatedShapeFixtureScenes[`${id}SimpleStyle`] = {
      ...scene,
      styleSets: [calibrationStyle],
      shapes: scene.shapes?.map((shape) => ({ ...shape, styleSetId: calibrationStyle.id })),
    };
  }
}

for (const id of ['modelCirclePolyline', 'modelArcTwoPoints', 'modelArcFull']) {
  const scene = isolatedShapeFixtureScenes[id];
  if (scene) {
    isolatedShapeFixtureScenes[`${id}SimpleStyle`] = {
      ...scene,
      styleSets: [lineCalibrationStyle],
      shapes: scene.shapes?.map((shape) => ({ ...shape, styleSetId: lineCalibrationStyle.id })),
    };
  }
}
