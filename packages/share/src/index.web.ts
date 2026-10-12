import { filterNonNullishKeys, snakeCaseObject } from '@mj-studio/js-util';
import { kRunWebAPI } from '@react-native-kakao/core';

import type { KakaoImageUploadResult, KakaoShareAPI } from './index';

declare const Kakao: {
  Share: {
    uploadImage: (args: { file: Blob[] }) => Promise<{
      infos: {
        original: Omit<KakaoImageUploadResult['infos']['original'], 'contentType'> & {
          content_type: string;
        };
      };
    }>;
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
    Kakao.Share.sendDefault({
      objectType,
      ...template,
      serverCallbackArgs,
    }),
  );
}

function createSendDefaultMe({ template, objectType }: { objectType: string; template: any }) {
  return kRunWebAPI(() =>
    Kakao.API.request({
      url: '/v2/api/talk/memo/default/send',
      data: {
        template_object: snakeCaseObject({
          objectType,
          ...template,
        }),
      },
    }),
  );
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
        template_object: snakeCaseObject(
          filterNonNullishKeys({
            objectType,
            ...template,
          }),
        ),
        receiver_uuids: receiverUuids,
      },
    }),
  );
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
      Kakao.Share.sendCustom({
        templateId,
        templateArgs,
        serverCallbackArgs,
      }),
    ),
  sendCustomTemplateToMe: ({ templateId, templateArgs }) =>
    kRunWebAPI(() =>
      Kakao.API.request({
        url: '/v2/api/talk/memo/send',
        data: { template_id: templateId, template_args: templateArgs },
      }),
    ),
  sendCustomTemplateToFriends: ({ templateArgs, templateId, receiverUuids }) =>
    kRunWebAPI(() =>
      Kakao.API.request({
        url: '/v1/api/talk/friends/message/send',
        data: {
          template_id: templateId,
          template_args: templateArgs,
          receiver_uuids: receiverUuids,
        },
      }),
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
  uploadImage,
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
