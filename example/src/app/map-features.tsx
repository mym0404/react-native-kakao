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
  type MapGesture,
  type MapOptions,
  type MapOverlay,
} from '@react-native-kakao/map';

import { CAMERA_FIXTURES } from '../map/camera-fixtures';
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
  const [advancedCameraCapabilities, setAdvancedCameraCapabilities] =
    useState<AdvancedCameraCapabilities>();
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
