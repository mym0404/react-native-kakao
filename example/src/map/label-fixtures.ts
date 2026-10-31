import { Image, Platform } from 'react-native';
import type {
  LabelAnimation,
  LabelCommand,
  LabelLayer,
  LabelScene,
  LabelStyle,
  LodLabelLayer,
  LodMapLabel,
  MapImageSource,
  MapLabel,
  PathMapLabel,
  PathTextStyle,
} from '@react-native-kakao/map';

import { modelPolygonFixtureId } from './shape-fixtures';

export const sharingLabelIds = {
  source: 'fixture-share-source',
  target: 'fixture-share-target',
} as const;

const PANGYO = { latitude: 37.3947, longitude: 127.1112 } as const;
const PANGYO_EAST = { latitude: 37.3947, longitude: 127.1132 } as const;
const PANGYO_NORTH = { latitude: 37.3962, longitude: 127.1112 } as const;
const PANGYO_SOUTH = { latitude: 37.3932, longitude: 127.1112 } as const;
const PANGYO_WEST = { latitude: 37.3947, longitude: 127.1092 } as const;
const tracerImageSize = 72;
const foregroundLabelZOrder = 5000;
const solidMagentaPngUri =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z/D/PwAG/gL+DHWJ3gAAAABJRU5ErkJggg==';

const solidRedPngUri =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQI12N47+LyHwAGFAJ3+3BRVAAAAABJRU5ErkJggg==';

const solidBluePngUri =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQI12Owbvr2HwAFYgKzZOe4JQAAAABJRU5ErkJggg==';

const bundledIcon =
  Platform.OS === 'web' ? { uri: '' } : Image.resolveAssetSource(require('../../assets/icon.png'));

export const labelFixtureImage: MapImageSource = {
  uri: bundledIcon.uri,
  width: 36,
  height: 36,
};

export const labelFixtureStyles = {
  simpleText: {
    id: 'fixture-simple-text',
    levels: [
      {
        level: 0,
        textLayout: 'center',
        textLines: [
          {
            fontSize: 24,
            color: '#FF00FFFF',
            strokeColor: '#FFFFFFFF',
            strokeWidth: 2,
          },
        ],
      },
    ],
  },
  iconOnly: {
    id: 'fixture-icon-only',
    levels: [{ level: 0, image: labelFixtureImage, anchor: { x: 0.5, y: 1 } }],
  },
  iconTracer: {
    id: 'fixture-icon-tracer',
    levels: [
      {
        level: 0,
        image: { ...labelFixtureImage, width: tracerImageSize, height: tracerImageSize },
        anchor: { x: 0.5, y: 1 },
      },
    ],
  },
  pixelBox: {
    id: 'fixture-pixel-box',
    levels: [
      {
        level: 0,
        image: {
          uri: solidMagentaPngUri,
          width: tracerImageSize,
          height: tracerImageSize,
        },
        anchor: { x: 0.5, y: 0.5 },
      },
    ],
  },
  textOnly: {
    id: 'fixture-text-only',
    levels: [
      {
        level: 0,
        textLayout: 'top',
        textTransition: {
          entrance: 'alpha',
          exit: 'alpha',
          enableEntrance: false,
          enableExit: false,
        },
        textLines: [
          {
            fontFamily: 'sans-serif',
            fontSize: 14,
            color: '#1A1A1AFF',
            strokeColor: '#FFFFFFFF',
            strokeWidth: 2,
            characterSpacing: 0,
            lineSpacing: 2,
            aspectRatio: 1,
          },
        ],
      },
    ],
  },
  iconTextBadgePerLevel: {
    id: 'fixture-icon-text-badge-levels',
    levels: [
      {
        level: 0,
        image: labelFixtureImage,
        anchor: { x: 0.5, y: 1 },
        padding: 6,
        iconTransition: {
          entrance: 'scale',
          exit: 'alpha',
          enableEntrance: true,
          enableExit: true,
        },
        textTransition: {
          entrance: 'alpha',
          exit: 'scale',
          enableEntrance: true,
          enableExit: true,
        },
        textLayout: 'bottom',
        textLines: [
          { fontSize: 15, color: '#111827FF', strokeColor: '#FFFFFFFF', strokeWidth: 2 },
          { fontSize: 12, color: '#2563EBFF', strokeColor: '#FFFFFFFF', strokeWidth: 1 },
        ],
        badges: [
          {
            id: 'fixture-style-badge',
            image: { ...labelFixtureImage, width: 14, height: 14 },
            offset: { x: 12, y: -12 },
            zOrder: 3,
          },
        ],
      },
      {
        level: 16,
        image: { ...labelFixtureImage, width: 48, height: 48 },
        anchor: { x: 0.5, y: 1 },
        padding: 8,
        textLayout: 'right',
        textLines: [
          { fontSize: 18, color: '#111827FF', strokeColor: '#FFFFFFFF', strokeWidth: 2 },
          { fontSize: 13, color: '#DC2626FF', strokeColor: '#FFFFFFFF', strokeWidth: 1 },
        ],
      },
    ],
  },
  collisionRed: {
    id: 'fixture-collision-red',
    levels: [
      {
        level: 0,
        image: { uri: solidRedPngUri, width: 48, height: 48 },
        anchor: { x: 0.5, y: 0.5 },
        textLayout: 'bottom',
        textLines: [{ fontSize: 14, color: '#B91C1CFF', strokeColor: '#FFFFFFFF', strokeWidth: 1 }],
      },
    ],
  },
  collisionBlue: {
    id: 'fixture-collision-blue',
    levels: [
      {
        level: 0,
        image: { uri: solidBluePngUri, width: 48, height: 48 },
        anchor: { x: 0.5, y: 0.5 },
        textLayout: 'top',
        textLines: [{ fontSize: 14, color: '#1D4ED8FF', strokeColor: '#FFFFFFFF', strokeWidth: 1 }],
      },
    ],
  },
} satisfies Record<string, LabelStyle>;

export const pathTextFixtureStyle = {
  id: 'fixture-path-text',
  levels: [
    {
      level: 0,
      text: { fontSize: 14, color: '#0F766EFF', strokeColor: '#FFFFFFFF', strokeWidth: 2 },
    },
    {
      level: 16,
      text: { fontSize: 18, color: '#115E59FF', strokeColor: '#FFFFFFFF', strokeWidth: 2 },
    },
  ],
} satisfies PathTextStyle;

export const labelTextLayoutFixtures = (['center', 'top', 'bottom', 'left', 'right'] as const).map(
  (textLayout): LabelStyle => ({
    id: `fixture-text-layout-${textLayout}`,
    levels: [
      {
        level: 0,
        image: { uri: solidMagentaPngUri, width: 10, height: 10 },
        anchor: { x: 0.5, y: 0.5 },
        padding: 4,
        textLayout,
        textLines: [{ fontSize: 14, color: '#111827FF' }],
      },
    ],
  }),
);

export const labelLayerFixture = {
  id: 'fixture-label-layer',
  visible: true,
  clickable: true,
  zOrder: 1200,
  competition: 'none',
  competitionUnit: 'iconAndText',
  ordering: 'leftBottom',
} satisfies LabelLayer;

const textLayoutLabelLayerFixture = {
  ...labelLayerFixture,
  id: 'fixture-text-layout-layer',
  zOrder: foregroundLabelZOrder,
} satisfies LabelLayer;

export const simpleTextLabelLayerFixture = {
  id: 'fixture-simple-text-layer',
  visible: true,
  clickable: true,
  zOrder: 1500,
  competition: 'none',
  competitionUnit: 'iconAndText',
  ordering: 'rank',
} satisfies LabelLayer;

export const iconOnlyLabelLayerFixture = {
  ...simpleTextLabelLayerFixture,
  id: 'fixture-icon-only-layer',
} satisfies LabelLayer;

export const pixelBoxLabelLayerFixture = {
  ...iconOnlyLabelLayerFixture,
  id: 'fixture-pixel-box-layer',
  zOrder: foregroundLabelZOrder,
} satisfies LabelLayer;

export const lodLabelLayerFixture = {
  id: 'fixture-lod-layer',
  visible: true,
  clickable: true,
  zOrder: 1100,
  competition: 'none',
  competitionUnit: 'iconAndText',
  ordering: 'rank',
  radius: 28,
} satisfies LodLabelLayer;

export const labelCompetitionFixtures = (
  ['none', 'all', 'upper', 'upperLower', 'upperSame', 'same', 'sameLower', 'lower'] as const
).map(
  (competition): LabelLayer => ({
    id: `fixture-competition-${competition}`,
    competition,
    competitionUnit: 'iconAndText',
    ordering: 'rank',
  }),
);

export const regularLabelFixture = {
  id: 'fixture-regular-label',
  layerId: labelLayerFixture.id,
  styleId: labelFixtureStyles.iconTextBadgePerLevel.id,
  coordinate: PANGYO,
  text: [
    { value: '판교역', styleIndex: 0 },
    { value: 'Regular POI', styleIndex: 1 },
  ],
  rank: 20,
  clickable: true,
  visible: true,
  transform: 'absoluteRotationKeepUpright',
  pixelOffset: { x: 4, y: -8 },
  orientation: 15,
  scale: { x: 1, y: 1 },
  badges: [
    {
      id: 'fixture-runtime-badge',
      image: { ...labelFixtureImage, width: 16, height: 16 },
      offset: { x: -14, y: -14 },
      zOrder: 4,
      visible: true,
    },
  ],
} satisfies MapLabel;

export const lodLabelFixture = {
  id: 'fixture-lod-label',
  layerId: lodLabelLayerFixture.id,
  styleId: labelFixtureStyles.iconOnly.id,
  coordinate: PANGYO_EAST,
  rank: 10,
  clickable: true,
  visible: true,
  transform: 'default',
  badges: [
    {
      id: 'fixture-lod-badge',
      image: { ...labelFixtureImage, width: 12, height: 12 },
      visible: false,
    },
  ],
} satisfies LodMapLabel;

export const pathLabelFixture = {
  id: 'fixture-path-label',
  layerId: labelLayerFixture.id,
  styleId: pathTextFixtureStyle.id,
  points: [PANGYO_WEST, PANGYO, PANGYO_EAST],
  text: '판교 테크노밸리',
  rank: 0,
  visible: true,
} satisfies PathMapLabel;

const animationLabel = (id: string, coordinate: MapLabel['coordinate']): MapLabel => ({
  id,
  layerId: labelLayerFixture.id,
  styleId: labelFixtureStyles.iconOnly.id,
  coordinate,
  visible: true,
});

export const labelAnimationFixtures = [
  {
    id: 'fixture-drop-animation',
    labelIds: ['fixture-drop-label'],
    effect: 'drop',
    keyframes: [{ duration: 500, interpolation: 'cubicOut', translation: { x: 0, y: 40 } }],
    repeatCount: 2,
  },
  {
    id: 'fixture-alpha-animation',
    labelIds: ['fixture-alpha-label'],
    effect: 'alpha',
    keyframes: [
      { duration: 250, alpha: 0.25 },
      { duration: 250, alpha: 1 },
    ],
    resetToInitialState: true,
  },
  {
    id: 'fixture-scale-animation',
    labelIds: ['fixture-scale-label'],
    effect: 'scale',
    keyframes: [
      { duration: 250, interpolation: 'cubicIn', scale: { x: 0.5, y: 0.5 } },
      { duration: 250, scale: { x: 1.25, y: 1.25 } },
    ],
    hideAtStop: true,
  },
  {
    id: 'fixture-scale-alpha-animation',
    labelIds: ['fixture-scale-alpha-label'],
    effect: 'scaleAlpha',
    keyframes: [
      { duration: 250, scale: { x: 0.6, y: 0.6 }, alpha: 0.3 },
      { duration: 250, scale: { x: 1, y: 1 }, alpha: 1 },
    ],
    hideAtStop: false,
  },
  {
    id: 'fixture-transform-animation',
    labelIds: ['fixture-transform-label'],
    effect: 'transform',
    keyframes: [
      {
        duration: 500,
        interpolation: 'cubicInOut',
        translation: { x: 24, y: -12 },
        rotation: 90,
        scale: { x: 1.2, y: 0.8 },
        alpha: 0.8,
      },
    ],
    removeAtStop: true,
  },
] satisfies LabelAnimation[];

export const labelTransformFixtures = (
  [
    'absoluteRotation',
    'default',
    'absoluteRotationKeepUpright',
    'absoluteRotationDecal',
    'decal',
  ] as const
).map(
  (transform, index): MapLabel => ({
    ...regularLabelFixture,
    id: `fixture-transform-${transform}`,
    coordinate: { latitude: PANGYO.latitude + index * 0.0002, longitude: PANGYO.longitude },
    orientation: 45,
    transform,
  }),
);

export const labelTextLayoutFixtureScene = {
  styles: labelTextLayoutFixtures,
  layers: [textLayoutLabelLayerFixture],
  labels: labelTextLayoutFixtures.map((style, index): MapLabel => {
    const coordinates = [PANGYO_WEST, PANGYO, PANGYO_EAST, PANGYO_NORTH, PANGYO_SOUTH];
    const textLayout = style.id.replace('fixture-text-layout-', '');

    return {
      id: `${style.id}-label`,
      layerId: textLayoutLabelLayerFixture.id,
      styleId: style.id,
      coordinate: coordinates[index] ?? PANGYO,
      text: [{ value: textLayout.toUpperCase(), styleIndex: 0 }],
      rank: index,
      clickable: true,
    };
  }),
} satisfies LabelScene;

export const labelTransformFixtureScene = {
  styles: [labelFixtureStyles.iconTextBadgePerLevel],
  layers: [labelLayerFixture],
  labels: labelTransformFixtures,
} satisfies LabelScene;

export const labelCompetitionFixtureScenes = Object.fromEntries(
  labelCompetitionFixtures.map((layer): [string, LabelScene] => {
    const redLayer = { ...layer, id: `${layer.id}-red`, zOrder: 2200 } satisfies LabelLayer;
    const blueLayer = { ...layer, id: `${layer.id}-blue`, zOrder: 2201 } satisfies LabelLayer;

    return [
      `competition-${layer.competition}`,
      {
        styles: [labelFixtureStyles.collisionRed, labelFixtureStyles.collisionBlue],
        layers: [redLayer, blueLayer],
        labels: [
          {
            id: `${layer.id}-red-label`,
            layerId: redLayer.id,
            styleId: labelFixtureStyles.collisionRed.id,
            coordinate: PANGYO,
            text: [{ value: 'RED', styleIndex: 0 }],
            rank: 10,
            pixelOffset: { x: -8, y: 0 },
            clickable: true,
          },
          {
            id: `${layer.id}-blue-label`,
            layerId: blueLayer.id,
            styleId: labelFixtureStyles.collisionBlue.id,
            coordinate: PANGYO,
            text: [{ value: 'BLUE', styleIndex: 0 }],
            rank: 20,
            pixelOffset: { x: 8, y: 0 },
            clickable: true,
          },
        ],
      },
    ];
  }),
);

export const sharingTargetDestination = PANGYO_EAST;

const sharingSourceStyle: LabelStyle = {
  ...labelFixtureStyles.collisionRed,
  id: 'fixture-sharing-source-style',
  levels: labelFixtureStyles.collisionRed.levels.map((level) => ({
    ...level,
    image: { ...level.image, height: 24 },
  })),
};

const sharingTargetStyle: LabelStyle = {
  ...labelFixtureStyles.collisionBlue,
  id: 'fixture-sharing-target-style',
  levels: labelFixtureStyles.collisionBlue.levels.map((level) => ({
    ...level,
    image: { ...level.image, height: 16 },
  })),
};

export const labelFixtureScenes = {
  simpleText: {
    styles: [labelFixtureStyles.simpleText],
    layers: [simpleTextLabelLayerFixture],
    labels: [
      {
        id: 'fixture-simple-text-label',
        layerId: simpleTextLabelLayerFixture.id,
        styleId: labelFixtureStyles.simpleText.id,
        coordinate: PANGYO,
        text: [{ value: 'RNK TEXT', styleIndex: 0 }],
        rank: 100,
        clickable: true,
      },
    ],
  },
  iconOnly: {
    styles: [labelFixtureStyles.iconTracer],
    layers: [iconOnlyLabelLayerFixture],
    labels: [
      {
        id: 'fixture-icon-only-label',
        layerId: iconOnlyLabelLayerFixture.id,
        styleId: labelFixtureStyles.iconTracer.id,
        coordinate: PANGYO,
        clickable: true,
      },
    ],
  },
  pixelBox: {
    styles: [labelFixtureStyles.pixelBox],
    layers: [pixelBoxLabelLayerFixture],
    labels: [
      {
        id: 'fixture-pixel-box-label',
        layerId: pixelBoxLabelLayerFixture.id,
        styleId: labelFixtureStyles.pixelBox.id,
        coordinate: PANGYO,
        clickable: true,
      },
    ],
  },
  regular: {
    styles: [labelFixtureStyles.iconTextBadgePerLevel],
    layers: [labelLayerFixture],
    labels: [regularLabelFixture],
  },
  lod: {
    styles: [labelFixtureStyles.iconOnly],
    lodLayers: [lodLabelLayerFixture],
    lodLabels: [lodLabelFixture],
  },
  pathText: {
    pathTextStyles: [pathTextFixtureStyle],
    layers: [labelLayerFixture],
    pathLabels: [pathLabelFixture],
  },
  textLayouts: labelTextLayoutFixtureScene,
  transforms: labelTransformFixtureScene,
  ...labelCompetitionFixtureScenes,
  animations: {
    styles: [labelFixtureStyles.iconOnly],
    layers: [labelLayerFixture],
    labels: [
      animationLabel('fixture-drop-label', PANGYO_WEST),
      animationLabel('fixture-alpha-label', PANGYO),
      animationLabel('fixture-scale-label', PANGYO_EAST),
      animationLabel('fixture-scale-alpha-label', PANGYO_NORTH),
      animationLabel('fixture-transform-label', { latitude: 37.3932, longitude: 127.1112 }),
    ],
    animations: labelAnimationFixtures,
  },
  sharingAndTracking: {
    styles: [sharingSourceStyle, sharingTargetStyle, labelFixtureStyles.iconOnly],
    layers: [labelLayerFixture],
    labels: [
      {
        id: sharingLabelIds.source,
        layerId: labelLayerFixture.id,
        styleId: sharingSourceStyle.id,
        coordinate: PANGYO_WEST,
        text: [{ value: 'SOURCE', styleIndex: 0 }],
        orientation: 0,
        transform: 'default',
        clickable: true,
      },
      {
        id: sharingLabelIds.target,
        layerId: labelLayerFixture.id,
        styleId: sharingTargetStyle.id,
        coordinate: PANGYO_EAST,
        text: [{ value: 'TARGET', styleIndex: 0 }],
        orientation: 0,
        transform: 'default',
        clickable: true,
      },
      animationLabel('fixture-tracking-label', PANGYO_NORTH),
    ],
  },
} satisfies Record<string, LabelScene>;

export const simpleTextLabelTracerFixture = {
  addScene: labelFixtureScenes.simpleText,
  expectedStateCore: {
    labels: [{ id: 'fixture-simple-text-label', kind: 'label', visible: true }],
    animationIds: [],
  },
  expectedClick: {
    id: 'fixture-simple-text-label',
    layerId: simpleTextLabelLayerFixture.id,
    kind: 'label',
    coordinate: PANGYO,
  },
  removeScene: {} satisfies LabelScene,
  expectedRemovedStateCore: {
    labels: [],
    animationIds: [],
  },
  expectedTracking: {
    android: { active: false, source: 'managed' },
    ios: { active: false, source: 'native' },
  },
} as const;

export const labelFixtureActions = {
  visibilityAndAutoMove: [
    { type: 'show', id: regularLabelFixture.id, visible: false },
    { type: 'show', id: regularLabelFixture.id, visible: true, autoMove: true, duration: 400 },
  ],
  motion: [
    { type: 'move', id: regularLabelFixture.id, coordinate: PANGYO_EAST, duration: 400 },
    {
      type: 'movePath',
      id: regularLabelFixture.id,
      points: [PANGYO_WEST, PANGYO_NORTH, PANGYO_EAST],
      duration: 900,
      cornerRadius: 12,
      jumpThreshold: 8,
      rotate: true,
      baseRotation: 0,
    },
    { type: 'rotate', id: regularLabelFixture.id, rotation: 180, duration: 400 },
    { type: 'scale', id: regularLabelFixture.id, scale: { x: 1.4, y: 0.8 }, duration: 400 },
  ],
  badges: [
    {
      type: 'setBadgeVisibility',
      id: regularLabelFixture.id,
      badgeId: 'fixture-runtime-badge',
      visible: false,
    },
    {
      type: 'setBadgeVisibility',
      id: regularLabelFixture.id,
      badgeId: 'fixture-style-badge',
      visible: false,
      style: true,
    },
  ],
  sharing: [
    {
      type: 'sharePosition',
      sourceId: sharingLabelIds.source,
      targetId: sharingLabelIds.target,
      enabled: true,
    },
    {
      type: 'shareTransform',
      sourceId: sharingLabelIds.source,
      targetId: sharingLabelIds.target,
      enabled: true,
    },
    {
      type: 'shareShapeTransform',
      sourceId: sharingLabelIds.source,
      targetId: modelPolygonFixtureId,
      enabled: true,
    },
    {
      type: 'move',
      id: sharingLabelIds.source,
      coordinate: PANGYO_NORTH,
      duration: 400,
    },
    {
      type: 'move',
      id: sharingLabelIds.target,
      coordinate: PANGYO_SOUTH,
      duration: 400,
    },
    {
      type: 'rotate',
      id: sharingLabelIds.source,
      rotation: 90,
      duration: 400,
    },
    {
      type: 'rotate',
      id: sharingLabelIds.target,
      rotation: 45,
      duration: 400,
    },
    {
      type: 'sharePosition',
      sourceId: sharingLabelIds.source,
      targetId: sharingLabelIds.target,
      enabled: false,
    },
    {
      type: 'shareTransform',
      sourceId: sharingLabelIds.source,
      targetId: sharingLabelIds.target,
      enabled: false,
    },
    {
      type: 'move',
      id: sharingLabelIds.source,
      coordinate: PANGYO_WEST,
      duration: 400,
    },
    {
      type: 'move',
      id: sharingLabelIds.target,
      coordinate: PANGYO_EAST,
      duration: 400,
    },
    {
      type: 'rotate',
      id: sharingLabelIds.source,
      rotation: 0,
      duration: 400,
    },
    {
      type: 'rotate',
      id: sharingLabelIds.target,
      rotation: 0,
      duration: 400,
    },
    {
      type: 'move',
      id: sharingLabelIds.target,
      coordinate: PANGYO_EAST,
      duration: 0,
    },
    {
      type: 'movePath',
      id: sharingLabelIds.target,
      points: [PANGYO_EAST, PANGYO_SOUTH],
      duration: 400,
      rotate: false,
      cornerRadius: 0,
      jumpThreshold: 0,
    },
    {
      type: 'shareShapeTransform',
      sourceId: sharingLabelIds.source,
      targetId: modelPolygonFixtureId,
      enabled: false,
    },
  ],
  animations: labelAnimationFixtures.flatMap<LabelCommand>(({ id }) => [
    { type: 'startAnimation', id },
    { type: 'stopAnimation', id },
  ]),
  tracking: [
    { type: 'startTracking', id: 'fixture-tracking-label', rotate: true },
    { type: 'stopTracking' },
  ],
} satisfies Record<string, LabelCommand[]>;

export const labelPlatformDifferenceFixtures = {
  androidCompetitionExceptions: {
    ...labelLayerFixture,
    id: 'fixture-competition-exception-layer',
    competition: 'all',
    competitionExceptions: [labelLayerFixture.id],
  } satisfies LabelLayer,
  androidNoneTransform: {
    ...regularLabelFixture,
    id: 'fixture-none-transform-label',
    transform: 'none',
  } satisfies MapLabel,
  iosPathRank: {
    ...pathLabelFixture,
    id: 'fixture-ranked-path-label',
    rank: 30,
  } satisfies PathMapLabel,
  iosLodAutoMove: {
    type: 'show',
    id: lodLabelFixture.id,
    visible: true,
    autoMove: true,
  } satisfies LabelCommand,
} as const;

export const iosPathRankLabelCapabilityFixture = {
  platform: 'ios',
  requiredCapability: 'pathTextRank',
  scene: {
    pathTextStyles: [pathTextFixtureStyle],
    layers: [labelLayerFixture],
    pathLabels: [
      { ...pathLabelFixture, id: 'fixture-path-rank-zero', text: 'RANK 0', rank: 0 },
      labelPlatformDifferenceFixtures.iosPathRank,
    ],
  } satisfies LabelScene,
} as const;

export const iosLodAutoMoveLabelCapabilityFixture = {
  platform: 'ios',
  requiredCapability: 'lodAutoMove',
  scene: {
    styles: [labelFixtureStyles.iconOnly],
    lodLayers: [lodLabelLayerFixture],
    lodLabels: [lodLabelFixture],
  } satisfies LabelScene,
  command: labelPlatformDifferenceFixtures.iosLodAutoMove,
} as const;

export const androidNoneTransformLabelCapabilityFixture = {
  platform: 'android',
  requiredCapability: 'supportedTransforms:none',
  scene: {
    styles: [labelFixtureStyles.iconTextBadgePerLevel],
    layers: [labelLayerFixture],
    labels: [labelPlatformDifferenceFixtures.androidNoneTransform],
  } satisfies LabelScene,
} as const;

export const androidCompetitionExceptionsLabelCapabilityFixture = {
  platform: 'android',
  requiredCapability: 'competitionExceptions',
  scene: {
    styles: [labelFixtureStyles.collisionRed, labelFixtureStyles.collisionBlue],
    layers: [
      { ...labelLayerFixture, competition: 'all', zOrder: 2300 },
      { ...labelPlatformDifferenceFixtures.androidCompetitionExceptions, zOrder: 2301 },
    ],
    labels: [
      {
        id: 'fixture-competition-exception-red-label',
        layerId: labelLayerFixture.id,
        styleId: labelFixtureStyles.collisionRed.id,
        coordinate: PANGYO,
        text: [{ value: 'RED', styleIndex: 0 }],
        rank: 10,
        pixelOffset: { x: -8, y: 0 },
      },
      {
        id: 'fixture-competition-exception-blue-label',
        layerId: labelPlatformDifferenceFixtures.androidCompetitionExceptions.id,
        styleId: labelFixtureStyles.collisionBlue.id,
        coordinate: PANGYO,
        text: [{ value: 'BLUE', styleIndex: 0 }],
        rank: 20,
        pixelOffset: { x: 8, y: 0 },
      },
    ],
  } satisfies LabelScene,
} as const;

export const labelPlatformCapabilityFixtures = {
  iosPathRank: iosPathRankLabelCapabilityFixture,
  iosLodAutoMove: iosLodAutoMoveLabelCapabilityFixture,
  androidNoneTransform: androidNoneTransformLabelCapabilityFixture,
  androidCompetitionExceptions: androidCompetitionExceptionsLabelCapabilityFixture,
} as const;

export const labelErrorFixtureScenes = {
  badUriScheme: {
    styles: [
      {
        id: 'fixture-error-bad-uri-style',
        levels: [
          {
            level: 0,
            image: { uri: 'ftp://invalid.example/label.png', width: 24, height: 24 },
          },
        ],
      },
    ],
    layers: [labelLayerFixture],
    labels: [
      {
        id: 'fixture-error-bad-uri-label',
        layerId: labelLayerFixture.id,
        styleId: 'fixture-error-bad-uri-style',
        coordinate: PANGYO,
      },
    ],
  },
  missingStyleReference: {
    layers: [labelLayerFixture],
    labels: [
      {
        id: 'fixture-error-missing-style-label',
        layerId: labelLayerFixture.id,
        styleId: 'fixture-error-missing-style',
        coordinate: PANGYO,
      },
    ],
  },
  outOfRangeLatitude: {
    styles: [labelFixtureStyles.simpleText],
    layers: [labelLayerFixture],
    labels: [
      {
        id: 'fixture-error-latitude-label',
        layerId: labelLayerFixture.id,
        styleId: labelFixtureStyles.simpleText.id,
        coordinate: { latitude: 91, longitude: PANGYO.longitude },
        text: [{ value: 'INVALID LATITUDE', styleIndex: 0 }],
      },
    ],
  },
} satisfies Record<string, LabelScene>;

export const updatedPathTextFixtureScene: LabelScene = {
  pathTextStyles: [
    {
      ...pathTextFixtureStyle,
      levels: pathTextFixtureStyle.levels.map((level) => ({
        ...level,
        text: { ...level.text, fontSize: 28, color: '#D946EFFF' },
      })),
    },
  ],
  layers: [labelLayerFixture],
  pathLabels: [pathLabelFixture],
};

export const labelUnknownIdCommand = {
  type: 'show',
  id: 'fixture-error-unknown-label',
  visible: true,
} satisfies LabelCommand;

const fontFixtureFamily = 'KakaoMapFontFixture';
const fontFixtureTextStyle: LabelStyle = {
  id: 'fixture-font-default-style',
  levels: [{ level: 0, textLayout: 'center', textLines: [{ fontSize: 32, color: '#FF00FFFF' }] }],
};

const fontFixtureScene = {
  styles: [fontFixtureTextStyle],
  layers: [pixelBoxLabelLayerFixture],
  labels: [
    {
      id: 'fixture-font-label',
      layerId: pixelBoxLabelLayerFixture.id,
      styleId: fontFixtureTextStyle.id,
      coordinate: PANGYO,
      text: [{ value: 'KAKAO FONT', styleIndex: 0 }],
    },
  ],
} satisfies LabelScene;

export const androidFontFixture = {
  resourceName: process.env.EXPO_PUBLIC_KAKAO_MAP_FONT_RESOURCE,
  family: fontFixtureFamily,
  baseline: fontFixtureScene,
  registered: {
    ...fontFixtureScene,
    styles: [
      {
        ...fontFixtureTextStyle,
        levels: fontFixtureTextStyle.levels.map((level) => ({
          ...level,
          textLines: level.textLines?.map((line) => ({ ...line, fontFamily: fontFixtureFamily })),
        })),
      },
    ],
  } satisfies LabelScene,
};
