import type { Double, UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';

import type {
  KakaoCalendarTemplate,
  KakaoCommerceTemplate,
  KakaoFeedTemplate,
  KakaoImageUploadResult,
  KakaoListTemplate,
  KakaoLocationTemplate,
  KakaoMessageSendResult,
  KakaoTemplateButton,
  KakaoTemplateCommerce,
  KakaoTemplateContent,
  KakaoTemplateItemContent,
  KakaoTemplateItemInfo,
  KakaoTemplateLink,
  KakaoTemplateSocial,
  KakaoTextTemplate,
} from './spec/NativeKakaoShare';
import Native from './spec/NativeKakaoShare';
import { swapMobileExecutionParamsFieldValueIntoStringInIOS } from './util/swapMobileExecutionParamsFieldValueIntoStringInIOS';

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
  KakaoMessageSendResult,
  KakaoListTemplate,
  KakaoFeedTemplate,
  KakaoCommerceTemplate,
  KakaoCalendarTemplate,
  KakaoImageUploadResult,
};

export function isKakaoTalkSharingAvailable(): Promise<boolean> {
  return Native.isKakaoTalkSharingAvailable();
}

function shareOrSendMeOrSendFriendOrWhatever(
  /* share, send-me, send-friend */
  sendType: string,
  /* custom, feed, list, location, commerce, text, calendar */
  templateType: string,
  /* only for custom */
  templateId: Double,
  /* only for default templates */
  templateJson: UnsafeObject,
  /* only for pass friend uuid directly */
  receiverUuids: ReadonlyArray<string>,
  useWebBrowserIfKakaoTalkNotAvailable: boolean,
  templateArgs: Readonly<{ [key: string]: string }>,
  serverCallbackArgs: Readonly<{ [key: string]: string }>,
  includeFailureInfo?: boolean,
): Promise<any> {
  const response = Native.shareOrSendMeOrSendFriendOrWhatever(
    sendType,
    templateType,
    templateId,
    swapMobileExecutionParamsFieldValueIntoStringInIOS(templateJson),
    receiverUuids,
    useWebBrowserIfKakaoTalkNotAvailable,
    templateArgs,
    serverCallbackArgs,
  );

  if (sendType === SendTypes.sendFriend) {
    return response.then((result: KakaoMessageSendResult) =>
      includeFailureInfo ? result : result.successfulReceiverUuids,
    );
  }

  return response;
}

export type KakaoFriendMessageResult<T extends boolean = false> = T extends true
  ? KakaoMessageSendResult
  : string[];

const SendTypes = { share: 'share', sendMe: 'send-me', sendFriend: 'send-friend' };
const TemplateTypes = {
  custom: 'custom',
  scrap: 'scrap',
  feed: 'feed',
  list: 'list',
  location: 'location',
  commerce: 'commerce',
  text: 'text',
  calendar: 'calendar',
};
const DefaultScrapTemplateId = -1;

export type KakaoScrapMessageParams = {
  requestUrl: string;
  templateId?: number;
  templateArgs?: Record<string, string>;
};

export async function sendScrapTemplateToMe({
  requestUrl,
  templateId = DefaultScrapTemplateId,
  templateArgs = {},
}: KakaoScrapMessageParams) {
  await Native.shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.sendMe,
    TemplateTypes.scrap,
    templateId,
    { requestUrl },
    [],
    false,
    templateArgs,
    {},
  );
}

export function sendScrapTemplateToFriends<T extends boolean = false>({
  requestUrl,
  templateId = DefaultScrapTemplateId,
  templateArgs = {},
  receiverUuids,
  includeFailureInfo,
}: KakaoScrapMessageParams & { receiverUuids: string[]; includeFailureInfo?: T }): Promise<
  KakaoFriendMessageResult<T>
> {
  return shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.sendFriend,
    TemplateTypes.scrap,
    templateId,
    { requestUrl },
    receiverUuids,
    false,
    templateArgs,
    {},
    includeFailureInfo,
  );
}

export function shareScrapTemplate({
  requestUrl,
  templateId,
  templateArgs = {},
  serverCallbackArgs = {},
  useWebBrowserIfKakaoTalkNotAvailable = true,
}: {
  requestUrl: string;
  templateId?: number;
  templateArgs?: Record<string, string>;
  serverCallbackArgs?: Record<string, string>;
  useWebBrowserIfKakaoTalkNotAvailable?: boolean;
}): Promise<void> {
  return Native.shareScrapTemplate(
    requestUrl,
    useWebBrowserIfKakaoTalkNotAvailable,
    templateId,
    templateArgs,
    serverCallbackArgs,
  );
}

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
  return shareOrSendMeOrSendFriendOrWhatever(
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
  return shareOrSendMeOrSendFriendOrWhatever(
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

export function sendCustomTemplateToFriends<T extends boolean = false>({
  templateId,
  templateArgs = {},
  receiverUuids,
  includeFailureInfo,
}: {
  templateId: number;
  templateArgs?: Record<string, string>;
  receiverUuids: string[];
  includeFailureInfo?: T;
}): Promise<KakaoFriendMessageResult<T>> {
  return shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.sendFriend,
    TemplateTypes.custom,
    templateId,
    {},
    receiverUuids,
    false,
    templateArgs,
    {},
    includeFailureInfo,
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
  return shareOrSendMeOrSendFriendOrWhatever(
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
  return shareOrSendMeOrSendFriendOrWhatever(
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

export function sendFeedTemplateToFriends<T extends boolean = false>({
  template,
  receiverUuids,
  includeFailureInfo,
}: {
  template: KakaoFeedTemplate;
  receiverUuids: string[];
  includeFailureInfo?: T;
}): Promise<KakaoFriendMessageResult<T>> {
  return shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.sendFriend,
    TemplateTypes.feed,
    -1,
    template,
    receiverUuids,
    false,
    {},
    {},
    includeFailureInfo,
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
  return shareOrSendMeOrSendFriendOrWhatever(
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
  return shareOrSendMeOrSendFriendOrWhatever(
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

export function sendListTemplateToFriends<T extends boolean = false>({
  template,
  receiverUuids,
  includeFailureInfo,
}: {
  template: KakaoListTemplate;
  receiverUuids: string[];
  includeFailureInfo?: T;
}): Promise<KakaoFriendMessageResult<T>> {
  return shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.sendFriend,
    TemplateTypes.list,
    -1,
    template,
    receiverUuids,
    false,
    {},
    {},
    includeFailureInfo,
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
  return shareOrSendMeOrSendFriendOrWhatever(
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
  return shareOrSendMeOrSendFriendOrWhatever(
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

export function sendLocationTemplateToFriends<T extends boolean = false>({
  template,
  receiverUuids,
  includeFailureInfo,
}: {
  template: KakaoLocationTemplate;
  receiverUuids: string[];
  includeFailureInfo?: T;
}): Promise<KakaoFriendMessageResult<T>> {
  return shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.sendFriend,
    TemplateTypes.location,
    -1,
    template,
    receiverUuids,
    false,
    {},
    {},
    includeFailureInfo,
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
  return shareOrSendMeOrSendFriendOrWhatever(
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
  return shareOrSendMeOrSendFriendOrWhatever(
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

export function sendCommerceTemplateToFriends<T extends boolean = false>({
  template,
  receiverUuids,
  includeFailureInfo,
}: {
  template: KakaoCommerceTemplate;
  receiverUuids: string[];
  includeFailureInfo?: T;
}): Promise<KakaoFriendMessageResult<T>> {
  return shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.sendFriend,
    TemplateTypes.commerce,
    -1,
    template,
    receiverUuids,
    false,
    {},
    {},
    includeFailureInfo,
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
  return shareOrSendMeOrSendFriendOrWhatever(
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
  return shareOrSendMeOrSendFriendOrWhatever(
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

export function sendTextTemplateToFriends<T extends boolean = false>({
  template,
  receiverUuids,
  includeFailureInfo,
}: {
  template: KakaoTextTemplate;
  receiverUuids: string[];
  includeFailureInfo?: T;
}): Promise<KakaoFriendMessageResult<T>> {
  return shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.sendFriend,
    TemplateTypes.text,
    -1,
    template,
    receiverUuids,
    false,
    {},
    {},
    includeFailureInfo,
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
  return shareOrSendMeOrSendFriendOrWhatever(
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
  return shareOrSendMeOrSendFriendOrWhatever(
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

export function sendCalendarTemplateToFriends<T extends boolean = false>({
  template,
  receiverUuids,
  includeFailureInfo,
}: {
  template: KakaoCalendarTemplate;
  receiverUuids: string[];
  includeFailureInfo?: T;
}): Promise<KakaoFriendMessageResult<T>> {
  return shareOrSendMeOrSendFriendOrWhatever(
    SendTypes.sendFriend,
    TemplateTypes.calendar,
    -1,
    template,
    receiverUuids,
    false,
    {},
    {},
    includeFailureInfo,
  );
}

export function uploadImage({
  imageUri,
  secureResource = true,
}: {
  imageUri: string;
  secureResource?: boolean;
}) {
  return Native.uploadImage(imageUri, secureResource);
}

export function scrapImage({
  imageUrl,
  secureResource = true,
}: {
  imageUrl: string;
  secureResource?: boolean;
}) {
  return Native.scrapImage(imageUrl, secureResource);
}

const KakaoShare = {
  isKakaoTalkSharingAvailable,
  uploadImage,
  shareScrapTemplate,
  sendScrapTemplateToMe,
  sendScrapTemplateToFriends,
  scrapImage,
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
export type KakaoShareAPI = typeof KakaoShare;
