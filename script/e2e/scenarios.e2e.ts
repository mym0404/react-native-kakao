import { describe, type Device, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

const screenTitle = 'screen-title';
const falseResult = 'success: false';
const tokenError = 'error: TokenNotFound';
let isInstalled = false;

const findVisible = async (device: Device, id: string) => {
  const target = device.locator(`id=${id} visible=true`);
  // Android also exposes an outer ScrollView; the innermost one owns page content.
  const container = device.locator('role=ScrollView').last();
  const scrollOptions = { momentum: 'slow', timeout: 60000 } as const;

  try {
    await container.scrollUntilVisible(target, { ...scrollOptions, direction: 'down' });
  } catch (error) {
    if (
      error == null ||
      typeof error !== 'object' ||
      !('code' in error) ||
      error.code !== 'LOCATOR_NOT_FOUND'
    ) {
      throw error;
    }

    await container.scrollUntilVisible(target, { ...scrollOptions, direction: 'up' });
  }

  return target;
};

const openMenu = async (device: Device, menu: string) => {
  await (await findVisible(device, `menu-${menu.toLowerCase()}`)).tap();
  await expect(device.locator(`id=${screenTitle}`)).toHaveText(menu);
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
  test('menus', async ({ app, device, screen }) => {
    for (const menu of ['User', 'Share', 'Navi', 'Social', 'Channel', 'Cert']) {
      await openMenu(device, menu);

      await app.back();
      await expect(screen.getByTestId(screenTitle)).toHaveText('Index');
    }
  });
});

describe('@react-native-kakao/user', () => {
  test('talk availability', async ({ device }) => {
    await openMenu(device, 'User');
    await (await findVisible(device, 'talk-available-button')).tap();
    await expect(await findVisible(device, 'talk-available-result')).toHaveText(falseResult);
  });

  test('signed out', async ({ device }) => {
    await openMenu(device, 'User');
    await (await findVisible(device, 'login-state-button')).tap();
    await expect(await findVisible(device, 'login-state-result')).toHaveText(falseResult);
  });

  test('user token error', async ({ device }) => {
    await openMenu(device, 'User');
    await (await findVisible(device, 'user-profile-button')).tap();
    await expect(await findVisible(device, 'user-profile-result')).toHaveText(tokenError);
  });
});

describe('@react-native-kakao/social', () => {
  test('social token error', async ({ device }) => {
    await openMenu(device, 'Social');
    await (await findVisible(device, 'talk-profile-button')).tap();
    await expect(await findVisible(device, 'talk-profile-result')).toHaveText(tokenError);
  });
});

describe('@react-native-kakao/channel', () => {
  test('channel add URL', async ({ device }) => {
    await openMenu(device, 'Channel');
    await (await findVisible(device, 'channel-add-url-button')).tap();
    await expect(await findVisible(device, 'channel-add-url-result')).toHaveText(
      /^success: "https:\/\/pf\.kakao\.com\/_hJhxbj\/friend(?:\?[^"\s]*)?"$/,
    );
  });

  test('channel chat URL', async ({ device }) => {
    await openMenu(device, 'Channel');
    await (await findVisible(device, 'channel-chat-url-button')).tap();
    await expect(await findVisible(device, 'channel-chat-url-result')).toHaveText(
      /^success: "https:\/\/pf\.kakao\.com\/_hJhxbj\/chat(?:\?[^"\s]*)?"$/,
    );
  });
});

describe('@react-native-kakao/navi', () => {
  test('navi unavailable', async ({ device, screen }) => {
    await openMenu(device, 'Navi');
    await (await findVisible(device, 'navi-share-button')).tap();
    await expect(screen.getByTestId('navi-share-result')).toHaveText(falseResult);
    await expect(screen.getByTestId(screenTitle)).toHaveText('Navi');
  });
});
