import {
  filterNonNullishKeys,
  replaceJsonValuesRecursively,
  snakeCaseObject,
} from '@mj-studio/js-util';
import { kRunWebAPI } from '@react-native-kakao/core';

import type {
  KakaoFriendMessageResult,
  KakaoImageUploadResult,
  KakaoMessageSendResult,
  KakaoShareAPI,
  KakaoSharePickerSettings,
} from './index';
import { validateSharePickerSettings } from './validateSharePickerSettings';

declare const Kakao: {
  Share: {
    uploadImage: (args: { file: Blob[] }) => Promise<{
      infos: {
        original: Omit<KakaoImageUploadResult['infos']['original'], 'contentType'> & {
          content_type: string;
        };
      };
    }>;
    sendScrap: (args: {
      requestUrl: string;
      templateId?: number;
      templateArgs: Record<string, string>;
      serverCallbackArgs: Record<string, string>;
      pickerSettings?: KakaoSharePickerSettings;
    }) => void;
    scrapImage: (args: { imageUrl: string }) => Promise<{
      infos: {
        original: Omit<KakaoImageUploadResult['infos']['original'], 'contentType'> & {
          content_type: string;
        };
      };
    }>;
    sendDefault: (args: any) => void;
    sendCustom: (args: any) => void;
  };
  API: { request: (args: any) => Promise<any> };
};

function createShareDefault({
  serverCallbackArgs,
  template,
  objectType,
  pickerSettings,
}: {
  objectType: string;
  template: any;
  serverCallbackArgs?: Record<string, string>;
  pickerSettings?: KakaoSharePickerSettings;
}) {
  return kRunWebAPI(() =>
    Kakao.Share.sendDefault(
      filterNonNullishKeys({
        objectType,
        ...serializeExecutionParams(template),
        serverCallbackArgs,
        pickerSettings: validateSharePickerSettings(pickerSettings),
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

type WebMessageSendResult = {
  successful_receiver_uuids?: string[];
  failure_info?: { code: number; msg: string; receiver_uuids: string[] }[];
};

function getFriendMessageResult<T extends boolean = false>(
  response: WebMessageSendResult,
  includeFailureInfo?: T,
): KakaoFriendMessageResult<T>;
function getFriendMessageResult(
  response: WebMessageSendResult,
  includeFailureInfo?: boolean,
): string[] | KakaoMessageSendResult {
  const successfulReceiverUuids = response.successful_receiver_uuids ?? [];

  return includeFailureInfo
    ? {
        successfulReceiverUuids,
        failureInfos: (response.failure_info ?? []).map(({ receiver_uuids, ...failure }) => ({
          ...failure,
          receiverUuids: receiver_uuids,
        })),
      }
    : successfulReceiverUuids;
}

function createSendDefaultFriends<T extends boolean = false>({
  objectType,
  template,
  receiverUuids,
  includeFailureInfo,
}: {
  template: any;
  objectType: any;
  receiverUuids: string[];
  includeFailureInfo?: T;
}) {
  return kRunWebAPI(() =>
    Kakao.API.request({
      url: '/v1/api/talk/friends/message/default/send',
      data: {
        template_object: serializeMessageTemplate(objectType, template),
        receiver_uuids: receiverUuids,
      },
    }).then((response: WebMessageSendResult) =>
      getFriendMessageResult(response, includeFailureInfo),
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
  isKakaoTalkSharingAvailable: async () => false,
  uploadImage: ({ imageUri, secureResource = true }) =>
    kRunWebAPI(async () => {
      const response = await fetch(imageUri);
      if (!response.ok) {
        throw new Error(`Failed to read image: HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Image response has no body');
      }

      const chunks: BlobPart[] = [];
      let length = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          length += value.byteLength;
          if (length > 5 * 1024 * 1024) {
            await reader.cancel();
            throw new Error('Image must be no larger than 5 MB');
          }

          chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }

      const image = new Blob(chunks, { type: response.headers.get('content-type') ?? '' });

      const { infos } = await Kakao.Share.uploadImage({ file: [image] });
      const { content_type: contentType, ...original } = infos.original;

      return {
        infos: {
          original: {
            ...original,
            url: original.url.replace(/^https?:/, secureResource ? 'https:' : 'http:'),
            contentType,
          },
        },
      };
    }),
  shareScrapTemplate: ({
    requestUrl,
    templateId,
    templateArgs = {},
    serverCallbackArgs = {},
    pickerSettings,
  }) =>
    kRunWebAPI(() =>
      Kakao.Share.sendScrap(
        filterNonNullishKeys({
          requestUrl,
          templateId,
          templateArgs,
          serverCallbackArgs,
          pickerSettings: validateSharePickerSettings(pickerSettings),
        }),
      ),
    ),
  sendScrapTemplateToMe: async ({ requestUrl, templateId, templateArgs }) => {
    await kRunWebAPI(() =>
      Kakao.API.request({
        url: '/v2/api/talk/memo/scrap/send',
        data: filterNonNullishKeys({
          request_url: requestUrl,
          template_id: templateId,
          template_args: templateArgs,
        }),
      }),
    );
  },
  sendScrapTemplateToFriends: async ({
    requestUrl,
    templateId,
    templateArgs,
    receiverUuids,
    includeFailureInfo,
  }) => {
    const response: WebMessageSendResult = await kRunWebAPI(() =>
      Kakao.API.request({
        url: '/v1/api/talk/friends/message/scrap/send',
        data: filterNonNullishKeys({
          request_url: requestUrl,
          template_id: templateId,
          template_args: templateArgs,
          receiver_uuids: receiverUuids,
        }),
      }),
    );

    return getFriendMessageResult(response, includeFailureInfo);
  },
  scrapImage: ({ imageUrl, secureResource = true }) =>
    kRunWebAPI(async () => {
      const { infos } = await Kakao.Share.scrapImage({ imageUrl });
      const { content_type: contentType, ...original } = infos.original;

      return {
        infos: {
          original: {
            ...original,
            url: original.url.replace(/^https?:/, secureResource ? 'https:' : 'http:'),
            contentType,
          },
        },
      };
    }),
  shareCustomTemplate: ({ templateArgs, templateId, serverCallbackArgs, pickerSettings }) =>
    kRunWebAPI(() =>
      Kakao.Share.sendCustom(
        filterNonNullishKeys({
          templateId,
          templateArgs,
          serverCallbackArgs,
          pickerSettings: validateSharePickerSettings(pickerSettings),
        }),
      ),
    ),
  sendCustomTemplateToMe: ({ templateId, templateArgs }) =>
    kRunWebAPI(async () => {
      await Kakao.API.request({
        url: '/v2/api/talk/memo/send',
        data: filterNonNullishKeys({ template_id: templateId, template_args: templateArgs }),
      });
    }),
  sendCustomTemplateToFriends: ({ templateArgs, templateId, receiverUuids, includeFailureInfo }) =>
    kRunWebAPI(() =>
      Kakao.API.request({
        url: '/v1/api/talk/friends/message/send',
        data: filterNonNullishKeys({
          template_id: templateId,
          template_args: templateArgs,
          receiver_uuids: receiverUuids,
        }),
      }).then((response: WebMessageSendResult) =>
        getFriendMessageResult(response, includeFailureInfo),
      ),
    ),
  shareFeedTemplate: ({ template, serverCallbackArgs, pickerSettings }) =>
    createShareDefault({ template, serverCallbackArgs, pickerSettings, objectType: 'feed' }),
  sendFeedTemplateToMe: ({ template }) => createSendDefaultMe({ template, objectType: 'feed' }),
  sendFeedTemplateToFriends: ({ template, receiverUuids, includeFailureInfo }) =>
    createSendDefaultFriends({ template, receiverUuids, includeFailureInfo, objectType: 'feed' }),
  shareListTemplate: ({ template, serverCallbackArgs, pickerSettings }) =>
    createShareDefault({ template, serverCallbackArgs, pickerSettings, objectType: 'list' }),
  sendListTemplateToMe: ({ template }) => createSendDefaultMe({ template, objectType: 'list' }),
  sendListTemplateToFriends: ({ template, receiverUuids, includeFailureInfo }) =>
    createSendDefaultFriends({ template, receiverUuids, includeFailureInfo, objectType: 'list' }),
  shareLocationTemplate: ({ template, serverCallbackArgs, pickerSettings }) =>
    createShareDefault({ template, serverCallbackArgs, pickerSettings, objectType: 'location' }),
  sendLocationTemplateToMe: ({ template }) =>
    createSendDefaultMe({ template, objectType: 'location' }),
  sendLocationTemplateToFriends: ({ template, receiverUuids, includeFailureInfo }) =>
    createSendDefaultFriends({
      template,
      receiverUuids,
      includeFailureInfo,
      objectType: 'location',
    }),
  shareCommerceTemplate: ({ template, serverCallbackArgs, pickerSettings }) =>
    createShareDefault({ template, serverCallbackArgs, pickerSettings, objectType: 'commerce' }),
  sendCommerceTemplateToMe: ({ template }) =>
    createSendDefaultMe({ template, objectType: 'commerce' }),
  sendCommerceTemplateToFriends: ({ template, receiverUuids, includeFailureInfo }) =>
    createSendDefaultFriends({
      template,
      receiverUuids,
      includeFailureInfo,
      objectType: 'commerce',
    }),
  shareTextTemplate: ({ template, serverCallbackArgs, pickerSettings }) =>
    createShareDefault({ template, serverCallbackArgs, pickerSettings, objectType: 'text' }),
  sendTextTemplateToMe: ({ template }) => createSendDefaultMe({ template, objectType: 'text' }),
  sendTextTemplateToFriends: ({ template, receiverUuids, includeFailureInfo }) =>
    createSendDefaultFriends({ template, receiverUuids, includeFailureInfo, objectType: 'text' }),
  shareCalendarTemplate: ({ template, serverCallbackArgs, pickerSettings }) =>
    createShareDefault({ template, serverCallbackArgs, pickerSettings, objectType: 'calendar' }),
  sendCalendarTemplateToMe: ({ template }) =>
    createSendDefaultMe({ template, objectType: 'calendar' }),
  sendCalendarTemplateToFriends: ({ template, receiverUuids, includeFailureInfo }) =>
    createSendDefaultFriends({
      template,
      receiverUuids,
      includeFailureInfo,
      objectType: 'calendar',
    }),
};
export const {
  isKakaoTalkSharingAvailable,
  uploadImage,
  shareScrapTemplate,
  sendScrapTemplateToMe,
  sendScrapTemplateToFriends,
  scrapImage,
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
