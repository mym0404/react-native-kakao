export type KakaoPackageErrorCodes =
  | 'Package-Unknown'
  | 'Package-Assertion'
  | 'Package-Unauthorized'
  | (string & {});
export function kCreateWebError(error: unknown): never {
  const source = (
    typeof error === 'object' && error !== null
      ? error
      : {
          message: typeof error === 'string' ? error : '',
        }
  ) as {
    message?: string;
    msg?: string;
    code?: KakaoPackageErrorCodes | number;
    error?: string;
    error_description?: string;
    error_code?: string | number;
    error_msg?: string;
    isAppsFailed?: boolean;
    isInvalidTokenError?: boolean;
    isAuthFailed?: boolean;
    isClientFailed?: boolean;
    isApiFailed?: boolean;
    nativeErrorMessage?: string;
    userInfo?: {
      isAppsFailed?: boolean;
      isInvalidTokenError?: boolean;
      isClientFailed?: boolean;
      isAuthFailed?: boolean;
      fatal?: boolean;
      isApiFailed?: boolean;
      nativeErrorMessage?: string;
    };
  };
  const code = String(source.error ?? source.code ?? source.error_code ?? 'Package-Unknown');
  const isInvalidTokenError = code === '-401' || code === '401';
  throw {
    code,
    message: String(
      source.error_description || source.msg || source.error_msg || source.message || 'unknown',
    ),
    userInfo: {
      isAppsFailed: source.userInfo?.isAppsFailed ?? source.isAppsFailed ?? false,
      isInvalidTokenError:
        source.userInfo?.isInvalidTokenError ?? source.isInvalidTokenError ?? isInvalidTokenError,
      isClientFailed: source.userInfo?.isClientFailed ?? source.isClientFailed ?? false,
      isAuthFailed: source.userInfo?.isAuthFailed ?? source.isAuthFailed ?? isInvalidTokenError,
      fatal: source.userInfo?.fatal ?? true,
      isApiFailed:
        source.userInfo?.isApiFailed ?? source.isApiFailed ?? typeof source.code === 'number',
      nativeErrorMessage: source.userInfo?.nativeErrorMessage ?? source.nativeErrorMessage ?? '',
    },
  };
}
