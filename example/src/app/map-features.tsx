import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  type AdvancedCameraCapabilities,
  type AdvancedCameraCommand,
  type CameraUpdate,
  initializeKakaoMapSDK,
  KakaoMapView,
  type KakaoMapViewRef,
  type LabelCapabilities,
  type LabelCommand,
  type LabelScene,
  type MapGesture,
  type MapOptions,
  type MapOverlay,
  type RouteCapabilities,
  type RouteCommand,
  type RouteScene,
  type ShapeCapabilities,
  type ShapeScene,
} from '@react-native-kakao/map';

import { CAMERA_FIXTURES } from '../map/camera-fixtures';
import {
  androidCompetitionExceptionsLabelCapabilityFixture,
  androidNoneTransformLabelCapabilityFixture,
  iosLodAutoMoveLabelCapabilityFixture,
  iosPathRankLabelCapabilityFixture,
  labelErrorFixtureScenes,
  labelFixtureActions,
  labelFixtureScenes,
  labelUnknownIdCommand,
  regularLabelFixture,
  sharingLabelIds,
  sharingTargetDestination,
  updatedPathTextFixtureScene,
} from '../map/label-fixtures';
import {
  emptyRouteFixtureScene,
  routeCapabilityCommands,
  routeFixtureCommands,
  routeFixtureReplacementScene,
  routeFixtureScene,
} from '../map/route-fixtures';
import {
  isolatedShapeFixtureScenes,
  isolatedShapeFixtureZoomLevels,
  modelPolygonFixtureId,
  shapeCapabilityCommands,
  shapeFixtureCommands,
  shapeFixtureScenes,
  sharingShapeFixtureScene,
} from '../map/shape-fixtures';
import { kakaoNativeAppKey } from '../util/kakaoNativeAppKey';

const pangyo = { latitude: 37.402001, longitude: 127.108678, zoomLevel: 17 };
const seoul = { latitude: 37.5665, longitude: 126.978 };
const sections = [
  'camera',
  'advanced-camera',
  'composition',
  'poi',
  'gestures',
  'layout',
  'queries',
  'labels',
  'label-motion',
  'label-animations',
  'label-limits',
  'label-errors',
  'shapes',
  'shape-motion',
  'routes',
  'route-motion',
] as const;

const overlays: MapOverlay[] = ['roadviewLine', 'hillShading', 'bicycleRoad', 'hybrid'];

const gestures: MapGesture[] = [
  'doubleTapZoomIn',
  'twoFingerTapZoomOut',
  'pan',
  'rotate',
  'zoom',
  'tilt',
  'longTapAndDrag',
  'rotateZoom',
  'oneFingerZoom',
];

export default function MapFeaturesPage() {
  const map = useRef<KakaoMapViewRef>(null);
  const sequence = useRef(0);
  const eventHistory = useRef<object[]>([]);
  const insets = useSafeAreaInsets();
  const [isInitialized, setInitialized] = useState(false);
  const [isReady, setReady] = useState(false);
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>([]);
  const [section, setSection] = useState<(typeof sections)[number]>('camera');
  const [options, setOptions] = useState<MapOptions>({});
  const [labels, setLabels] = useState<LabelScene>();
  const [labelCapabilities, setLabelCapabilities] = useState<LabelCapabilities>();

  const [shapeCapabilities, setShapeCapabilities] = useState<ShapeCapabilities>();

  const [advancedCameraCapabilities, setAdvancedCameraCapabilities] =
    useState<AdvancedCameraCapabilities>();

  const [routeCapabilities, setRouteCapabilities] = useState<RouteCapabilities>();
  const [result, setResult] = useState('Waiting for map');
  const [event, setEvent] = useState('No event');
  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    let isActive = true;
    initializeKakaoMapSDK(kakaoNativeAppKey).then(
      () => {
        if (isActive) {
          setInitialized(true);
        }
      },
      (error: Error) => {
        if (isActive) {
          setResult(error.message);
        }
      },
    );

    return () => {
      isActive = false;
    };
  }, []);

  if (Platform.OS === 'web') {
    return <Text>{'Maps support Android and iOS only.'}</Text>;
  }

  const actions: {
    id: string;
    run: () => void;
  }[] = [];

  if (section === 'camera') {
    const updates: {
      id: string;
      update: CameraUpdate;
    }[] = [
      { id: 'position', update: { type: 'position', position: seoul } },
      { id: 'zoom', update: { type: 'zoom', zoomLevel: 18 } },
      {
        id: 'orientation',
        update: { type: 'orientation', rotation: 90, tilt: 45 },
      },
      {
        id: 'fit',
        update: {
          type: 'fit',
          coordinates: [pangyo, seoul, { latitude: 37.5115, longitude: 127.0595 }],
        },
      },
    ];

    actions.push(
      ...updates.map(({ id, update }) => ({
        id,
        run: () => execute(() => requireMap().updateCamera(update)),
      })),
      {
        id: 'animated-orientation',
        run: () =>
          execute(() =>
            requireMap().updateCamera(
              { type: 'orientation', rotation: 180, tilt: 30 },
              { duration: 600 },
            ),
          ),
      },
      {
        id: 'reset-camera',
        run: () => execute(() => requireMap().moveCamera(pangyo)),
      },
      ...[0, 90].map((rotation) => ({
        id: `flat-rotation-${rotation}`,
        run: () =>
          execute(() =>
            requireMap().updateCamera({
              type: 'orientation',
              rotation,
              tilt: 0,
            }),
          ),
      })),
    );
  } else if (section === 'advanced-camera') {
    actions.push(
      ...Object.entries(CAMERA_FIXTURES)
        .filter(([, command]) => isSupportedCameraCommand(command))
        .map(([id, command]) => ({
          id: `advanced-camera-${id}`,
          run: () =>
            execute(async () => {
              const value = await requireMap().executeCameraCommand(command);
              if (value.type === 'capabilities') {
                setAdvancedCameraCapabilities(value.capabilities);
              }

              return value;
            }),
        })),
    );
  } else if (section === 'composition') {
    actions.push(
      ...(['normal', 'skyview'] as const).map((mapType) => ({
        id: mapType,
        run: () => patch({ mapType }),
      })),
      ...overlays.map((overlay) => ({
        id: overlay,
        run: () => patch({ overlays: [overlay] }),
      })),
      { id: 'no-overlays', run: () => patch({ overlays: [] }) },
      ...supportedLanguages.map((language) => ({
        id: `language-${language}`,
        run: () => patch({ language }),
      })),
    );
  } else if (section === 'poi') {
    actions.push(
      ...(['small', 'regular', 'large', 'xLarge'] as const).map((scale) => ({
        id: `poi-${scale}`,
        run: () => patch({ poi: { scale } }),
      })),
      ...[false, true].flatMap((value) => [
        {
          id: `poi-visible-${value}`,
          run: () => patch({ poi: { visible: value } }),
        },
        {
          id: `poi-clickable-${value}`,
          run: () => patch({ poi: { clickable: value } }),
        },
      ]),
      ...[0, 0.1, 1].map((buildingScale) => ({
        id: `building-${buildingScale}`,
        run: () => patch({ buildingScale }),
      })),
    );
  } else if (section === 'gestures') {
    actions.push(
      ...gestures.flatMap((gesture) =>
        [false, true].map((isEnabled) => ({
          id: `${gesture}-${isEnabled}`,
          run: () => patch({ gestures: { [gesture]: isEnabled } }),
        })),
      ),
    );
  } else if (section === 'layout') {
    actions.push(
      {
        id: 'padding',
        run: () => patch({ padding: { top: 40, right: 20, bottom: 80, left: 30 } }),
      },
      {
        id: 'no-padding',
        run: () => patch({ padding: { top: 0, right: 0, bottom: 0, left: 0 } }),
      },
      {
        id: 'zoom-range',
        run: () => patch({ zoomRange: { min: 12, max: 18 } }),
      },
      {
        id: 'reset-zoom-range',
        run: () => patch({ zoomRange: { min: 6, max: 21 } }),
      },
      ...[false, true].flatMap((visible) => [
        {
          id: `compass-${visible}`,
          run: () => patch({ compass: { visible } }),
        },
        {
          id: `scale-${visible}`,
          run: () => patch({ scaleBar: { visible, autoHide: false } }),
        },
      ]),
      {
        id: 'widget-positions',
        run: () =>
          patch({
            compass: {
              visible: true,
              position: { gravity: 'topRight', x: 24, y: 24 },
            },
            scaleBar: {
              visible: true,
              autoHide: false,
              position: { gravity: 'bottomRight', x: 24, y: 24 },
            },
            logo: { gravity: 'bottomLeft', x: 12, y: 12 },
          }),
      },
      {
        id: 'scale-fade',
        run: () =>
          patch({
            scaleBar: {
              visible: true,
              autoHide: true,
              fade: {
                inDuration: 200,
                outDuration: 400,
                retentionDuration: 1000,
              },
            },
          }),
      },
    );
  } else if (section === 'queries') {
    actions.push(
      { id: 'map-info', run: () => execute(() => requireMap().getMapInfo()) },
      { id: 'camera-info', run: () => execute(() => requireMap().getCamera()) },
      {
        id: 'screen-center',
        run: () =>
          execute(async () => {
            const { viewport } = await requireMap().getMapInfo();

            return requireMap().screenToCoordinate({
              x: viewport.x + viewport.width / 2,
              y: viewport.y + viewport.height / 2,
            });
          }),
      },
      {
        id: 'project-center',
        run: () =>
          execute(async () => {
            const camera = await requireMap().getCamera();

            return requireMap().coordinateToScreen(camera);
          }),
      },
      {
        id: 'clear-cache',
        run: () => execute(() => requireMap().clearCache()),
      },
      {
        id: 'screen-up-bearing',
        run: () =>
          execute(async () => {
            const camera = await requireMap().getCamera();
            const { viewport } = await requireMap().getMapInfo();
            const up = await requireMap().screenToCoordinate({
              x: viewport.x + viewport.width / 2,
              y: viewport.y + viewport.height / 4,
            });

            return {
              camera,
              up,
              latitudeDelta: up.latitude - camera.latitude,
              longitudeDelta: up.longitude - camera.longitude,
            };
          }),
      },
    );
  } else if (section === 'shapes' || section === 'shape-motion') {
    actions.push(
      {
        id: 'shape-capabilities',
        run: () =>
          execute(async () => {
            const value = await requireMap().executeShapeCommand({
              type: 'getCapabilities',
            });

            if (value.type === 'capabilities') {
              setShapeCapabilities(value);
            }

            return value;
          }),
      },
      {
        id: 'shapes-complete',
        run: () => applyShapes(shapeFixtureScenes.complete),
      },
      { id: 'shapes-clear', run: () => applyShapes(shapeFixtureScenes.empty) },
      ...Object.entries(isolatedShapeFixtureScenes).map(([id, scene]) => ({
        id: `shape-scene-${id}`,
        run: () => applyShapes(scene, isolatedShapeFixtureZoomLevels[id]),
      })),
      ...Object.entries(shapeFixtureCommands)
        .filter(([id]) => id !== 'capabilities')
        .map(([id, command]) => ({
          id: `shape-${id}`,
          run: () => execute(() => requireMap().executeShapeCommand(command)),
        })),
    );

    if (section === 'shape-motion') {
      const commands = [
        ...(shapeCapabilities?.zIndexMutation
          ? [shapeCapabilityCommands.androidZIndexMutation]
          : []),
        ...(shapeCapabilities?.modelOrientation
          ? [shapeCapabilityCommands.iosModelOrientation]
          : []),
        ...(shapeCapabilities?.geographicPosition
          ? [shapeCapabilityCommands.androidGeographicPosition]
          : []),
      ];

      actions.push(
        ...commands.map((command) => ({
          id: `shape-${command.type}`,
          run: () => execute(() => requireMap().executeShapeCommand(command)),
        })),
      );

      if (shapeCapabilities?.geographicOrientation) {
        actions.push({
          id: 'shape-geographic-orientation',
          run: () =>
            execute(() =>
              requireMap().executeShapeCommand(shapeCapabilityCommands.iosGeographicOrientation),
            ),
        });
      }

      if (shapeCapabilities?.waveTargets.includes('polyline')) {
        actions.push(
          {
            id: 'shape-start-polyline-wave',
            run: () =>
              execute(() =>
                requireMap().executeShapeCommand(shapeCapabilityCommands.startPolylineWave),
              ),
          },
          {
            id: 'shape-stop-polyline-wave',
            run: () =>
              execute(() =>
                requireMap().executeShapeCommand(shapeCapabilityCommands.stopPolylineWave),
              ),
          },
        );
      }
    }
  } else if (section === 'routes' || section === 'route-motion') {
    actions.push({
      id: 'route-read-capabilities',
      run: () =>
        execute(async () => {
          const value = await requireMap().executeRouteCommand(routeFixtureCommands.capabilities);

          if (value.type === 'capabilities') {
            setRouteCapabilities(value);
          }

          return value;
        }),
    });

    actions.push(
      { id: 'route-dispatch-apply', run: () => applyRoutes(routeFixtureScene) },
      {
        id: 'route-dispatch-remove',
        run: () => executeRouteCommand(routeFixtureCommands.remove),
      },
      {
        id: 'route-dispatch-replace-same-id',
        run: () => applyRoutes(routeFixtureReplacementScene),
      },
      {
        id: 'route-dispatch-clear',
        run: () => applyRoutes(emptyRouteFixtureScene),
      },
    );

    if (section === 'routes') {
      actions.push(
        {
          id: 'route-read-counts',
          run: () => executeRouteCommand(routeFixtureCommands.counts),
        },
        {
          id: 'route-read-state',
          run: () => executeRouteCommand(routeFixtureCommands.state),
        },
        {
          id: 'route-dispatch-hide',
          run: () => executeRouteCommand(routeFixtureCommands.hide),
        },
        {
          id: 'route-dispatch-show',
          run: () => executeRouteCommand(routeFixtureCommands.show),
        },
        {
          id: 'route-dispatch-z-index',
          run: () => executeRouteCommand(routeFixtureCommands.setZIndex),
        },
        {
          id: 'route-dispatch-change-data',
          run: () => executeRouteCommand(routeFixtureCommands.changeSegments),
        },
      );
    } else {
      actions.push(
        {
          id: 'route-dispatch-progress-immediate',
          run: () => executeRouteCommand(routeFixtureCommands.setProgressImmediate),
        },
        {
          id: 'route-dispatch-progress-long',
          run: () => executeRouteCommand(routeFixtureCommands.setProgressLong),
        },
        {
          id: 'route-dispatch-progress-superseding',
          run: () => executeRouteCommand(routeFixtureCommands.setProgressSuperseding),
        },
        {
          id: 'route-read-requested-progress',
          run: () => executeRouteCommand(routeFixtureCommands.requestedProgress),
        },
        {
          id: 'route-dispatch-animation-forward',
          run: () => executeRouteCommand(routeFixtureCommands.startForwardFill),
        },
        {
          id: 'route-dispatch-animation-backward',
          run: () => executeRouteCommand(routeFixtureCommands.startBackwardClearAndReset),
        },
        {
          id: 'route-dispatch-animation-stop',
          run: () => executeRouteCommand(routeFixtureCommands.stopForwardFill),
        },
      );

      if (routeCapabilities?.nativeProgressRead) {
        actions.push({
          id: 'route-read-native-progress',
          run: () => executeRouteCommand(routeCapabilityCommands.androidNativeProgress),
        });
      }

      if (routeCapabilities?.progressAtCoordinate) {
        actions.push({
          id: 'route-read-progress-at-coordinate',
          run: () => executeRouteCommand(routeFixtureCommands.progressAtCoordinate),
        });
      }

      if (routeCapabilities?.coordinateAtProgress) {
        actions.push({
          id: 'route-read-coordinate-at-progress',
          run: () => executeRouteCommand(routeCapabilityCommands.androidCoordinateAtProgress),
        });
      }
    }
  } else {
    actions.push(
      {
        id: 'label-capabilities',
        run: () =>
          execute(async () => {
            const value = await requireMap().getLabelCapabilities();
            setLabelCapabilities(value);

            return value;
          }),
      },
      {
        id: 'label-state',
        run: () => execute(() => requireMap().getLabelState()),
      },
      { id: 'clear-labels', run: () => setLabels({}) },
    );

    if (section === 'labels') {
      actions.push(
        ...Object.entries(labelFixtureScenes).map(([id, scene]) => ({
          id: `labels-${id}`,
          run: () => applyLabels(scene),
        })),
      );
    } else if (section === 'label-motion') {
      actions.push(
        {
          id: 'load-regular',
          run: () => applyLabels(labelFixtureScenes.regular),
        },
        {
          id: 'load-sharing',
          run: () => applyLabels(labelFixtureScenes.sharingAndTracking),
        },
        {
          id: 'load-sharing-shape',
          run: () => applyShapes(sharingShapeFixtureScene),
        },
        {
          id: 'sharing-shape-state',
          run: () =>
            execute(() =>
              requireMap().executeShapeCommand({
                type: 'getState',
                id: modelPolygonFixtureId,
              }),
            ),
        },
        ...Object.entries(sharingLabelIds).map(([owner, id]) => ({
          id: `sharing-focus-${owner}`,
          run: () =>
            execute(async () => {
              const label = await getSharingLabel(id);
              await requireMap().moveCamera({
                ...label.coordinate,
                zoomLevel: 17,
                rotation: 0,
                tilt: 0,
              });
            }),
        })),
        {
          id: 'sharing-move-path-from-current',
          run: () =>
            execute(async () => {
              const target = await getSharingLabel(sharingLabelIds.target);
              await requireMap().runLabelCommand({
                type: 'movePath',
                id: target.id,
                points: [target.coordinate, sharingTargetDestination],
                duration: 400,
                rotate: false,
                cornerRadius: 0,
                jumpThreshold: 0,
              });
            }),
        },
        ...Object.entries(labelFixtureActions)
          .filter(([group]) => group !== 'animations')
          .flatMap(([group, commands]) =>
            commands.filter(isSupportedLabelCommand).map((command, index) => ({
              id: `${group}-${command.type}-${index}`,
              run: () => execute(() => requireMap().runLabelCommand(portableLabelCommand(command))),
            })),
          ),
      );
    } else if (section === 'label-limits') {
      const fixtures = [
        ...(labelCapabilities?.pathTextStyleDefinitionUpdate
          ? [
              {
                requiredCapability: 'pathTextStyleDefinitionUpdate',
                scene: updatedPathTextFixtureScene,
              },
            ]
          : []),
        ...(labelCapabilities?.pathTextRank ? [iosPathRankLabelCapabilityFixture] : []),
        ...(labelCapabilities?.lodAutoMove ? [iosLodAutoMoveLabelCapabilityFixture] : []),
        ...(labelCapabilities?.supportedTransforms.includes('none')
          ? [androidNoneTransformLabelCapabilityFixture]
          : []),
        ...(labelCapabilities?.competitionExceptions
          ? [androidCompetitionExceptionsLabelCapabilityFixture]
          : []),
      ];

      actions.push(
        ...fixtures.map((fixture) => ({
          id: `label-limit-${fixture.requiredCapability}`,
          run: () => applyLabels(fixture.scene),
        })),
        ...(labelCapabilities?.lodAutoMove
          ? [
              {
                id: 'label-lod-auto-move',
                run: () =>
                  execute(() =>
                    requireMap().runLabelCommand(iosLodAutoMoveLabelCapabilityFixture.command),
                  ),
              },
            ]
          : []),
      );
    } else if (section === 'label-errors') {
      actions.push(
        {
          id: 'error-control',
          run: () => applyLabels(labelFixtureScenes.pixelBox),
        },
        ...Object.entries(labelErrorFixtureScenes).map(([id, scene]) => ({
          id: `label-error-${id}`,
          run: () => setLabels(scene),
        })),
        {
          id: 'label-error-unknown-id',
          run: () => execute(() => requireMap().runLabelCommand(labelUnknownIdCommand)),
        },
      );
    } else {
      actions.push(
        {
          id: 'load-animations',
          run: () => applyLabels(labelFixtureScenes.animations),
        },
        ...labelFixtureActions.animations.flatMap((command) =>
          command.type === 'startAnimation' || command.type === 'stopAnimation'
            ? [
                {
                  id: `${command.type}-${command.id}`,
                  run: () => execute(() => requireMap().runLabelCommand(command)),
                },
              ]
            : [],
        ),
      );
    }
  }

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      <ScrollView horizontal testID={'lab-sections'} style={styles.tabs}>
        {sections.map((item) => (
          <Pressable
            key={item}
            accessibilityRole={'button'}
            testID={`lab-section-${item}`}
            onPress={() => setSection(item)}
          >
            <Text style={[styles.text, styles.button]}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView testID={'lab-actions'} style={styles.actions}>
        <View style={styles.wrap}>
          {actions.map(({ id, run }) => (
            <Pressable
              key={id}
              accessibilityRole={'button'}
              testID={`lab-${id}`}
              disabled={!isReady}
              onPress={run}
            >
              <Text style={[styles.text, styles.button]}>{id}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <Text testID={'lab-status'} style={[styles.text, styles.status]}>
        {isReady ? 'ready' : 'initializing'}
      </Text>
      <Text testID={'lab-result'} numberOfLines={7} style={[styles.text, styles.result]}>
        {result}
      </Text>
      <Text testID={'lab-event'} numberOfLines={3} style={[styles.text, styles.event]}>
        {event}
      </Text>
      {isInitialized ? (
        <KakaoMapView
          ref={map}
          testID={'lab-map'}
          style={styles.map}
          initialCamera={pangyo}
          options={options}
          labels={labels}
          onMapReady={() => {
            setReady(true);
            requireMap()
              .getMapInfo()
              .then(
                ({ supportedLanguages }) => setSupportedLanguages(supportedLanguages),
                (error: Error) => recordEvent({ type: 'error', message: error.message }),
              );
          }}
          onError={(error) => recordEvent({ type: 'error', ...error })}
          onCameraOperation={(value) => recordEvent({ type: 'camera-operation', ...value })}
          onCameraMoveStart={(value) => recordEvent({ type: 'start', ...value })}
          onCameraIdle={(value) => recordEvent({ type: 'idle', ...value })}
          onMapClick={(value) => recordEvent({ type: 'click', ...value })}
          onMapLongClick={(value) => recordEvent({ type: 'long-click', ...value })}
          onTerrainClick={(value) => recordEvent({ type: 'terrain-click', ...value })}
          onViewportClick={(value) => recordEvent({ type: 'viewport-click', ...value })}
          onVisibilityChanged={(value) => recordEvent({ type: 'visibility', ...value })}
          onFocusChanged={(value) => recordEvent({ type: 'focus', ...value })}
          onPoiClick={(value) => recordEvent({ type: 'poi-click', ...value })}
          onCompassClick={() => recordEvent({ type: 'compass-click' })}
          onMapTypeChanged={(value) => recordEvent({ type: 'map-type', ...value })}
          onPaddingChanged={(value) => recordEvent({ type: 'padding', ...value })}
          onViewportChanged={(value) => recordEvent({ type: 'viewport', ...value })}
          onLabelsChanged={(value) => recordEvent({ type: 'labels-changed', ...value })}
          onLabelClick={(value) => recordEvent({ type: 'label-click', ...value })}
          onLabelAnimationStopped={(value) =>
            recordEvent({ type: 'label-animation-stopped', ...value })
          }
          onShapesChanged={(value) => recordEvent({ type: 'shapes-changed', counts: value })}
          onShapeAnimationStop={(value) => recordEvent({ type: 'shape-animation-stop', ...value })}
          onRoutesChanged={(value) => recordEvent({ type: 'routes-changed', counts: value })}
          onRouteProgress={(value) => recordEvent({ type: 'route-progress', ...value })}
          onRouteAnimationStop={(value) => recordEvent({ type: 'route-animation-stop', ...value })}
        />
      ) : null}
    </View>
  );
  function requireMap() {
    if (!map.current) {
      throw new Error('The map is not mounted.');
    }

    return map.current;
  }

  function isSupportedCameraCommand(command: AdvancedCameraCommand) {
    if (command.type === 'getCapabilities' || command.type === 'getState') {
      return true;
    }

    const capabilities = advancedCameraCapabilities;
    if (!capabilities) {
      return false;
    }

    if ('operationId' in command && !capabilities.animation.operationCompletion) {
      return false;
    }

    switch (command.type) {
      case 'moveToHeight':
        return capabilities.absoluteHeight;
      case 'transform':
        return capabilities.transform;
      case 'fit':
        return command.padding == null || command.padding === 0 || capabilities.fit.padding;
      case 'canShow':
        return capabilities.canShow.basic;
      case 'heightAtLevel':
        return capabilities.heightAtLevel;
      case 'resetOrientation':
        return capabilities.resetOrientation;
      case 'setBackToNorthDuringAutoElevation':
        return capabilities.backToNorthDuringAutoElevation;
      case 'setReferencePointLock':
        return capabilities.referencePoint.gestures.includes(command.gesture);
    }
  }

  function patch(value: MapOptions) {
    setOptions((previous) => ({
      ...previous,
      ...value,
      poi: { ...previous.poi, ...value.poi },
      gestures: { ...previous.gestures, ...value.gestures },
      compass: { ...previous.compass, ...value.compass },
      scaleBar: { ...previous.scaleBar, ...value.scaleBar },
    }));
    setResult(`${++sequence.current}|options: ${JSON.stringify(value)}`);
  }

  function recordEvent(value: object) {
    const id = ++sequence.current;
    eventHistory.current = [{ sequence: id, ...value }, ...eventHistory.current].slice(0, 20);
    setEvent(`${id}|${JSON.stringify(eventHistory.current)}`);
  }

  async function getSharingLabel(id: string) {
    const state = await requireMap().getLabelState();
    const label = state.labels.find((item) => item.id === id);
    if (label?.kind !== 'label') {
      throw new Error('Load the sharing fixture first.');
    }

    return label;
  }

  function applyLabels(scene: LabelScene) {
    execute(async () => {
      await requireMap().moveCamera({
        ...regularLabelFixture.coordinate,
        zoomLevel: 17,
      });
      setLabels(scene);

      return 'Label scene submitted';
    });
  }

  function applyShapes(scene: ShapeScene, zoomLevel = 17) {
    execute(async () => {
      await requireMap().moveCamera({
        ...regularLabelFixture.coordinate,
        zoomLevel,
      });

      return requireMap().applyShapes(scene);
    });
  }

  function applyRoutes(scene: RouteScene) {
    execute(async () => {
      await requireMap().moveCamera({
        ...regularLabelFixture.coordinate,
        zoomLevel: 17,
      });

      return requireMap().applyRoutes(scene);
    });
  }

  function executeRouteCommand(command: RouteCommand) {
    execute(() => requireMap().executeRouteCommand(command));
  }

  function isSupportedLabelCommand(command: LabelCommand) {
    return command.type !== 'scale' || labelCapabilities?.labelScaleCommand === true;
  }

  function portableLabelCommand(command: LabelCommand) {
    if (command.type === 'show' && labelCapabilities?.autoMoveDuration !== true) {
      return { ...command, duration: undefined };
    }

    return command;
  }

  async function execute(action: () => Promise<unknown>) {
    const id = ++sequence.current;
    try {
      setResult(`${id}|${JSON.stringify((await action()) ?? 'dispatched')}`);
    } catch (error) {
      const code = error instanceof Error && 'code' in error ? String(error.code) : 'unknown';

      setResult(`${id}|error: ${code} ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'black' },
  tabs: { height: 42, flexGrow: 0 },
  actions: { height: 150, flexGrow: 0 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  button: { backgroundColor: '#333333', padding: 8, margin: 3 },
  text: { color: 'white', fontSize: 11, padding: 3 },
  status: { height: 20 },
  result: { height: 110 },
  event: { height: 48 },
  map: { flex: 1, minHeight: 180 },
});
