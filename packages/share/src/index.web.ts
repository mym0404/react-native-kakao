import {
  filterNonNullishKeys,
  replaceJsonValuesRecursively,
  snakeCaseObject,
} from '@mj-studio/js-util';
import { kRunWebAPI } from '@react-native-kakao/core';

import type { KakaoShareAPI } from './index';

declare const Kakao: {
  Share: {
    sendDefault: (args: any) => Promise<any>;
    sendCustom: (args: any) => Promise<any>;
  };
  API: { request: (args: any) => Promise<any> };
};

function createShareDefault({
  serverCallbackArgs,
  template,
  objectType,
}: {
  objectType: string;
  template: any;
  serverCallbackArgs?: Record<string, string>;
}) {
  return kRunWebAPI(() =>
    Kakao.Share.sendDefault(
      filterNonNullishKeys({
        objectType,
        ...serializeExecutionParams(template),
        serverCallbackArgs,
      }),
    ),
  );
}

function createSendDefaultMe({ template, objectType }: { objectType: string; template: any }) {
  return kRunWebAPI(async () => {
    await Kakao.API.request({
      url: '/v2/api/talk/memo/default/send',
      data: {
        template_object: serializeMessageTemplate(objectType, template),
      },
    });
  });
}

function createSendDefaultFriends({
  objectType,
  template,
  receiverUuids,
}: {
  template: any;
  objectType: any;
  receiverUuids: string[];
}) {
  return kRunWebAPI(() =>
    Kakao.API.request({
      url: '/v1/api/talk/friends/message/default/send',
      data: {
        template_object: serializeMessageTemplate(objectType, template),
        receiver_uuids: receiverUuids,
      },
    }).then(
      (response: { successful_receiver_uuids?: string[] }) =>
        response.successful_receiver_uuids ?? [],
    ),
  );
}

function serializeMessageTemplate(objectType: string, template: object) {
  return snakeCaseObject({ objectType, ...serializeExecutionParams(template) });
}

function serializeExecutionParams(template: object) {
  return replaceJsonValuesRecursively(template, {
    stripUndefined: true,
    replacer: {
      androidExecutionParams: encodeExecutionParams,
      iosExecutionParams: encodeExecutionParams,
    },
  });

  function encodeExecutionParams(params?: Record<string, string>) {
    return params == null
      ? undefined
      : Object.entries(params)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&');
  }
}

const KakaoShare: KakaoShareAPI = {
  shareCustomTemplate: ({ templateArgs, templateId, serverCallbackArgs }) =>
    kRunWebAPI(() =>
      Kakao.Share.sendCustom(
        filterNonNullishKeys({ templateId, templateArgs, serverCallbackArgs }),
      ),
    ),
  sendCustomTemplateToMe: ({ templateId, templateArgs }) =>
    kRunWebAPI(async () => {
      await Kakao.API.request({
        url: '/v2/api/talk/memo/send',
        data: filterNonNullishKeys({ template_id: templateId, template_args: templateArgs }),
      });
    }),
  sendCustomTemplateToFriends: ({ templateArgs, templateId, receiverUuids }) =>
    kRunWebAPI(() =>
      Kakao.API.request({
        url: '/v1/api/talk/friends/message/send',
        data: filterNonNullishKeys({
          template_id: templateId,
          template_args: templateArgs,
          receiver_uuids: receiverUuids,
        }),
      }).then(
        (response: { successful_receiver_uuids?: string[] }) =>
          response.successful_receiver_uuids ?? [],
      ),
    ),
  shareFeedTemplate: ({ template, serverCallbackArgs }) =>
    createShareDefault({ template, serverCallbackArgs, objectType: 'feed' }),
  sendFeedTemplateToMe: ({ template }) => createSendDefaultMe({ template, objectType: 'feed' }),
  sendFeedTemplateToFriends: ({ template, receiverUuids }) =>
    createSendDefaultFriends({ template, receiverUuids, objectType: 'feed' }),
  shareListTemplate: ({ template, serverCallbackArgs }) =>
    createShareDefault({ template, serverCallbackArgs, objectType: 'list' }),
  sendListTemplateToMe: ({ template }) => createSendDefaultMe({ template, objectType: 'list' }),
  sendListTemplateToFriends: ({ template, receiverUuids }) =>
    createSendDefaultFriends({ template, receiverUuids, objectType: 'list' }),
  shareLocationTemplate: ({ template, serverCallbackArgs }) =>
    createShareDefault({ template, serverCallbackArgs, objectType: 'location' }),
  sendLocationTemplateToMe: ({ template }) =>
    createSendDefaultMe({ template, objectType: 'location' }),
  sendLocationTemplateToFriends: ({ template, receiverUuids }) =>
    createSendDefaultFriends({ template, receiverUuids, objectType: 'location' }),
  shareCommerceTemplate: ({ template, serverCallbackArgs }) =>
    createShareDefault({ template, serverCallbackArgs, objectType: 'commerce' }),
  sendCommerceTemplateToMe: ({ template }) =>
    createSendDefaultMe({ template, objectType: 'commerce' }),
  sendCommerceTemplateToFriends: ({ template, receiverUuids }) =>
    createSendDefaultFriends({ template, receiverUuids, objectType: 'commerce' }),
  shareTextTemplate: ({ template, serverCallbackArgs }) =>
    createShareDefault({ template, serverCallbackArgs, objectType: 'text' }),
  sendTextTemplateToMe: ({ template }) => createSendDefaultMe({ template, objectType: 'text' }),
  sendTextTemplateToFriends: ({ template, receiverUuids }) =>
    createSendDefaultFriends({ template, receiverUuids, objectType: 'text' }),
  shareCalendarTemplate: ({ template, serverCallbackArgs }) =>
    createShareDefault({ template, serverCallbackArgs, objectType: 'calendar' }),
  sendCalendarTemplateToMe: ({ template }) =>
    createSendDefaultMe({ template, objectType: 'calendar' }),
  sendCalendarTemplateToFriends: ({ template, receiverUuids }) =>
    createSendDefaultFriends({ template, receiverUuids, objectType: 'calendar' }),
};
export const {
  sendCalendarTemplateToFriends,
  sendCalendarTemplateToMe,
  sendCommerceTemplateToFriends,
  sendCommerceTemplateToMe,
  sendCustomTemplateToFriends,
  sendCustomTemplateToMe,
  sendFeedTemplateToFriends,
  sendFeedTemplateToMe,
  sendListTemplateToFriends,
  sendListTemplateToMe,
  sendLocationTemplateToFriends,
  sendLocationTemplateToMe,
  sendTextTemplateToFriends,
  sendTextTemplateToMe,
  shareCalendarTemplate,
  shareCommerceTemplate,
  shareCustomTemplate,
  shareFeedTemplate,
  shareListTemplate,
  shareLocationTemplate,
  shareTextTemplate,
} = KakaoShare;
export default KakaoShare;
