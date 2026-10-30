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

describe('navigation', () => {
  test('menus', async ({ app, screen }) => {
    for (const menu of ['User', 'Share', 'Navi', 'Social', 'Channel']) {
      await openMenu(screen, menu);

      await app.back();
      await expect(screen.getByTestId(screenTitle)).toHaveText('Index');
    }
  });
});

describe('@react-native-kakao/user', () => {
  test('talk availability', async ({ screen }) => {
    await openMenu(screen, 'User');
    await (await findVisible(screen, 'talk-available-button')).tap();
    await expect(await findVisible(screen, 'talk-available-result')).toHaveText(falseResult);
  });

  test('signed out', async ({ screen }) => {
    await openMenu(screen, 'User');
    await (await findVisible(screen, 'login-state-button')).tap();
    await expect(await findVisible(screen, 'login-state-result')).toHaveText(falseResult);
  });

  test('user token error', async ({ screen }) => {
    await openMenu(screen, 'User');
    await (await findVisible(screen, 'user-profile-button')).tap();
    await expect(await findVisible(screen, 'user-profile-result')).toHaveText(tokenError);
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
  test('channel add URL', async ({ screen }) => {
    await openMenu(screen, 'Channel');
    await (await findVisible(screen, 'channel-add-url-button')).tap();
    await expect(await findVisible(screen, 'channel-add-url-result')).toHaveText(
      /^success: "https:\/\/pf\.kakao\.com\/_hJhxbj\/friend(?:\?[^"\s]*)?"$/,
    );
  });

  test('channel chat URL', async ({ screen }) => {
    await openMenu(screen, 'Channel');
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
    const seoulCamera = [37.5665, 126.978, 16, 0, 0];
    const rotatedCamera = [37.402001, 127.108678, 15, 30, 90];
    const busanCamera = [35.1796, 129.0756, 15, 0, 0];
    const cameraId = 'map-camera';
    const resultId = 'map-result';
    const statusId = 'map-status';
    const expectCamera = async (screen: Screen, expected: number[]) => {
      const tolerances = [0.0001, 0.0001, 0.01, 0.1, 0.1];
      await expect
        .poll(
          async () => {
            const text = await screen.getByTestId(cameraId).textContent();
            const actual = text?.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];

            return expected.map(
              (value, index) => Math.abs((actual[index] ?? Infinity) - value) < tolerances[index]!,
            );
          },
          {
            message: `Camera must match ${expected.join(', ')} within coordinate/angle tolerances.`,
          },
        )
        .toEqual([true, true, true, true, true]);
    };

    test('camera props, commands, events, and lifecycle', async ({ app, device, screen }) => {
      await openMenu(screen, 'Map');
      await expect(screen.getByTestId(statusId)).toHaveText('ready');
      await expectCamera(screen, seoulCamera);
      await screen.getByTestId('map-move').tap();
      await expect(screen.getByTestId('map-event')).toHaveText('idle: developer');
      await expectCamera(screen, rotatedCamera);
      for (const action of ['same', 'initial', 'remove']) {
        await screen.getByTestId(`map-${action}`).tap();
        await screen.getByTestId('map-get').tap();
        await expectCamera(screen, rotatedCamera);
      }

      await screen.getByTestId('map-prop').tap();
      await expectCamera(screen, busanCamera);
      await screen.getByTestId('kakao-map').swipe({ direction: 'up' });
      await expect(screen.getByTestId('map-event')).toHaveText('idle: gesture');
      await screen.getByTestId('map-get').tap();

      const afterGesture = await screen.getByTestId(cameraId).textContent();
      await screen.getByTestId('map-same').tap();
      await screen.getByTestId('map-get').tap();
      await expect(screen.getByTestId(cameraId)).toHaveText(afterGesture!);
      await screen.getByTestId('kakao-map').tap();
      await expect(screen.getByTestId('map-event')).toHaveText(/^click: /);
      await device.home();
      await device.openApp('com.rnkakao.example');
      await screen.getByTestId('map-get').tap();
      await expect(screen.getByTestId(cameraId)).toHaveText(afterGesture!);
      await screen.getByTestId('map-remount').tap();
      await expect(screen.getByTestId(statusId)).toHaveText('ready');
      await screen.getByTestId('map-get').tap();
      await expectCamera(screen, busanCamera);
      await app.back();
      await openMenu(screen, 'Map');
      await expect(screen.getByTestId(statusId)).toHaveText('ready');
      await expectCamera(screen, seoulCamera);
    });

    test('camera query during animation', async ({ screen }) => {
      await openMenu(screen, 'Map');
      await expect(screen.getByTestId(statusId)).toHaveText('ready');
      await screen.getByTestId('map-sample').tap();
      await expect(screen.getByTestId(resultId)).toHaveText(/^sample: /);

      const text = await screen.getByTestId(resultId).textContent();
      const [latitude, rotation] = text!.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
      expect(latitude).toBeGreaterThan(rotatedCamera[0]! + 0.0001);
      expect(latitude).toBeLessThan(seoulCamera[0]! - 0.0001);
      expect(rotation).toBeGreaterThan(0);
      expect(rotation).toBeLessThan(rotatedCamera[4]!);
      await expectCamera(screen, rotatedCamera);
    });

    test('initialization and view errors', async ({ screen }) => {
      await openMenu(screen, 'Map');
      await expect(screen.getByTestId(statusId)).toHaveText('ready');
      await screen.getByTestId('map-same-key').tap();
      await expect(screen.getByTestId(resultId)).toHaveText('success');
      await screen.getByTestId('map-other-key').tap();
      await expect(screen.getByTestId(resultId)).toHaveText(
        'error: ERR_KAKAO_MAP_ALREADY_INITIALIZED',
      );
      await screen.getByTestId('map-invalid').tap();
      await expect(screen.getByTestId(resultId)).toHaveText(
        'error: ERR_KAKAO_MAP_INVALID_ARGUMENT',
      );
      await screen.getByTestId('map-defer').tap();
      await screen.getByTestId('map-get').tap();
      await expect(screen.getByTestId(resultId)).toHaveText('error: ERR_KAKAO_MAP_NOT_READY');
      await screen.getByTestId('map-prop').tap();
      await screen.getByTestId('map-show').tap();
      await expect(screen.getByTestId(statusId)).toHaveText('ready');
      await expectCamera(screen, busanCamera);
      await screen.getByTestId('map-unmount').tap();
      await screen.getByTestId('map-destroyed').tap();
      await expect(screen.getByTestId(resultId)).toHaveText('error: ERR_KAKAO_MAP_VIEW_DESTROYED');
    });
  });
}
