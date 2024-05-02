import { type KakaoPackageErrorCodes, kCreateWebError } from './kCreateWebError';

export function kAssert(
  condition: boolean | undefined | null | string,
  message: string,
  code: KakaoPackageErrorCodes = 'Package-Assertion',
) {
  if (!condition) {
    throw kCreateWebError({ code, message });
  }
}
