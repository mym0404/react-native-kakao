import type { AdvancedCameraCommand } from '@react-native-kakao/map';

export const CAMERA_FIXTURE_CENTER = { latitude: 37.402, longitude: 127.1086 } as const;
export const CAMERA_FIXTURE_POINTS = [
  { latitude: 37.399, longitude: 127.104 },
  { latitude: 37.405, longitude: 127.113 },
] as const;

export const CAMERA_FIXTURES = {
  capabilities: { type: 'getCapabilities' },
  state: { type: 'getState' },
  height: {
    type: 'moveToHeight',
    camera: { ...CAMERA_FIXTURE_CENTER, height: 1_500, rotation: 20, tilt: 25 },
    animation: { duration: 800, autoElevation: false, consecutive: false },
  },
  heightWithCompletion: {
    type: 'moveToHeight',
    camera: { ...CAMERA_FIXTURE_CENTER, height: 1_500, rotation: 20, tilt: 25 },
    animation: { duration: 800, autoElevation: false, consecutive: false },
    operationId: 'camera-height-1',
  },
  transform: {
    type: 'transform',
    delta: { latitude: 0.001, longitude: 0.001, height: -100, rotation: 15, tilt: 5 },
    animation: { duration: 600, consecutive: false },
    operationId: 'camera-transform-1',
  },
  fit: {
    type: 'fit',
    coordinates: [...CAMERA_FIXTURE_POINTS],
    levelLimit: 17,
    animation: { duration: 600, autoElevation: true, consecutive: false },
  },
  canShow: {
    type: 'canShow',
    coordinates: [...CAMERA_FIXTURE_POINTS],
    zoomLevel: 15,
  },
  heightAtLevel: { type: 'heightAtLevel', zoomLevel: 15 },
  resetOrientation: {
    type: 'resetOrientation',
    animation: { duration: 500, consecutive: false },
    operationId: 'camera-reset-1',
  },
  lockZoomReference: { type: 'setReferencePointLock', gesture: 'zoom', locked: true },
  unlockZoomReference: { type: 'setReferencePointLock', gesture: 'zoom', locked: false },
  backToNorth: { type: 'setBackToNorthDuringAutoElevation', enabled: true },
} satisfies Record<string, AdvancedCameraCommand>;
