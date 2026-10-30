import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  type CameraOptions,
  type CameraPosition,
  initializeKakaoMapSDK,
  KakaoMapView,
  type KakaoMapViewRef,
} from '@react-native-kakao/map';

import { kakaoNativeAppKey } from '../util/kakaoNativeAppKey';

const pangyo = { latitude: 37.402001, longitude: 127.108678, zoomLevel: 15 };
const seoul = { latitude: 37.5665, longitude: 126.978, zoomLevel: 16 };
const busan = { latitude: 35.1796, longitude: 129.0756, zoomLevel: 15 };
const rotatedCamera = { ...pangyo, tilt: 30, rotation: 90 };

export default function MapPage() {
  const map = useRef<KakaoMapViewRef>(null);
  const detachedMap = useRef<KakaoMapViewRef | null>(null);
  const [isInitialized, setInitialized] = useState(false);
  const [isMounted, setMounted] = useState(true);
  const [isDeferred, setDeferred] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [camera, setCamera] = useState<CameraOptions | undefined>(seoul);
  const [initialCamera, setInitialCamera] = useState(pangyo);
  const [status, setStatus] = useState('initializing');
  const [position, setPosition] = useState('');
  const [result, setResult] = useState('');
  const [event, setEvent] = useState('');
  const insets = useSafeAreaInsets();

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
          setStatus(error.message);
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

  const actions = [
    {
      id: 'get',
      title: 'Get camera',
      run: () =>
        execute(async () => {
          if (map.current) {
            showPosition(await map.current.getCamera());
          }
        }),
    },
    {
      id: 'move',
      title: 'Move / rotate',
      run: () =>
        execute(async () => {
          await map.current?.moveCamera(rotatedCamera, { duration: 500 });
        }),
    },
    {
      id: 'sample',
      title: 'Sample movement',
      run: () =>
        execute(async () => {
          const view = map.current;
          if (!view) {
            return;
          }

          await view.moveCamera(seoul);
          await view.moveCamera(rotatedCamera, { duration: 3000 });
          await new Promise((resolve) => setTimeout(resolve, 350));

          const position = await view.getCamera();

          return `sample: latitude=${position.latitude.toFixed(5)} rotation=${position.rotation.toFixed(1)}`;
        }),
    },
    { id: 'prop', title: 'Change camera', run: () => setCamera(busan) },
    {
      id: 'same',
      title: 'Same camera',
      run: () => setCamera((value) => (value ? { ...value } : value)),
    },
    { id: 'initial', title: 'Change initial', run: () => setInitialCamera(busan) },
    { id: 'remove', title: 'Remove camera', run: () => setCamera(undefined) },
    {
      id: 'remount',
      title: 'Remount',
      run: () => {
        setStatus('initializing');
        setMounted(true);
        setDeferred(false);
        setGeneration((value) => value + 1);
      },
    },
    {
      id: 'defer',
      title: 'Before ready',
      run: () => {
        setStatus('waiting for layout');
        setDeferred(true);
        setMounted(true);
        setGeneration((value) => value + 1);
      },
    },
    { id: 'show', title: 'Show map', run: () => setDeferred(false) },
    {
      id: 'unmount',
      title: 'Unmount',
      run: () => {
        detachedMap.current = map.current;
        setMounted(false);
        setStatus('unmounted');
      },
    },
    {
      id: 'destroyed',
      title: 'Old ref',
      run: () =>
        execute(async () => {
          await detachedMap.current?.getCamera();
        }),
    },
    {
      id: 'same-key',
      title: 'Same key',
      run: () => execute(() => initializeKakaoMapSDK(kakaoNativeAppKey)),
    },
    {
      id: 'other-key',
      title: 'Other key',
      run: () => execute(() => initializeKakaoMapSDK('different-key')),
    },
    {
      id: 'invalid',
      title: 'Invalid camera',
      run: () =>
        execute(async () => {
          await map.current?.moveCamera({ ...seoul, latitude: 100 });
        }),
    },
  ];

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      <Text testID={'map-status'} style={styles.text}>
        {status}
      </Text>
      <Text testID={'map-camera'} style={styles.text}>
        {position || 'No camera yet'}
      </Text>
      <Text testID={'map-result'} style={styles.text}>
        {result || 'No command yet'}
      </Text>
      <Text testID={'map-event'} style={styles.text}>
        {event || 'No event yet'}
      </Text>
      <View style={styles.actions}>
        {actions.map(({ id, title, run }) => (
          <Pressable
            key={id}
            testID={`map-${id}`}
            accessibilityRole={'button'}
            onPress={run}
            style={styles.button}
          >
            <Text style={styles.text}>{title}</Text>
          </Pressable>
        ))}
      </View>
      {isInitialized && isMounted ? (
        <KakaoMapView
          key={generation}
          ref={map}
          testID={'kakao-map'}
          style={isDeferred ? styles.deferred : styles.map}
          initialCamera={initialCamera}
          camera={camera}
          onMapReady={() => {
            setStatus('ready');
            execute(async () => {
              if (map.current) {
                showPosition(await map.current.getCamera());
              }
            });
          }}
          onError={(error) => setStatus(`error: ${error.code} ${error.message}`)}
          onCameraMoveStart={({ reason }) => setEvent(`start: ${reason}`)}
          onCameraIdle={({ reason, camera }) => {
            setEvent(`idle: ${reason}`);
            showPosition(camera);
          }}
          onMapClick={({ latitude, longitude, x, y }) =>
            setEvent(
              `click: ${latitude.toFixed(5)},${longitude.toFixed(5)} at ${x.toFixed(1)},${y.toFixed(1)}`,
            )
          }
        />
      ) : null}
    </View>
  );

  function showPosition(camera: CameraPosition) {
    setPosition(
      `lat=${camera.latitude.toFixed(5)} lon=${camera.longitude.toFixed(5)} zoom=${camera.zoomLevel} tilt=${camera.tilt.toFixed(1)} rotation=${camera.rotation.toFixed(1)}`,
    );
  }

  async function execute(action: () => Promise<void | string>) {
    try {
      const value = await action();
      setResult(value ?? 'success');
    } catch (error) {
      const code = error instanceof Error && 'code' in error ? String(error.code) : 'unknown';
      setResult(`error: ${code}`);
    }
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'black' },
  text: { color: 'white', fontSize: 12, padding: 3 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, padding: 4 },
  button: { backgroundColor: '#333333', padding: 5, borderRadius: 4 },
  map: { flex: 1 },
  deferred: { width: 0, height: 0 },
});
