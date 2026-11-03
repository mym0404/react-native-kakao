import { camelCaseObject, filterNonNullishKeys } from '@mj-studio/js-util';
import { kRunWebAPI } from '@react-native-kakao/core';

import type {
  KakaoTalkFriend,
  KakaoTalkFriendProfile,
  KakaoTalkPartnerFriendSelectOptions,
} from './spec/NativeKakaoSocial';
import type { KakaoSocialAPI } from './index';
import { validatePartnerFriendOptions } from './validatePartnerFriendOptions';

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
        id: number;
        nickName?: string;
        profileImageURL?: string;
        thumbnailURL?: string;
        countryISO?: string;
      } = await Kakao.API.request({ url: '/v1/api/talk/profile' });

      return {
        id: response.id,
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
  selectSinglePartnerFriend: ({ options = {} } = {}) =>
    selectPartnerFriendsWeb(false, options).then((result) => result.users[0]),
  selectMultiplePartnerFriends: ({ options = {} } = {}) => selectPartnerFriendsWeb(true, options),
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
          beforeUrl: response.beforeUrl ?? null,
          afterUrl: response.afterUrl ?? null,
          friends: (response.elements ?? []).map((friend: KakaoTalkFriend) => ({
            ...friend,
            profileNickname: friend.profileNickname ?? null,
          })),
        }));
    }),
};

function selectPartnerFriendsWeb(multiple: boolean, options: KakaoTalkPartnerFriendSelectOptions) {
  return kRunWebAPI(async () => {
    validatePartnerFriendOptions(options, multiple);

    const params = filterNonNullishKeys({
      friendFilter: options.friendFilter,
      countryCodeFilters: options.countryCodeFilters,
      usingOsFilter: options.usingOsFilter,
      disableSelectOptions: options.disableSelectOptions,
      displayAllProfile: options.displayAllProfile,
      enableSearch: options.enableSearch,
      showMyProfile: options.showMyProfile,
      showFavorite: options.showFavorite,
      showPickedFriend: multiple ? options.showPickedFriend : undefined,
      minPickableCount: multiple ? options.minPickableCount : undefined,
      maxPickableCount: multiple ? options.maxPickableCount : undefined,
    });

    const response = await (multiple
      ? Kakao.Picker.selectFriends(params)
      : Kakao.Picker.selectFriend(params));

    return mapSelectedFriends(camelCaseObject(response) as WebSelectedFriends);
  });
}

type WebSelectedFriends = {
  selectedTotalCount: number;
  users?: (Omit<KakaoTalkFriendProfile, 'id'> & { id?: string | number | null })[];
};

function mapSelectedFriends(response: WebSelectedFriends) {
  return {
    totalCount: response.selectedTotalCount,
    users: (response.users ?? []).map((user) => ({
      ...user,
      id: user.id == null ? undefined : Number(user.id),
    })),
  };
}

export const {
  getFriends,
  getTalkProfile,
  selectMultipleFriends,
  selectSingleFriend,
  selectSinglePartnerFriend,
  selectMultiplePartnerFriends,
} = KakaoSocial;
export default KakaoSocial;
