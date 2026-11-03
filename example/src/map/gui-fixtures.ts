import { Image, Platform } from 'react-native';

import type { MapImageSource } from '../../../packages/map/src/types-assets';
import type { MapGuiScene } from '../../../packages/map/src/types-gui';

const PANGYO = { latitude: 37.3947, longitude: 127.1112 } as const;
const PANGYO_EAST = { latitude: 37.3947, longitude: 127.1132 } as const;
const solidMagentaPngUri =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z/D/PwAG/gL+DHWJ3gAAAABJRU5ErkJggg==';

const bundledIcon =
  Platform.OS === 'web' ? { uri: '' } : Image.resolveAssetSource(require('../../assets/icon.png'))!;

export const guiFixtureImage: MapImageSource = {
  uri: bundledIcon.uri,
  width: 32,
  height: 32,
};

export const guiPixelBoxImage: MapImageSource = {
  uri: solidMagentaPngUri,
  width: 32,
  height: 32,
};

const guiPressedImage: MapImageSource = {
  ...guiPixelBoxImage,
  uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQI12Owbvr2HwAFYgKzZOe4JQAAAABJRU5ErkJggg==',
};

const guiOpaqueBodyImage: MapImageSource = {
  ...guiFixtureImage,
  width: 64,
  height: 48,
};

export const guiFixtureScenes = {
  common: {
    infoWindows: [
      {
        id: 'fixture-info-window',
        position: PANGYO,
        body: {
          type: 'layout',
          id: 'fixture-info-layout',
          orientation: 'horizontal',
          padding: { top: 8, right: 10, bottom: 8, left: 10 },
          android: {
            background: {
              type: 'image',
              id: 'fixture-info-background',
              source: guiFixtureImage,
              stretch: { top: 6, right: 6, bottom: 6, left: 6 },
            },
          },
          ios: { backgroundColor: '#FFFFFFFF', splitLine: { color: '#D1D5DBFF', width: 1 } },
          children: [
            { type: 'image', id: 'fixture-info-icon', source: guiFixtureImage },
            {
              type: 'text',
              id: 'fixture-info-text',
              text: 'Kakao Map',
              textSize: 14,
              color: '#111827FF',
              stroke: { color: '#FFFFFFFF', width: 1 },
            },
          ],
        },
        tail: {
          type: 'image',
          id: 'fixture-info-tail',
          source: guiFixtureImage,
          size: { width: 12, height: 8 },
        },
        bodyOffset: { x: 0, y: -4 },
        tailOffset: { x: 0, y: 0 },
        zIndex: 10,
        visible: true,
        autoMove: { enabled: false },
      },
    ],
    widgets: [
      {
        id: 'fixture-widget',
        position: { gravity: 'topRight', x: 16, y: 16 },
        rotation: 15,
        zIndex: 12,
        visible: true,
        ios: { backgroundColor: '#111827DD', splitLine: { color: '#FFFFFFFF', width: 1 } },
        root: {
          type: 'layout',
          id: 'fixture-widget-layout',
          orientation: 'vertical',
          padding: { top: 8, right: 8, bottom: 8, left: 8 },
          children: [
            { type: 'image', id: 'fixture-widget-icon', source: guiFixtureImage },
            {
              type: 'text',
              id: 'fixture-widget-text',
              text: 'Widget',
              textSize: 12,
              color: '#FFFFFFFF',
            },
          ],
        },
      },
    ],
  },
  androidClicks: {
    infoWindows: [
      {
        id: 'fixture-android-click-info',
        position: PANGYO,
        body: {
          type: 'text',
          id: 'fixture-android-click-text',
          text: 'Tap',
          textSize: 14,
          color: '#111827FF',
          clickable: true,
        },
      },
    ],
  },
  iosComponentsAndAnimation: {
    infoWindows: [
      {
        id: 'fixture-ios-info',
        position: PANGYO,
        body: {
          type: 'button',
          platform: 'ios',
          id: 'fixture-ios-button',
          source: guiPixelBoxImage,
          pressedSource: guiPressedImage,
          child: {
            type: 'animatedImage',
            platform: 'ios',
            id: 'fixture-ios-animated-image',
            sources: [guiPixelBoxImage, guiPressedImage],
            size: { width: 16, height: 16 },
            duration: 400,
            repeat: 0,
            autoStart: true,
          },
        },
      },
    ],
    animations: [
      {
        id: 'fixture-info-drop',
        platform: 'ios',
        infoWindowIds: ['fixture-ios-info'],
        duration: 500,
        pixelHeight: 48,
        interpolation: 'cubicOut',
        repeat: 2,
      },
    ],
  },
  iosButtonWidget: {
    widgets: [
      {
        id: 'fixture-ios-button-widget',
        position: { gravity: 'topLeft', x: 16, y: 16 },
        root: {
          type: 'layout',
          id: 'fixture-ios-widget-button-layout',
          orientation: 'horizontal',
          children: [
            {
              type: 'button',
              platform: 'ios',
              id: 'fixture-ios-widget-button',
              source: guiPixelBoxImage,
              pressedSource: guiPressedImage,
            },
          ],
        },
      },
    ],
  },
  iosOfficialButtonInfo: {
    infoWindows: [
      {
        id: 'fixture-ios-official-button-info',
        position: PANGYO,
        body: {
          type: 'image',
          id: 'fixture-ios-official-button-body',
          source: guiOpaqueBodyImage,
          child: {
            type: 'button',
            platform: 'ios',
            id: 'fixture-ios-official-button',
            source: guiPixelBoxImage,
            pressedSource: guiPressedImage,
          },
        },
      },
    ],
  },
  pixelBox32: {
    infoWindows: [
      {
        id: 'fixture-gui-pixel-box-info',
        position: PANGYO,
        zIndex: 100,
        body: {
          type: 'image',
          id: 'fixture-gui-pixel-box-image',
          source: guiPixelBoxImage,
          size: { width: 32, height: 32 },
        },
      },
    ],
  },
} satisfies Record<string, MapGuiScene>;

export const guiFixtureActions = {
  applyCommon: { type: 'apply', scene: guiFixtureScenes.common },
  applyAndroidClicks: { type: 'apply', scene: guiFixtureScenes.androidClicks },
  applyIosComponentsAndAnimation: {
    type: 'apply',
    scene: guiFixtureScenes.iosComponentsAndAnimation,
  },
  applyPixelBox32: { type: 'apply', scene: guiFixtureScenes.pixelBox32 },
  showInfoWindow: {
    type: 'showInfoWindow',
    id: 'fixture-info-window',
    autoMove: true,
    duration: 400,
  },
  hideInfoWindow: { type: 'hideInfoWindow', id: 'fixture-info-window' },
  moveInfoWindow: {
    type: 'moveInfoWindow',
    id: 'fixture-info-window',
    position: PANGYO_EAST,
    duration: 500,
  },
  showWidget: { type: 'showWidget', id: 'fixture-widget' },
  hideWidget: { type: 'hideWidget', id: 'fixture-widget' },
  positionWidget: {
    type: 'positionWidget',
    id: 'fixture-widget',
    position: { gravity: 'bottomLeft', x: 20, y: 20 },
  },
  rotateWidget: { type: 'rotateWidget', id: 'fixture-widget', rotation: 90 },
  startAnimation: { type: 'startGuiAnimation', id: 'fixture-info-drop' },
  stopAnimation: { type: 'stopGuiAnimation', id: 'fixture-info-drop' },
  pauseAnimatedImage: {
    type: 'controlAnimatedImage',
    ownerType: 'infoWindow',
    ownerId: 'fixture-ios-info',
    componentId: 'fixture-ios-animated-image',
    action: 'pause',
  },
  status: { type: 'getGuiStatus' },
} as const;
