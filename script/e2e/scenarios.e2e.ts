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
    for (const menu of ['User', 'Share', 'Navi', 'Social', 'Channel', 'Cert']) {
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
    await expect(screen.getByTestId('navi-share-result', { visible: true })).toHaveText(
      falseResult,
    );
    await expect(screen.getByTestId(screenTitle)).toHaveText('Navi');
  });
});
