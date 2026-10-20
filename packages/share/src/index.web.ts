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
} from './index';

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
    }) => void;
    scrapImage: (args: { imageUrl: string }) => Promise<{
      infos: {
        original: Omit<KakaoImageUploadResult['infos']['original'], 'contentType'> & {
          content_type: string;
        };
      };
    }>;
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
  shareScrapTemplate: ({ requestUrl, templateId, templateArgs = {}, serverCallbackArgs = {} }) =>
    kRunWebAPI(() =>
      Kakao.Share.sendScrap(
        filterNonNullishKeys({ requestUrl, templateId, templateArgs, serverCallbackArgs }),
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
  shareFeedTemplate: ({ template, serverCallbackArgs }) =>
    createShareDefault({ template, serverCallbackArgs, objectType: 'feed' }),
  sendFeedTemplateToMe: ({ template }) => createSendDefaultMe({ template, objectType: 'feed' }),
  sendFeedTemplateToFriends: ({ template, receiverUuids, includeFailureInfo }) =>
    createSendDefaultFriends({ template, receiverUuids, includeFailureInfo, objectType: 'feed' }),
  shareListTemplate: ({ template, serverCallbackArgs }) =>
    createShareDefault({ template, serverCallbackArgs, objectType: 'list' }),
  sendListTemplateToMe: ({ template }) => createSendDefaultMe({ template, objectType: 'list' }),
  sendListTemplateToFriends: ({ template, receiverUuids, includeFailureInfo }) =>
    createSendDefaultFriends({ template, receiverUuids, includeFailureInfo, objectType: 'list' }),
  shareLocationTemplate: ({ template, serverCallbackArgs }) =>
    createShareDefault({ template, serverCallbackArgs, objectType: 'location' }),
  sendLocationTemplateToMe: ({ template }) =>
    createSendDefaultMe({ template, objectType: 'location' }),
  sendLocationTemplateToFriends: ({ template, receiverUuids, includeFailureInfo }) =>
    createSendDefaultFriends({
      template,
      receiverUuids,
      includeFailureInfo,
      objectType: 'location',
    }),
  shareCommerceTemplate: ({ template, serverCallbackArgs }) =>
    createShareDefault({ template, serverCallbackArgs, objectType: 'commerce' }),
  sendCommerceTemplateToMe: ({ template }) =>
    createSendDefaultMe({ template, objectType: 'commerce' }),
  sendCommerceTemplateToFriends: ({ template, receiverUuids, includeFailureInfo }) =>
    createSendDefaultFriends({
      template,
      receiverUuids,
      includeFailureInfo,
      objectType: 'commerce',
    }),
  shareTextTemplate: ({ template, serverCallbackArgs }) =>
    createShareDefault({ template, serverCallbackArgs, objectType: 'text' }),
  sendTextTemplateToMe: ({ template }) => createSendDefaultMe({ template, objectType: 'text' }),
  sendTextTemplateToFriends: ({ template, receiverUuids, includeFailureInfo }) =>
    createSendDefaultFriends({ template, receiverUuids, includeFailureInfo, objectType: 'text' }),
  shareCalendarTemplate: ({ template, serverCallbackArgs }) =>
    createShareDefault({ template, serverCallbackArgs, objectType: 'calendar' }),
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
