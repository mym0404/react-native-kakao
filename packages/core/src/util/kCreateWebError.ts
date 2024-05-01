export function kCreateWebError({
  code = '444',
  message = 'Package-Unknown',
  msg = 'Package-Unknown',
  isApiFailed = false,
  isAppsFailed = false,
  isAuthFailed = false,
  isClientFailed = false,
  isInvalidTokenError = false,
  nativeErrorMessage = '',
}: {
  message?: string;
  msg?: string;
  code?: string;
  isAppsFailed?: boolean;
  isInvalidTokenError?: boolean;
  isAuthFailed?: boolean;
  isClientFailed?: boolean;
  isApiFailed?: boolean;
  nativeErrorMessage?: string;
}) {
  throw {
    code: code + '',
    message: (msg ?? message) + '',
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
