import { camelCaseObject, filterNonNullishKeys } from '@mj-studio/js-util';
import { kRunWebAPI } from '@react-native-kakao/core';

import type { KakaoTalkFriendProfile } from './spec/NativeKakaoSocial';
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
    kRunWebAPI(async () => {
      const response: {
        nickName?: string;
        profileImageURL?: string;
        thumbnailURL?: string;
        countryISO?: string;
      } = await Kakao.API.request({ url: '/v1/api/talk/profile' });

      return {
        nickname: response.nickName,
        profileImageUrl: response.profileImageURL,
        thumbnailUrl: response.thumbnailURL,
        countryISO: response.countryISO,
      };
    }),
  selectSingleFriend: ({ options }) =>
    kRunWebAPI(() => {
      return Kakao.Picker.selectFriend(
        filterNonNullishKeys({
          enableSearch: options?.enableSearch,
          showMyProfile: options?.showMyProfile,
          showFavorite: options?.showFavorite,
        }),
      )
        .then(camelCaseObject)
        .then(mapSelectedFriends)
        .then((result) => result.users[0]);
    }),
  selectMultipleFriends: ({ options }) =>
    kRunWebAPI(() => {
      return Kakao.Picker.selectFriends(
        filterNonNullishKeys({
          enableSearch: options?.enableSearch,
          showMyProfile: options?.showMyProfile,
          showFavorite: options?.showFavorite,
          showPickedFriend: options?.showPickedFriend,
          maxPickableCount: options?.maxPickableCount,
          minPickableCount: options?.minPickableCount,
        }),
      )
        .then(camelCaseObject)
        .then(mapSelectedFriends);
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
        .then((response) => ({
          totalCount: response.totalCount,
          favoriteCount: response.favoriteCount,
          friends: response.elements ?? [],
        }));
    }),
};

function mapSelectedFriends(response: {
  selectedTotalCount: number;
  users?: (Omit<KakaoTalkFriendProfile, 'id'> & { id?: string | number | null })[];
}) {
  return {
    totalCount: response.selectedTotalCount,
    users: (response.users ?? []).map((user) => ({
      ...user,
      id: user.id == null ? undefined : Number(user.id),
    })),
  };
}

export const { getFriends, getTalkProfile, selectMultipleFriends, selectSingleFriend } =
  KakaoSocial;
export default KakaoSocial;
