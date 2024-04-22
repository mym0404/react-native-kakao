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

export function shareCustom({
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
  return Native.shareCustom(
    templateId,
    useWebBrowserIfKakaoTalkNotAvailable,
    templateArgs,
    serverCallbackArgs,
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
  return Native.shareFeedTemplate(
    template,
    useWebBrowserIfKakaoTalkNotAvailable,
    serverCallbackArgs,
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
  return Native.shareListTemplate(
    template,
    useWebBrowserIfKakaoTalkNotAvailable,
    serverCallbackArgs,
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
  return Native.shareLocationTemplate(
    template,
    useWebBrowserIfKakaoTalkNotAvailable,
    serverCallbackArgs,
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
  return Native.shareCommerceTemplate(
    template,
    useWebBrowserIfKakaoTalkNotAvailable,
    serverCallbackArgs,
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
  return Native.shareTextTemplate(
    template,
    useWebBrowserIfKakaoTalkNotAvailable,
    serverCallbackArgs,
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
  return Native.shareCalendarTemplate(
    template,
    useWebBrowserIfKakaoTalkNotAvailable,
    serverCallbackArgs,
  );
}
