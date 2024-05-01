import { NativeModules, Platform } from 'react-native';

import type {
  KakaoCalendarTemplate,
  KakaoCommerceTemplate,
  KakaoFeedTemplate,
  KakaoListTemplate,
  KakaoLocationTemplate,
  KakaoTemplateButton,
  KakaoTemplateCommerce,
  KakaoTemplateContent,
  KakaoTemplateItemContent,
  KakaoTemplateItemInfo,
  KakaoTemplateLink,
  KakaoTemplateSocial,
  KakaoTextTemplate,
  Spec,
} from './spec/NativeKakaoShare';

export type {
  KakaoTemplateSocial,
  KakaoTextTemplate,
  KakaoTemplateLink,
  KakaoTemplateItemInfo,
  KakaoTemplateItemContent,
  KakaoTemplateContent,
  KakaoTemplateCommerce,
  KakaoTemplateButton,
  KakaoLocationTemplate,
  KakaoListTemplate,
  KakaoFeedTemplate,
  KakaoCommerceTemplate,
};

const LINKING_ERROR =
  "The package '@react-native-kakao/share' doesn't seem to be linked. Make sure: \n\n" +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

// @ts-expect-error
const isTurboModuleEnabled = global.__turboModuleProxy != null;

const Module = isTurboModuleEnabled
  ? require('./spec/NativeKakaoShare').default
  : NativeModules.RNCKakaoShare;

const Native: Spec = Module
  ? Module
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      },
    );

const SendTypes = { share: 'share', sendMe: 'send-me', sendFriend: 'send-friend' };
const TemplateTypes = {
  custom: 'custom',
  feed: 'feed',
  list: 'list',
  location: 'location',
  commerce: 'commerce',
  text: 'text',
  calendar: 'calendar',
};

export function shareCustomTemplate({
  templateId,
  useWebBrowserIfKakaoTalkNotAvailable = true,
  serverCallbackArgs = {},
  templateArgs = {},
}: {
  templateId: number;
  useWebBrowserIfKakaoTalkNotAvailable?: boolean;
  templateArgs?: Record<string, string>;
  serverCallbackArgs?: Record<string, string>;
}) {
  return Native.shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.share,
    TemplateTypes.custom,
    templateId,
    {},
    [],
    useWebBrowserIfKakaoTalkNotAvailable,
    templateArgs,
    serverCallbackArgs,
  );
}

export function sendCustomTemplateToMe({
  templateId,
  templateArgs = {},
}: {
  templateId: number;
  templateArgs?: Record<string, string>;
}) {
  return Native.shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.sendMe,
    TemplateTypes.custom,
    templateId,
    {},
    [],
    false,
    templateArgs,
    {},
  );
}

export function sendCustomTemplateToFriends({
  templateId,
  templateArgs = {},
  receiverUuids,
}: {
  templateId: number;
  templateArgs?: Record<string, string>;
  receiverUuids: string[];
}): Promise<string[]> {
  return Native.shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.sendFriend,
    TemplateTypes.custom,
    templateId,
    {},
    receiverUuids,
    false,
    templateArgs,
    {},
  );
}

export function shareFeedTemplate({
  template,
  useWebBrowserIfKakaoTalkNotAvailable = true,
  serverCallbackArgs = {},
}: {
  template: KakaoFeedTemplate;
  useWebBrowserIfKakaoTalkNotAvailable?: boolean;
  serverCallbackArgs?: Record<string, string>;
}) {
  return Native.shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.share,
    TemplateTypes.feed,
    -1,
    template,
    [],
    useWebBrowserIfKakaoTalkNotAvailable,
    {},
    serverCallbackArgs,
  );
}

export function sendFeedTemplateToMe({ template }: { template: KakaoFeedTemplate }) {
  return Native.shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.sendMe,
    TemplateTypes.feed,
    -1,
    template,
    [],
    false,
    {},
    {},
  );
}

export function sendFeedTemplateToFriends({
  template,
  receiverUuids,
}: {
  template: KakaoFeedTemplate;
  receiverUuids: string[];
}): Promise<string[]> {
  return Native.shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.sendFriend,
    TemplateTypes.feed,
    -1,
    template,
    receiverUuids,
    false,
    {},
    {},
  );
}

export function shareListTemplate({
  template,
  useWebBrowserIfKakaoTalkNotAvailable = true,
  serverCallbackArgs = {},
}: {
  template: KakaoListTemplate;
  useWebBrowserIfKakaoTalkNotAvailable?: boolean;
  serverCallbackArgs?: Record<string, string>;
}) {
  return Native.shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.share,
    TemplateTypes.list,
    -1,
    template,
    [],
    useWebBrowserIfKakaoTalkNotAvailable,
    {},
    serverCallbackArgs,
  );
}

export function sendListTemplateToMe({ template }: { template: KakaoListTemplate }) {
  return Native.shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.sendMe,
    TemplateTypes.list,
    -1,
    template,
    [],
    false,
    {},
    {},
  );
}

export function sendListTemplateToFriends({
  template,
  receiverUuids,
}: {
  template: KakaoListTemplate;
  receiverUuids: string[];
}): Promise<string[]> {
  return Native.shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.sendFriend,
    TemplateTypes.list,
    -1,
    template,
    receiverUuids,
    false,
    {},
    {},
  );
}

export function shareLocationTemplate({
  template,
  useWebBrowserIfKakaoTalkNotAvailable = true,
  serverCallbackArgs = {},
}: {
  template: KakaoLocationTemplate;
  useWebBrowserIfKakaoTalkNotAvailable?: boolean;
  serverCallbackArgs?: Record<string, string>;
}) {
  return Native.shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.share,
    TemplateTypes.location,
    -1,
    template,
    [],
    useWebBrowserIfKakaoTalkNotAvailable,
    {},
    serverCallbackArgs,
  );
}

export function sendLocationTemplateToMe({ template }: { template: KakaoLocationTemplate }) {
  return Native.shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.sendMe,
    TemplateTypes.location,
    -1,
    template,
    [],
    false,
    {},
    {},
  );
}

export function sendLocationTemplateToFriends({
  template,
  receiverUuids,
}: {
  template: KakaoLocationTemplate;
  receiverUuids: string[];
}): Promise<string[]> {
  return Native.shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.sendFriend,
    TemplateTypes.location,
    -1,
    template,
    receiverUuids,
    false,
    {},
    {},
  );
}

export function shareCommerceTemplate({
  template,
  useWebBrowserIfKakaoTalkNotAvailable = true,
  serverCallbackArgs = {},
}: {
  template: KakaoCommerceTemplate;
  useWebBrowserIfKakaoTalkNotAvailable?: boolean;
  serverCallbackArgs?: Record<string, string>;
}) {
  return Native.shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.share,
    TemplateTypes.commerce,
    -1,
    template,
    [],
    useWebBrowserIfKakaoTalkNotAvailable,
    {},
    serverCallbackArgs,
  );
}

export function sendCommerceTemplateToMe({ template }: { template: KakaoCommerceTemplate }) {
  return Native.shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.sendMe,
    TemplateTypes.commerce,
    -1,
    template,
    [],
    false,
    {},
    {},
  );
}

export function sendCommerceTemplateToFriends({
  template,
  receiverUuids,
}: {
  template: KakaoCommerceTemplate;
  receiverUuids: string[];
}): Promise<string[]> {
  return Native.shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.sendFriend,
    TemplateTypes.commerce,
    -1,
    template,
    receiverUuids,
    false,
    {},
    {},
  );
}

export function shareTextTemplate({
  template,
  useWebBrowserIfKakaoTalkNotAvailable = true,
  serverCallbackArgs = {},
}: {
  template: KakaoTextTemplate;
  useWebBrowserIfKakaoTalkNotAvailable?: boolean;
  serverCallbackArgs?: Record<string, string>;
}) {
  return Native.shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.share,
    TemplateTypes.text,
    -1,
    template,
    [],
    useWebBrowserIfKakaoTalkNotAvailable,
    {},
    serverCallbackArgs,
  );
}

export function sendTextTemplateToMe({ template }: { template: KakaoTextTemplate }) {
  return Native.shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.sendMe,
    TemplateTypes.text,
    -1,
    template,
    [],
    false,
    {},
    {},
  );
}

export function sendTextTemplateToFriends({
  template,
  receiverUuids,
}: {
  template: KakaoTextTemplate;
  receiverUuids: string[];
}): Promise<string[]> {
  return Native.shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.sendFriend,
    TemplateTypes.text,
    -1,
    template,
    receiverUuids,
    false,
    {},
    {},
  );
}

export function shareCalendarTemplate({
  template,
  useWebBrowserIfKakaoTalkNotAvailable = true,
  serverCallbackArgs = {},
}: {
  template: KakaoCalendarTemplate;
  useWebBrowserIfKakaoTalkNotAvailable?: boolean;
  serverCallbackArgs?: Record<string, string>;
}) {
  return Native.shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.share,
    TemplateTypes.calendar,
    -1,
    template,
    [],
    useWebBrowserIfKakaoTalkNotAvailable,
    {},
    serverCallbackArgs,
  );
}

export function sendCalendarTemplateToMe({ template }: { template: KakaoCalendarTemplate }) {
  return Native.shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.sendMe,
    TemplateTypes.calendar,
    -1,
    template,
    [],
    false,
    {},
    {},
  );
}

export function sendCalendarTemplateToFriends({
  template,
  receiverUuids,
}: {
  template: KakaoCalendarTemplate;
  receiverUuids: string[];
}): Promise<string[]> {
  return Native.shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.sendFriend,
    TemplateTypes.calendar,
    -1,
    template,
    receiverUuids,
    false,
    {},
    {},
  );
}

const KakaoShare = {
  shareCustomTemplate,
  sendCustomTemplateToMe,
  sendCustomTemplateToFriends,
  shareFeedTemplate,
  sendFeedTemplateToMe,
  sendFeedTemplateToFriends,
  shareListTemplate,
  sendListTemplateToMe,
  sendListTemplateToFriends,
  shareLocationTemplate,
  sendLocationTemplateToMe,
  sendLocationTemplateToFriends,
  shareCommerceTemplate,
  sendCommerceTemplateToMe,
  sendCommerceTemplateToFriends,
  shareTextTemplate,
  sendTextTemplateToMe,
  sendTextTemplateToFriends,
  shareCalendarTemplate,
  sendCalendarTemplateToMe,
  sendCalendarTemplateToFriends,
};
export default KakaoShare;
