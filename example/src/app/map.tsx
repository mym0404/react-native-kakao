import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  type CameraPosition,
  initializeKakaoMapSDK,
  KakaoMapView,
  type KakaoMapViewRef,
} from '@react-native-kakao/map';
import { Link } from 'expo-router';

import { kakaoNativeAppKey } from '../util/kakaoNativeAppKey';

const pangyo = { latitude: 37.402001, longitude: 127.108678, zoomLevel: 15 };
const seoul = { latitude: 37.5665, longitude: 126.978, zoomLevel: 16 };
const busan = { latitude: 35.1796, longitude: 129.0756, zoomLevel: 15 };
const rotatedCamera = { ...pangyo, tilt: 30, rotation: 90 };

export default function MapPage() {
  const map = useRef<KakaoMapViewRef>(null);
  const [isInitialized, setInitialized] = useState(false);
  const [camera, setCamera] = useState(seoul);
  const [status, setStatus] = useState('initializing');
  const [position, setPosition] = useState('');
  const [result, setResult] = useState('');
  const [event, setEvent] = useState('');
  const commandId = useRef(0);
  const eventId = useRef(0);
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
            const position = formatCamera(await map.current.getCamera());
            setPosition(position);

            return `camera: ${position}`;
          }

          throw new Error('The map is not mounted.');
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
    { id: 'prop', title: 'Change camera', run: () => setCamera(busan) },
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
        <Link href={'/map-features'} replace testID={'map-feature-lab'} style={styles.text}>
          {'Feature lab'}
        </Link>
        {actions.map(({ id, title, run }) => (
          <Pressable
            key={id}
            testID={`map-${id}`}
            accessibilityRole={'button'}
            onPress={run}
            disabled={status !== 'ready'}
            style={styles.button}
          >
            <Text style={styles.text}>{title}</Text>
          </Pressable>
        ))}
      </View>
      {isInitialized ? (
        <KakaoMapView
          ref={map}
          testID={'kakao-map'}
          style={styles.map}
          initialCamera={pangyo}
          camera={camera}
          onMapReady={() => setStatus('ready')}
          onError={(error) => setStatus(`error: ${error.code} ${error.message}`)}
          onCameraMoveStart={({ reason }) => recordEvent(`start: ${reason}`)}
          onCameraIdle={({ reason, camera }) => {
            recordEvent(`idle: ${reason}`);
            setPosition(formatCamera(camera));
          }}
          onMapClick={({ latitude, longitude }) =>
            recordEvent(`click: ${latitude.toFixed(5)},${longitude.toFixed(5)}`)
          }
        />
      ) : null}
    </View>
  );

  function formatCamera(camera: CameraPosition) {
    return `lat=${camera.latitude.toFixed(5)} lon=${camera.longitude.toFixed(5)} zoom=${camera.zoomLevel} tilt=${camera.tilt.toFixed(1)} rotation=${camera.rotation.toFixed(1)}`;
  }

  function recordEvent(value: string) {
    setEvent(`${++eventId.current}|${value}`);
  }

  async function execute(action: () => Promise<void | string>) {
    const id = ++commandId.current;
    try {
      const value = await action();
      setResult(`${id}|${value ?? 'success'}`);
    } catch (error) {
      const code = error instanceof Error && 'code' in error ? String(error.code) : 'unknown';
      setResult(`${id}|error: ${code}`);
    }
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'black' },
  text: { color: 'white', fontSize: 12, padding: 3 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, padding: 4 },
  button: { backgroundColor: '#333333', padding: 5, borderRadius: 4 },
  map: { flex: 1 },
});
