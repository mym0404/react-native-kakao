import { filterNonNullishKeys } from '@mj-studio/js-util';
import { kAssert } from '@react-native-kakao/core';

import type { KakaoNaviAPI, KakaoNaviOption } from './index';

declare const Kakao: {
  Navi: {
    start: Function;
    share: Function;
  };
};

function getVehicleType(v: KakaoNaviOption['vehicleType']): number {
  if (v === 'First') {
    return 1;
  }

  if (v === 'Second') {
    return 2;
  }

  if (v === 'Third') {
    return 3;
  }

  if (v === 'Fourth') {
    return 4;
  }

  if (v === 'Fifth') {
    return 5;
  }

  if (v === 'Sixth') {
    return 6;
  }

  if (v === 'TwoWheel') {
    return 7;
  }

  return 1;
}

function getRpOption(v: KakaoNaviOption['rpOption']): number {
  if (v === 'Fast') {
    return 1;
  }

  if (v === 'Free') {
    return 2;
  }

  if (v === 'Shortest') {
    return 3;
  }

  if (v === 'NoAuto') {
    return 4;
  }

  if (v === 'Wide') {
    return 5;
  }

  if (v === 'Highway') {
    return 6;
  }

  if (v === 'Normal') {
    return 8;
  }

  if (v === 'Recommended') {
    return 100;
  }

  return 100;
}

const KakaoNavi: KakaoNaviAPI = {
  navigateTo: async ({ viaList, destination, option }) => {
    kAssert(
      viaList ? viaList.length <= 3 : true,
      '[navigateTo] viaList length should equal or less then 3.',
    );

    try {
      Kakao.Navi.start(
        filterNonNullishKeys({
          name: destination.name,
          x: destination.x,
          y: destination.y,
          coordType: option?.coordType?.toLowerCase(),
          vehicleType: option?.vehicleType ? getVehicleType(option.vehicleType) : undefined,
          rpOption: option?.rpOption ? getRpOption(option.rpOption) : undefined,
          routeInfo: option?.routeInfo,
          sX: option?.startX,
          sY: option?.startY,
          sAngle: option?.startAngle,
          returnUri: option?.returnUri,
          viaPoints: viaList?.map((v) => ({
            name: v.name,
            x: v.x,
            y: v.y,
          })),
        }),
      );

      return true;
    } catch (e: any) {
      return false;
    }
  },
  shareTo: async ({ destination, option }) => {
    try {
      Kakao.Navi.share(
        filterNonNullishKeys({
          name: destination.name,
          x: destination.x,
          y: destination.y,
          coordType: option?.coordType?.toLowerCase(),
        }),
      );

      return true;
    } catch (e: any) {
      return false;
    }
  },
};

export const { navigateTo, shareTo } = KakaoNavi;
export default KakaoNavi;
