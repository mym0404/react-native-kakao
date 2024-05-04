import { kRunWebAPI } from '@react-native-kakao/core';

import type { KakaoShareAPI } from './index';

declare const Kakao: {
  Share: {
    sendDefault: (args: any) => Promise<any>;
    sendCustom: (args: any) => Promise<any>;
  };
  API: { request: (args: any) => Promise<any> };
};

// @ts-ignore
const KakaoShare: KakaoShareAPI = {
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
