import { type KakaoPackageErrorCodes, kCreateWebError } from '@react-native-kakao/core';

export function kAssert(
  condition: boolean | undefined | null | string,
  message: string,
  code: KakaoPackageErrorCodes = 'Package-Assertion',
) {
  if (!condition) {
    throw kCreateWebError({ code, message });
  }
}
