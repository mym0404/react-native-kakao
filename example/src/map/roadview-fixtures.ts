import type { RoadViewRequest } from '@react-native-kakao/map';

export const roadViewCoordinate = {
  latitude: 37.402001,
  longitude: 127.108678,
} as const;

export const roadViewMarkerImage = {
  uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  width: 24,
  height: 24,
} as const;

export const roadViewRequests = {
  coordinate: { coordinate: roadViewCoordinate },
  customSearchRange: {
    coordinate: roadViewCoordinate,
    searchRange: { primary: 50, extended: 200 },
  },
  coordinateLookAt: {
    coordinate: roadViewCoordinate,
    lookAt: {
      type: 'coordinate',
      coordinate: { latitude: 37.40225, longitude: 127.1089 },
    },
  },
  orientationLookAt: {
    coordinate: roadViewCoordinate,
    lookAt: { type: 'orientation', pan: 45, tilt: 0 },
  },
  coordinateMarker: {
    coordinate: roadViewCoordinate,
    markers: [
      {
        type: 'coordinate',
        coordinate: { latitude: 37.40215, longitude: 127.1088 },
        image: roadViewMarkerImage,
      },
    ],
  },
  coordinateDirectionMarker: {
    coordinate: roadViewCoordinate,
    markers: [
      {
        type: 'coordinate',
        coordinate: { latitude: 37.40215, longitude: 127.1088 },
        directionAngle: 90,
      },
    ],
  },
  orientationMarker: {
    coordinate: roadViewCoordinate,
    markers: [
      {
        type: 'orientation',
        pan: 90,
        tilt: -5,
        image: roadViewMarkerImage,
      },
    ],
  },
} satisfies Record<string, RoadViewRequest>;

export function roadViewPanoramaRequest(panoramaId: string): RoadViewRequest {
  return { coordinate: roadViewCoordinate, panoramaId };
}

export const roadViewCapabilityActions = [
  { id: 'request-coordinate', platforms: ['android', 'ios'], request: roadViewRequests.coordinate },
  { id: 'request-panorama-id', platforms: ['android', 'ios'], input: 'panoramaIdFromResult' },
  {
    id: 'custom-search-range',
    platforms: ['android'],
    request: roadViewRequests.customSearchRange,
  },
  {
    id: 'coordinate-look-at',
    platforms: ['android', 'ios'],
    request: roadViewRequests.coordinateLookAt,
  },
  {
    id: 'orientation-look-at',
    platforms: ['android', 'ios'],
    request: roadViewRequests.orientationLookAt,
  },
  {
    id: 'coordinate-marker',
    platforms: ['android', 'ios'],
    request: roadViewRequests.coordinateMarker,
  },
  {
    id: 'coordinate-direction-marker',
    platforms: ['android'],
    request: roadViewRequests.coordinateDirectionMarker,
  },
  {
    id: 'orientation-marker',
    platforms: ['android', 'ios'],
    request: roadViewRequests.orientationMarker,
  },
  { id: 'request-next', platforms: ['android'], request: roadViewRequests.coordinate },
  { id: 'move-to-capture', platforms: ['android'], input: 'captureIndexFromResult' },
  { id: 'refresh', platforms: ['ios'] },
  { id: 'link-map', platforms: ['android', 'ios'], linked: true },
  { id: 'unlink-map', platforms: ['android', 'ios'], linked: false },
  {
    id: 'move-map-camera',
    platforms: ['android', 'ios'],
    camera: { ...roadViewCoordinate, zoomLevel: 17 },
  },
  { id: 'get-map-camera', platforms: ['android', 'ios'] },
  { id: 'get-roadview-info', platforms: ['android', 'ios'] },
] as const;

export const zoneCapabilityActions = [
  {
    id: 'set-zone-check-rect-scale',
    args: ['indoor', 17, { x: 1.5, y: 1.5 }],
  },
  {
    id: 'show-zone-detail',
    input: ['zoneTypeFromEnter', 'zoneIdFromEnter', 'detailIdFromEnter'],
  },
  {
    id: 'hide-zone-detail',
    input: ['zoneTypeFromEnter'],
  },
] as const;
