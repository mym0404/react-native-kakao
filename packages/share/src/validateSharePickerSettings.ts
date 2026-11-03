import { kAssert } from '@react-native-kakao/core';

import type { KakaoSharePickerSettings } from './spec/NativeKakaoShare';

const minSelectionLimit = 1;
const maxSelectionLimit = 10;

export function validateSharePickerSettings(pickerSettings?: KakaoSharePickerSettings) {
  if (pickerSettings == null) {
    return undefined;
  }

  kAssert(
    typeof pickerSettings === 'object' && !Array.isArray(pickerSettings),
    '[share] pickerSettings must be an object',
  );

  const { type, limit } = pickerSettings;
  kAssert(
    type == null || ['default', 'friend', 'chat'].includes(type),
    '[share] pickerSettings.type must be default, friend, or chat',
  );

  kAssert(
    limit == null ||
      (Number.isInteger(limit) && limit >= minSelectionLimit && limit <= maxSelectionLimit),
    `[share] pickerSettings.limit must be an integer between ${minSelectionLimit} and ${maxSelectionLimit}`,
  );

  if (type == null && limit == null) {
    return undefined;
  }

  return {
    ...(type != null && { type }),
    ...(limit != null && { limit }),
  };
}
