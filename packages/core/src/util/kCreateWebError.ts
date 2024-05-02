export type KakaoPackageErrorCodes = 'Package-Unknown' | 'Package-Assertion';
export function kCreateWebError({
  code = 'Package-Unknown',
  message = '',
  msg = '',
  isApiFailed = false,
  isAppsFailed = false,
  isAuthFailed = false,
  isClientFailed = false,
  isInvalidTokenError = false,
  nativeErrorMessage = '',
}: {
  message?: string;
  msg?: string;
  code?: KakaoPackageErrorCodes;
  isAppsFailed?: boolean;
  isInvalidTokenError?: boolean;
  isAuthFailed?: boolean;
  isClientFailed?: boolean;
  isApiFailed?: boolean;
  nativeErrorMessage?: string;
}) {
  throw {
    code: code + '',
    message: (msg || message) + '',
    userInfo: {
      isAppsFailed,
      isInvalidTokenError,
      isClientFailed,
      isAuthFailed,
      fatal: true,
      isApiFailed,
      nativeErrorMessage,
    },
  };
}
