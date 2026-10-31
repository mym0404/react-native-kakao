import { describe, test } from '@e2e-dev/mobile';
import { expect, type Screen } from 'e2e';

const screenTitle = 'screen-title';
const falseResult = 'success: false';
const tokenError = 'error: TokenNotFound';
let isInstalled = false;

const findVisible = async (screen: Screen, id: string) => {
  const target = screen.getByTestId(id, { visible: true });
  for (let attempt = 0; attempt < 10; attempt++) {
    if (await target.isVisible()) {
      return target;
    }

    await screen.swipe({ direction: 'down' });
  }

  await expect(target).toBeVisible();

  return target;
};

const openMenu = async (screen: Screen, menu: string) => {
  await (await findVisible(screen, `menu-${menu.toLowerCase()}`)).tap();
  await expect(screen.getByTestId(screenTitle)).toHaveText(menu);
};

test.beforeEach(async ({ app, device, screen }) => {
  if (!isInstalled) {
    await device.installApp();
    isInstalled = true;
  }

  await app.open();
  await expect(screen.getByTestId(screenTitle)).toHaveText('Index');
});

describe('@react-native-kakao/share', () => {
  test('screen loads', async ({ screen }) => {
    await openMenu(screen, 'Share');
  });
});

describe('@react-native-kakao/user', () => {
  test('signed-out APIs', async ({ screen }) => {
    await openMenu(screen, 'User');
    for (const [action, expected] of [
      ['talk-available', falseResult],
      ['login-state', falseResult],
      ['user-profile', tokenError],
    ] as const) {
      await (await findVisible(screen, `${action}-button`)).tap();
      await expect(await findVisible(screen, `${action}-result`)).toHaveText(expected);
    }
  });
});

describe('@react-native-kakao/social', () => {
  test('social token error', async ({ screen }) => {
    await openMenu(screen, 'Social');
    await (await findVisible(screen, 'talk-profile-button')).tap();
    await expect(await findVisible(screen, 'talk-profile-result')).toHaveText(tokenError);
  });
});

describe('@react-native-kakao/channel', () => {
  test('channel URLs', async ({ screen }) => {
    await openMenu(screen, 'Channel');
    await (await findVisible(screen, 'channel-add-url-button')).tap();
    await expect(await findVisible(screen, 'channel-add-url-result')).toHaveText(
      /^success: "https:\/\/pf\.kakao\.com\/_hJhxbj\/friend(?:\?[^"\s]*)?"$/,
    );

    await (await findVisible(screen, 'channel-chat-url-button')).tap();
    await expect(await findVisible(screen, 'channel-chat-url-result')).toHaveText(
      /^success: "https:\/\/pf\.kakao\.com\/_hJhxbj\/chat(?:\?[^"\s]*)?"$/,
    );
  });
});

describe('@react-native-kakao/navi', () => {
  test('navi unavailable', async ({ screen }) => {
    await openMenu(screen, 'Navi');
    await (await findVisible(screen, 'navi-share-button')).tap();
    await expect(screen.getByTestId('navi-share-result')).toHaveText(falseResult);
    await expect(screen.getByTestId(screenTitle)).toHaveText('Navi');
  });
});

if (process.env.KAKAO_E2E_SKIP_MAP !== '1') {
  describe('@react-native-kakao/map', () => {
    const seoul = [37.5665, 126.978, 16, 0, 0];
    const resultId = 'map-result';
    const eventId = 'map-event';
    const mapId = 'kakao-map';
    const coordinateTolerance = 0.0001;
    const angleTolerance = 0.1;
    const developerIdle = /^\d+\|idle: developer$/;

    const openMap = async (screen: Screen) => {
      await openMenu(screen, 'Map');
      await expect(screen.getByTestId('map-status')).toHaveText('ready');
      await expect(screen.getByTestId(mapId)).toBeVisible();
    };

    const command = async (screen: Screen, action: string) => {
      const result = screen.getByTestId(resultId);
      const before = await result.textContent();
      await screen.getByTestId(`map-${action}`).tap();
      await expect(result).not.toHaveText(before!);

      const text = await result.textContent();
      expect(text).toMatch(/^\d+\|/);

      return text!.slice(text!.indexOf('|') + 1);
    };

    const camera = async (screen: Screen) => {
      const result = await command(screen, 'get');
      expect(result).toMatch(/^camera: /);

      const values = result.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
      expect(values).toHaveLength(5);

      return values;
    };

    const expectCamera = (actual: number[], expected: number[]) => {
      const tolerances = [
        coordinateTolerance,
        coordinateTolerance,
        0.01,
        angleTolerance,
        angleTolerance,
      ];

      for (const [index, value] of expected.entries()) {
        expect(Math.abs(actual[index]! - value)).toBeLessThan(tolerances[index]!);
      }
    };

    test('camera commands and props', async ({ screen }) => {
      await openMap(screen);
      expectCamera(await camera(screen), seoul);

      const event = screen.getByTestId(eventId);
      const beforeMove = await event.textContent();
      expect(await command(screen, 'move')).toBe('success');
      await expect(event).not.toHaveText(beforeMove!);
      await expect(event).toHaveText(developerIdle);
      expectCamera(await camera(screen), [37.402001, 127.108678, 15, 30, 90]);

      const beforeProp = await event.textContent();
      await screen.getByTestId('map-prop').tap();
      await expect(event).not.toHaveText(beforeProp!);
      await expect(event).toHaveText(developerIdle);
      expectCamera(await camera(screen), [35.1796, 129.0756, 15, 0, 0]);
    });

    test('gestures, background recovery, and navigation re-entry', async ({
      app,
      device,
      screen,
    }) => {
      await openMap(screen);

      const event = screen.getByTestId(eventId);
      const beforeGesture = await event.textContent();
      await screen.getByTestId(mapId).swipe({ direction: 'up' });
      await expect(event).not.toHaveText(beforeGesture!);
      await expect(event).toHaveText(/^\d+\|idle: gesture$/);

      const afterGesture = await camera(screen);
      expect(Math.abs(afterGesture[0]! - seoul[0]!)).toBeGreaterThan(coordinateTolerance);
      await device.home();
      await device.openApp('com.rnkakao.example');
      expectCamera(await camera(screen), afterGesture);
      await screen.getByTestId(mapId).tap();
      await expect(event).toHaveText(/^\d+\|click: /);
      await app.back();
      await expect(screen.getByTestId(screenTitle)).toHaveText('Index');
      await openMap(screen);
      expectCamera(await camera(screen), seoul);
    });
  });
}
