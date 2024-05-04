import {
  camelCaseObject,
  filterNonNullishKeys,
  is,
  replaceJsonKeysRecursively,
} from '@mj-studio/js-util';
import { kRunWebAPI } from '@react-native-kakao/core';

import type { KakaoSocialAPI } from './index';

declare const Kakao: {
  API: { request: Function };
  Picker: {
    selectFriends: Function;
    selectFriend: Function;
  };
};

const KakaoSocial: KakaoSocialAPI = {
  getTalkProfile: () =>
    kRunWebAPI(() => Kakao.API.request({ url: '/v1/api/talk/profile' })).then((r) =>
      replaceJsonKeysRecursively(r, {
        replacer: { profileImageURL: 'profileImageUrl', thumbnailURL: 'thumbnailUrl' },
      }),
    ),
  selectSingleFriend: ({ options }) =>
    kRunWebAPI(() => {
      return Kakao.Picker.selectFriend(
        filterNonNullishKeys({
          title: options?.title,
          enableSearch: options?.enableSearch,
          showMyProfile: options?.showMyProfile,
          showFavorite: options?.showFavorite,
        }),
      )
        .then(camelCaseObject)
        .then((r: any) => (is.object(r) && is.array(r?.users) ? r.users[0] : undefined));
    }),
  selectMultipleFriends: ({ options }) =>
    kRunWebAPI(() => {
      return Kakao.Picker.selectFriends(
        filterNonNullishKeys({
          title: options?.title,
          enableSearch: options?.enableSearch,
          showMyProfile: options?.showMyProfile,
          showFavorite: options?.showFavorite,
          showPickedFriend: options?.showPickedFriend,
          maxPickableCount: options?.maxPickableCount,
          minPickableCount: options?.minPickableCount,
        }),
      )
        .then(camelCaseObject)
        .then((r: any) =>
          replaceJsonKeysRecursively(r, { replacer: { selectedTotalCount: 'totalCount' } }),
        );
    }),
  getFriends: ({ options }) =>
    kRunWebAPI(() => {
      return Kakao.API.request({
        url: '/v1/api/talk/friends',
        data: options
          ? filterNonNullishKeys({
              offset: options.offset,
              limit: options.limit,
              order: options.order,
              friend_order: options.friendOrder,
            })
          : undefined,
      })
        .then(camelCaseObject)
        .then((r: any) => replaceJsonKeysRecursively(r, { replacer: { elements: 'friends' } }));
    }),
};
export const { getFriends, getTalkProfile, selectMultipleFriends, selectSingleFriend } =
  KakaoSocial;
export default KakaoSocial;
