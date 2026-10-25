import { kAssert } from '@react-native-kakao/core';

import type { KakaoTalkPartnerFriendSelectOptions } from './spec/NativeKakaoSocial';

const maxSelectionCount = 100;

export function validatePartnerFriendOptions(
  options: KakaoTalkPartnerFriendSelectOptions,
  multiple: boolean,
) {
  if (multiple) {
    const min = options.minPickableCount ?? 1;
    const max = options.maxPickableCount ?? 30;
    kAssert(
      Number.isInteger(min) &&
        Number.isInteger(max) &&
        min >= 1 &&
        max <= maxSelectionCount &&
        min <= max,
      `[partner picker] selection counts must be integers with 1 <= min <= max <= ${maxSelectionCount}`,
    );
  }

  options.disableSelectOptions?.forEach((option) => {
    if (option.reason === 'custom') {
      kAssert(
        !!option.message && !!option.uuids?.length,
        '[partner picker] custom selection restrictions require a message and at least one UUID',
      );
    }
  });
}
