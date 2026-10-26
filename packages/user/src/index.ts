import { is } from '@mj-studio/js-util';
import { kAssert } from '@react-native-kakao/core';

import Native from './spec/NativeKakaoUser';
import { validateShippingAddressOptions } from './validateShippingAddressOptions';

export interface KakaoLoginToken {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  idToken?: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  scopes: string[];
}
export type KakaoCodeTokenOptions = {
  code: string;
  codeVerifier?: string;
  redirectUri?: string;
  web?: { clientSecret?: string };
};

const minActivityRequestCode = -2147483648;
const maxActivityRequestCode = 2147483647;

export interface KakaoScopeInfo {
  id: string;
  agreed: boolean;
  displayName: string;
  revocable?: boolean;
  using: boolean;
  delegated?: boolean;
  type: string;
}
export interface KakaoServiceTerms {
  tag: string;
  agreedAt?: number;
  agreed: boolean;
  required: boolean;
  revocable: boolean;
}
export type KakaoRevokedServiceTerms = {
  tag: string;
  agreed: boolean;
};
export interface KakaoAppServiceTerms {
  tag: string;
  createdAt: number;
  updatedAt: number;
}
export interface KakaoShippingAddressResult {
  userId?: number;
  needsAgreement?: boolean;
  shippingAddresses: KakaoShippingAddress[];
}
export interface KakaoShippingAddress {
  id: number;
  name?: string;
  isDefault: boolean;
  updatedAt?: number;
  type?: string;
  baseAddress?: string;
  detailAddress?: string;
  receiverName?: string;
  receiverPhoneNumber1?: string;
  receiverPhoneNumber2?: string;
  zoneNumber?: string;
  zipCode?: string;
}
export interface KakaoUser {
  id: number;
  hasSignedUp?: boolean | null;
  uuid?: string | null;
  groupUserToken?: string | null;
  email: string;
  name?: string | null;
  nickname: string;
  profileImageUrl: string;
  thumbnailImageUrl: string;
  isDefaultImage?: boolean | null;
  phoneNumber?: string | null;
  ageRange?: string | null;
  birthday?: string | null;
  birthdayType?: string | null;
  isLeapMonth?: boolean | null;
  birthyear?: string | null;
  gender?: string | null;
  isEmailValid: boolean;
  isEmailVerified: boolean;
  isKorean?: boolean;
  ageRangeNeedsAgreement?: boolean;
  birthdayNeedsAgreement?: boolean;
  birthyearNeedsAgreement?: boolean;
  emailNeedsAgreement?: boolean;
  genderNeedsAgreement?: boolean;
  isKoreanNeedsAgreement?: boolean;
  phoneNumberNeedsAgreement?: boolean;
  profileNeedsAgreement?: boolean;
  nameNeedsAgreement?: boolean;
  profileImageNeedsAgreement?: boolean;
  profileNicknameNeedsAgreement?: boolean;
  legalName?: string | null;
  legalNameNeedsAgreement?: boolean | null;
  legalBirthDate?: string | null;
  legalBirthDateNeedsAgreement?: boolean;
  legalGender?: 'female' | 'male' | null;
  legalGenderNeedsAgreement?: boolean | null;
  connectedAt?: number;
  synchedAt?: number;
}
export interface KakaoAccessTokenInfo {
  id?: number;
  appId: number;
  expiresIn: number;
}
export function login({
  serviceTerms,
  prompts,
  useKakaoAccountLogin,
  scopes,
  nonce,
  loginHint,
  channelPublicIds,
  android,
}: {
  serviceTerms?: string[];
  prompts?: ('Login' | 'Create' | 'Cert' | 'SelectAccount')[];
  scopes?: string[];
  useKakaoAccountLogin?: boolean;
  nonce?: string;
  loginHint?: string;
  channelPublicIds?: string[];
  android?: { requestCode?: number };
  web?: {
    redirectUri: string;
    scope?: string[];
    throughTalk?: boolean;
    prompt?: ('login' | 'none' | 'create' | 'select_account')[];
    loginHint?: string;
    serviceTerms?: string[];
    state?: string;
    nonce?: string;
  };
} = {}): Promise<KakaoLoginToken> {
  const requestCode = android?.requestCode;
  kAssert(
    requestCode == null ||
      (Number.isInteger(requestCode) &&
        requestCode >= minActivityRequestCode &&
        requestCode <= maxActivityRequestCode),
    `[login] android.requestCode must be an integer from ${minActivityRequestCode} to ${maxActivityRequestCode}`,
  );

  kAssert(
    !useKakaoAccountLogin ? !is.notEmptyArray(prompts) && !is.notEmptyArray(scopes) : true,
    '[login] `prompts` and `scopes` cannot be passed if useKakaoAccountLogin is false.',
  );

  kAssert(
    is.notEmptyArray(scopes)
      ? !is.notEmptyArray(prompts) &&
          !is.notEmptyArray(serviceTerms) &&
          !is.notEmptyArray(channelPublicIds)
      : true,
    '[login] `scopes` cannot be passed with `prompts`, `serviceTerms`, or `channelPublicIds`',
  );

  kAssert(
    loginHint == null ||
      (!is.notEmptyArray(scopes) &&
        !is.notEmptyArray(serviceTerms) &&
        !is.notEmptyArray(channelPublicIds)),
    '[login] `loginHint` cannot be passed with `scopes`, `serviceTerms`, or `channelPublicIds` on native platforms.',
  );

  return Native.login(
    serviceTerms ?? [],
    prompts ?? [],
    useKakaoAccountLogin ?? false,
    scopes ?? [],
    nonce,
    loginHint,
    channelPublicIds ?? [],
    requestCode,
  );
}

export async function signup({ properties }: { properties?: Record<string, string> } = {}) {
  await Native.signup(properties);
}

export function loginWithKakao({
  uiMode = 'auto',
  prompts,
  loginHint,
  nonce,
  channelPublicIds,
  serviceTerms,
  ios,
}: {
  uiMode?: 'auto' | 'light' | 'dark';
  prompts?: ('Login' | 'Create' | 'Cert' | 'SelectAccount')[];
  loginHint?: string;
  nonce?: string;
  channelPublicIds?: string[];
  serviceTerms?: string[];
  ios?: {
    orientation?: 'auto' | 'portrait' | 'landscape';
    launchMethod?: 'UniversalLink' | 'CustomScheme';
  };
} = {}): Promise<KakaoLoginToken> {
  return Native.loginWithKakao(
    uiMode,
    ios?.orientation ?? 'auto',
    ios?.launchMethod ?? 'UniversalLink',
    prompts ?? [],
    loginHint,
    nonce,
    channelPublicIds ?? [],
    serviceTerms ?? [],
  );
}

export function refreshToken({
  token,
  ios,
}: {
  token?: KakaoLoginToken;
  ios?: { loggingEnabled?: boolean };
} = {}): Promise<KakaoLoginToken> {
  kAssert(
    ios?.loggingEnabled == null || typeof ios.loggingEnabled === 'boolean',
    '[refreshToken] ios.loggingEnabled must be a boolean',
  );

  if (token !== undefined) {
    kAssert(
      token != null &&
        is.string(token.accessToken) &&
        token.accessToken.length > 0 &&
        is.string(token.refreshToken) &&
        token.refreshToken.length > 0,
      '[refreshToken] token must contain non-empty accessToken and refreshToken strings',
    );

    kAssert(
      [token.accessTokenExpiresAt, token.refreshTokenExpiresAt].every(
        (value) => Number.isFinite(value) && !Number.isNaN(new Date(value * 1000).getTime()),
      ) && [token.accessTokenExpiresIn, token.refreshTokenExpiresIn].every(Number.isFinite),
      '[refreshToken] token expiry timestamps must be valid Unix seconds and lifetimes must be finite',
    );

    kAssert(
      (token.tokenType == null || is.string(token.tokenType)) &&
        (token.idToken == null || is.string(token.idToken)) &&
        Array.isArray(token.scopes) &&
        token.scopes.every((scope) => is.string(scope)),
      '[refreshToken] tokenType and idToken must be strings when present, and scopes must be strings',
    );
  }

  return Native.refreshToken(token, ios?.loggingEnabled ?? true);
}

export function logout() {
  return Native.logout();
}

export function unlink() {
  return Native.unlink();
}

export function isLogined() {
  return Native.isLogined();
}

export const hasToken = Native.hasToken;

export function isKakaoTalkLoginAvailable(): Promise<boolean> {
  return Native.isKakaoTalkLoginAvailable();
}

export function scopes(scopes?: string[]): Promise<KakaoScopeInfo[]> {
  return Native.scopes(scopes);
}

export function revokeScopes(scopes: string[]): Promise<void> {
  return Native.revokeScopes(scopes);
}

export function serviceTerms({
  result,
  tags,
}: {
  result?: 'agreed_service_terms' | 'app_service_terms';
  tags?: string[];
} = {}): Promise<KakaoServiceTerms[]> {
  return Native.serviceTerms(result, tags);
}

export async function shippingAddresses({
  addressId,
  fromUpdatedAt,
  pageSize,
}: {
  addressId?: number;
  fromUpdatedAt?: number;
  pageSize?: number;
} = {}): Promise<KakaoShippingAddressResult> {
  validateShippingAddressOptions({ addressId, fromUpdatedAt, pageSize });

  return Native.shippingAddresses(addressId, fromUpdatedAt, pageSize);
}

export function revokeServiceTerms(tags: string[]): Promise<KakaoRevokedServiceTerms[]> {
  return Native.revokeServiceTerms(tags);
}

export function selectShippingAddress(): Promise<number> {
  return Native.selectShippingAddress();
}

export function me({
  secureResource = true,
}: { secureResource?: boolean } = {}): Promise<KakaoUser> {
  return Native.me(secureResource);
}

export async function issueAccessTokenWithCode({
  code,
  codeVerifier,
  redirectUri,
}: KakaoCodeTokenOptions): Promise<KakaoLoginToken> {
  kAssert(is.string(code) && code.length > 0, '[issueAccessTokenWithCode] code is required');

  return Native.issueAccessTokenWithCode(code, codeVerifier, redirectUri);
}

export function getAccessToken(): Promise<KakaoAccessTokenInfo> {
  return Native.getAccessToken();
}

export function updateProfile({
  properties,
}: {
  properties: Record<string, string>;
}): Promise<void> {
  return Native.updateProfile(properties);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function setAccessTokenWeb(token: string) {}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function issueAccessTokenWithCodeWeb(params: {
  redirectUri: string;
  clientSecret?: string;
  code: string;
  codeVerifier?: string;
}): Promise<{
  tokenType: string;
  accessToken: string;
  idToken?: string;
  expiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
  scope?: string;
}> {
  return {} as any;
}

const KakaoUser = {
  login,
  loginWithKakao,
  refreshToken,
  issueAccessTokenWithCode,
  signup,
  logout,
  unlink,
  isLogined,
  hasToken,
  isKakaoTalkLoginAvailable,
  scopes,
  revokeScopes,
  serviceTerms,
  revokeServiceTerms,
  shippingAddresses,
  selectShippingAddress,
  me,
  updateProfile,
  getAccessToken,
  setAccessTokenWeb,
  issueAccessTokenWithCodeWeb,
};
export default KakaoUser;
export type KakaoUserAPI = typeof KakaoUser;
