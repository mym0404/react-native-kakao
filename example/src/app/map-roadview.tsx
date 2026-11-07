import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  initializeKakaoMapSDK,
  KakaoMapRoadView,
  type KakaoMapRoadViewRef,
  KakaoRoadView,
  type KakaoRoadViewRef,
  type RoadViewCapture,
  type RoadViewInfo,
  type RoadViewRequest,
} from '@react-native-kakao/map';

import {
  roadViewCoordinate,
  roadViewPanoramaRequest,
  roadViewRequests,
} from '../map/roadview-fixtures';
import { kakaoNativeAppKey } from '../util/kakaoNativeAppKey';

type HostMode = 'standalone' | 'combined';
type Action = { id: string; disabled?: boolean; run: () => void };

const mapCamera = { ...roadViewCoordinate, zoomLevel: 17, tilt: 20, rotation: 30 };
const logoPosition = { gravity: 'bottomRight', x: 16, y: 16 } as const;

export default function MapRoadViewPage() {
  const standalone = useRef<KakaoRoadViewRef>(null);
  const combined = useRef<KakaoMapRoadViewRef>(null);
  const staleView = useRef<KakaoRoadViewRef | null>(null);
  const hostGeneration = useRef(0);
  const failedHostGeneration = useRef<number | null>(null);
  const sequence = useRef(0);
  const eventHistory = useRef<object[]>([]);
  const insets = useSafeAreaInsets();
  const [isInitialized, setInitialized] = useState(false);
  const [isMounted, setMounted] = useState(true);
  const [isReady, setReady] = useState(false);
  const [isMapReady, setMapReady] = useState(false);
  const [mode, setMode] = useState<HostMode>('standalone');
  const [visible, setVisible] = useState(true);
  const [showLogoPosition, setShowLogoPosition] = useState(false);
  const [layout, setLayout] = useState<'horizontal' | 'vertical'>('vertical');
  const [mapFraction, setMapFraction] = useState(0.5);
  const [linked, setLinked] = useState(true);
  const [info, setInfo] = useState<RoadViewInfo>();
  const [panoramaId, setPanoramaId] = useState('');
  const [captures, setCaptures] = useState<RoadViewCapture[]>([]);
  const [captureIndex, setCaptureIndex] = useState<number>();
  const [status, setStatus] = useState('initializing');
  const [command, setCommand] = useState('No command prepared');
  const [actualResult, setActualResult] = useState('No SDK request result');
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
          setStatus('initialized; waiting for RoadView ready');
        }
      },
      (error: Error) => {
        if (isActive) {
          setStatus(`initialization-error: ${formatError(error)}`);
        }
      },
    );

    return () => {
      isActive = false;
    };
  }, []);

  if (Platform.OS === 'web') {
    return <Text>{'RoadView supports Android and iOS only.'}</Text>;
  }

  const capabilities = info?.capabilities;
  const renderedHostGeneration = hostGeneration.current;
  const events = roadViewEvents(renderedHostGeneration);
  const actions: Action[] = [
    { id: 'host-standalone', disabled: mode === 'standalone', run: () => switchHost('standalone') },
    { id: 'host-combined', disabled: mode === 'combined', run: () => switchHost('combined') },
    { id: 'unmount', disabled: !isMounted, run: unmount },
    { id: 'remount', disabled: isMounted || !isInitialized, run: remount },
    {
      id: 'stale-ref-error',
      disabled: !staleView.current,
      run: () => execute('stale-ref-error', () => requireStaleView().getInfo()),
    },
    { id: 'visible-toggle', run: () => setVisible((value) => !value) },
    { id: 'logo-toggle', run: () => setShowLogoPosition((value) => !value) },
    {
      id: 'request-coordinate',
      disabled: !isReady,
      run: () => request('request-coordinate', roadViewRequests.coordinate),
    },
    {
      id: 'request-panorama-id',
      disabled: !isReady || !panoramaId,
      run: () => request('request-panorama-id', roadViewPanoramaRequest(panoramaId)),
    },
    {
      id: 'coordinate-look-at',
      disabled: !isReady,
      run: () => request('coordinate-look-at', roadViewRequests.coordinateLookAt),
    },
    {
      id: 'orientation-look-at',
      disabled: !isReady,
      run: () => request('orientation-look-at', roadViewRequests.orientationLookAt),
    },
    {
      id: 'coordinate-marker',
      disabled: !isReady,
      run: () => request('coordinate-marker', roadViewRequests.coordinateMarker),
    },
    {
      id: 'orientation-marker',
      disabled: !isReady,
      run: () => request('orientation-marker', roadViewRequests.orientationMarker),
    },
    {
      id: 'coordinate-direction-marker',
      disabled: !isReady || !capabilities?.coordinateDirectionMarkers,
      run: () => request('coordinate-direction-marker', roadViewRequests.coordinateDirectionMarker),
    },
    {
      id: 'custom-search-range',
      disabled: !isReady || !capabilities?.customSearchRange,
      run: () => request('custom-search-range', roadViewRequests.customSearchRange),
    },
    {
      id: 'get-info',
      disabled: !isReady,
      run: () =>
        execute('get-info', async () => {
          const value = await requireView().getInfo();
          setInfo(value);

          return value;
        }),
    },
    {
      id: 'request-next',
      disabled: !isReady || !capabilities?.nextRequest,
      run: () =>
        execute('request-next', () => requireView().requestNext(roadViewRequests.coordinate)),
    },
    {
      id: 'move-to-capture',
      disabled: !isReady || !capabilities?.datedCaptures || captureIndex === undefined,
      run: () =>
        execute('move-to-capture', () => requireView().moveToCapture(requireCaptureIndex())),
    },
    {
      id: 'refresh',
      disabled: !isReady || !capabilities?.refresh,
      run: () => execute('refresh', () => requireView().refresh()),
    },
  ];

  actions.push(
    ...captures.map(({ index }) => ({
      id: `capture-index-${index}`,
      run: () => setCaptureIndex(index),
    })),
  );

  if (mode === 'combined') {
    actions.push(
      {
        id: 'link-map',
        disabled: !isReady || !capabilities?.mapLink,
        run: () =>
          execute('link-map', async () => {
            await requireCombined().linkMap('map');
            setLinked(true);
          }),
      },
      {
        id: 'unlink-map',
        disabled: !isReady || !capabilities?.mapLink,
        run: () =>
          execute('unlink-map', async () => {
            await requireCombined().unlinkMap();
            setLinked(false);
          }),
      },
      {
        id: 'set-linked-true',
        disabled: !isReady || !capabilities?.mapLink,
        run: () => updateLinked(true),
      },
      {
        id: 'set-linked-false',
        disabled: !isReady || !capabilities?.mapLink,
        run: () => updateLinked(false),
      },
      {
        id: 'move-map-camera',
        disabled: !isMapReady,
        run: () =>
          execute('move-map-camera', () =>
            requireCombined().moveMapCamera(mapCamera, { duration: 500 }),
          ),
      },
      {
        id: 'get-map-camera',
        disabled: !isMapReady,
        run: () => execute('get-map-camera', () => requireCombined().getMapCamera()),
      },
      { id: 'layout-horizontal', run: () => setLayout('horizontal') },
      { id: 'layout-vertical', run: () => setLayout('vertical') },
      { id: 'map-fraction-35', run: () => setMapFraction(0.35) },
      { id: 'map-fraction-65', run: () => setMapFraction(0.65) },
    );
  }

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      <Text testID={'roadview-status'} numberOfLines={2} style={[styles.text, styles.status]}>
        {`${status}; host=${mode}; mounted=${isMounted}; visible=${visible}; logo=${showLogoPosition}; layout=${layout}; fraction=${mapFraction}; linked=${linked}`}
      </Text>
      <ScrollView testID={'roadview-actions'} style={styles.actions}>
        <View style={styles.wrap}>
          {actions.map(({ id, disabled, run }) => (
            <Pressable
              key={id}
              accessibilityRole={'button'}
              testID={`roadview-action-${id}`}
              disabled={disabled}
              onPress={run}
            >
              <Text style={[styles.text, styles.button, disabled && styles.disabled]}>{id}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <Text testID={'roadview-command'} numberOfLines={4} style={[styles.text, styles.command]}>
        {command}
      </Text>
      <Text testID={'roadview-result'} numberOfLines={5} style={[styles.text, styles.result]}>
        {actualResult}
      </Text>
      <Text testID={'roadview-event'} numberOfLines={3} style={[styles.text, styles.event]}>
        {event}
      </Text>
      {isInitialized && isMounted && mode === 'standalone' ? (
        <KakaoRoadView
          ref={standalone}
          testID={'roadview-standalone'}
          style={styles.roadView}
          initialRequest={roadViewRequests.coordinate}
          visible={visible}
          logo={showLogoPosition ? logoPosition : undefined}
          {...events}
        />
      ) : null}
      {isInitialized && isMounted && mode === 'combined' ? (
        <KakaoMapRoadView
          ref={combined}
          testID={'roadview-combined'}
          style={styles.roadView}
          initialRequest={roadViewRequests.coordinate}
          initialCamera={mapCamera}
          visible={visible}
          logo={showLogoPosition ? logoPosition : undefined}
          layout={layout}
          mapFraction={mapFraction}
          linked={linked}
          onMapReady={() => {
            if (renderedHostGeneration !== hostGeneration.current) {
              return;
            }

            setMapReady(true);
            if (failedHostGeneration.current !== renderedHostGeneration) {
              setStatus('map-ready; waiting for RoadView view creation');
            }

            recordEvent({ type: 'map-ready' });
          }}
          {...events}
        />
      ) : null}
    </View>
  );

  function roadViewEvents(generation: number) {
    return {
      onRoadViewReady: () => {
        if (generation !== hostGeneration.current) {
          return;
        }

        failedHostGeneration.current = null;
        setReady(true);
        setStatus('roadview-ready; no request result assumed');
        recordEvent({ type: 'roadview-ready' });
      },
      onError: (error: { code: string; message: string }) => {
        if (generation !== hostGeneration.current) {
          return;
        }

        failedHostGeneration.current = generation;
        setStatus(`sdk-error: ${error.code} ${error.message}`);
        setActualResult(`failure|sdk-error|${error.code}|${error.message}`);
        recordEvent({ type: 'sdk-error', ...error });
      },
      onRoadViewResult: (value: {
        panoramaId: string;
        coordinate: { latitude: number; longitude: number };
        date?: string;
        captures?: { index: number; date: string; address?: string }[];
      }) => {
        if (generation !== hostGeneration.current) {
          return;
        }

        setPanoramaId(value.panoramaId);
        setCaptures(value.captures ?? []);
        setCaptureIndex(value.captures?.[0]?.index);
        setActualResult(`actual-result|${JSON.stringify(value)}`);
        recordEvent({ type: 'actual-result', panoramaId: value.panoramaId });
      },
      onRoadViewNoResult: () => {
        if (generation !== hostGeneration.current) {
          return;
        }

        setActualResult('failure|no-result');
        setStatus('roadview-no-result');
        recordEvent({ type: 'no-result' });
      },
      onRoadViewRequestFailed: (error: { code: string; message: string }) => {
        if (generation !== hostGeneration.current) {
          return;
        }

        setActualResult(`failure|request|${error.code}|${error.message}`);
        setStatus(`request-failed: ${error.code}`);
        recordEvent({ type: 'request-failed', ...error });
      },
      onRoadViewUpdated: (value: object) => {
        if (generation === hostGeneration.current) {
          recordEvent({ type: 'updated', ...value });
        }
      },
      onRoadViewResized: (value: object) => {
        if (generation === hostGeneration.current) {
          recordEvent({ type: 'resized', ...value });
        }
      },
      onRoadViewClick: (value: object) => {
        if (generation === hostGeneration.current) {
          recordEvent({ type: 'click', ...value });
        }
      },
      onRoadViewFocusChanged: (value: object) => {
        if (generation === hostGeneration.current) {
          recordEvent({ type: 'focus', ...value });
        }
      },
    };
  }

  function request(id: string, value: RoadViewRequest) {
    execute(id, () => requireView().request(value));
  }

  function requireView(): KakaoRoadViewRef {
    const view = mode === 'combined' ? combined.current : standalone.current;
    if (!view) {
      throw new Error('The selected RoadView is not mounted.');
    }

    return view;
  }

  function requireCombined() {
    if (!combined.current) {
      throw new Error('The combined RoadView is not mounted.');
    }

    return combined.current;
  }

  function requireStaleView() {
    if (!staleView.current) {
      throw new Error('No stale RoadView ref has been captured.');
    }

    return staleView.current;
  }

  function requireCaptureIndex() {
    if (captureIndex === undefined) {
      throw new Error('No dated capture index is available.');
    }

    return captureIndex;
  }

  async function execute(id: string, action: () => Promise<unknown>) {
    const current = ++sequence.current;
    setCommand(`${current}|prepared|${id}`);
    try {
      const value = await action();
      setCommand(`${current}|dispatched|${id}|${JSON.stringify(value ?? null)}`);
    } catch (error) {
      setCommand(`${current}|rejected|${id}|${formatError(error)}`);
    }
  }

  async function switchHost(nextMode: HostMode) {
    if (nextMode === mode) {
      return;
    }

    captureStaleView();
    hostGeneration.current += 1;
    setMounted(false);
    resetReadiness();
    await nextFrame();
    setMode(nextMode);
    setMounted(true);
  }

  function unmount() {
    captureStaleView();
    hostGeneration.current += 1;
    setMounted(false);
    resetReadiness();
    setCommand(`${++sequence.current}|prepared|unmounted; stale ref captured`);
  }

  function remount() {
    setMounted(true);
    setCommand(`${++sequence.current}|prepared|remount`);
  }

  function captureStaleView() {
    const view = mode === 'combined' ? combined.current : standalone.current;
    if (view) {
      staleView.current = view;
    }
  }

  function resetReadiness() {
    setReady(false);
    setMapReady(false);
    setInfo(undefined);
    setPanoramaId('');
    setCaptures([]);
    setCaptureIndex(undefined);
    setActualResult('No SDK request result for this host');
    setStatus('host detached; waiting for remount');
  }

  function updateLinked(value: boolean) {
    execute(`set-linked-${value}`, async () => {
      await requireCombined().setLinked(value);
      setLinked(value);
    });
  }

  function recordEvent(value: object) {
    const id = ++sequence.current;
    eventHistory.current = [{ sequence: id, ...value }, ...eventHistory.current].slice(0, 12);
    setEvent(`${id}|${JSON.stringify(eventHistory.current)}`);
  }
}

function nextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function formatError(error: unknown) {
  const code = error instanceof Error && 'code' in error ? String(error.code) : 'unknown';

  return `${code}|${error instanceof Error ? error.message : String(error)}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'black' },
  text: { color: 'white', fontSize: 11, padding: 3 },
  status: { height: 38 },
  actions: { height: 180, flexGrow: 0 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  button: { backgroundColor: '#333333', padding: 7, margin: 2 },
  disabled: { color: '#777777', backgroundColor: '#1b1b1b' },
  command: { height: 62 },
  result: { height: 82 },
  event: { height: 50 },
  roadView: { flex: 1, minHeight: 180 },
});
