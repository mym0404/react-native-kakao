import { kAssert, kCreateWebError } from '@react-native-kakao/core';
import type { KakaoLoginToken } from '@react-native-kakao/user';

import Native from './spec/NativeKakaoCert';

export type KakaoCertType = 'K2100' | 'K2220' | 'K3220';
export type KakaoCertSessionType = Exclude<KakaoCertType, 'K2100'>;
const signerInformationItems = ['ci', 'name', 'birthday', 'phone_number'] as const;
const certificationPrompts = ['Login', 'Create', 'SelectAccount'] as const;
const accountCertType = 'K2100';

export type KakaoCertIdentifyItem = (typeof signerInformationItems)[number];
type KakaoCertLoginBase = {
  prompts?: (typeof certificationPrompts)[number][];
  identifyItems?: KakaoCertIdentifyItem[];
  nonce?: string;
};
type KakaoCertLoginRequest =
  | { certType: 'K2100'; settleId: string; signData: string }
  | { certType: 'K2220'; txId: string };

export type KakaoCertTalkLoginOptions = KakaoCertLoginBase &
  KakaoCertLoginRequest & {
    channelPublicIds?: string[];
    serviceTerms?: string[];
    ios?: { launchMethod?: 'UniversalLink' | 'CustomScheme' };
    android?: { requestCode?: number };
  };
export type KakaoCertAccountLoginOptions = KakaoCertLoginBase & {
  certType: 'K2100';
  settleId: string;
  signData: string;
  loginHint?: string;
  android?: { channelPublicIds?: string[]; serviceTerms?: string[] };
};
export type KakaoCertTokenInfo = { token: KakaoLoginToken; txId: string };
export type KakaoCertCodeTokenOptions = {
  code: string;
  codeVerifier?: string;
  redirectUri?: string;
};
export type KakaoCertSessionInfo = {
  userId?: number | null;
  sessionStartAt: number;
  sessionEndAt: number;
};
export type KakaoCertSignStatusInfo = {
  txId: string;
  requestedAt?: number | null;
  requestExpiredAt?: number | null;
  signedAt?: number | null;
};
export type KakaoCertWebAuthorizeOptions = {
  redirectUri: string;
  settleId: string;
  signData: string;
  state?: string;
  prompt?: ('login' | 'create' | 'select_account')[];
  scope?: string[];
  throughTalk?: boolean;
  throughSyncplugin?: boolean;
  serviceTerms?: string[];
  channelPublicId?: string;
  deviceType?: 'watch' | 'tv';
  loginHint?: string;
  nonce?: string;
  identifyItems?: KakaoCertIdentifyItem[];
};

const maxActivityRequestCode = 65535;

export async function certLoginWithKakaoTalk(options: KakaoCertTalkLoginOptions) {
  validateLoginRequest(options);

  const requestCode = options.android?.requestCode;
  kAssert(
    requestCode == null ||
      (Number.isInteger(requestCode) && requestCode >= 0 && requestCode <= maxActivityRequestCode),
    `[certLoginWithKakaoTalk] requestCode must be an integer from 0 to ${maxActivityRequestCode}`,
  );

  return Native.certLoginWithKakaoTalk(options);
}

export async function certLoginWithKakaoAccount(options: KakaoCertAccountLoginOptions) {
  kAssert(
    options.certType === accountCertType,
    '[certLoginWithKakaoAccount] certType must be K2100',
  );
  validateLoginRequest(options);

  return Native.certLoginWithKakaoAccount(options);
}

export async function issueCertTokenWithCode({
  code,
  codeVerifier,
  redirectUri,
}: KakaoCertCodeTokenOptions): Promise<KakaoCertTokenInfo> {
  kAssert(typeof code === 'string' && code.length > 0, '[issueCertTokenWithCode] code is required');

  return Native.issueCertTokenWithCode(code, codeVerifier, redirectUri);
}

export async function getPublicKey({ certType }: { certType: KakaoCertSessionType }) {
  return (await Native.publicKey(certType)) ?? undefined;
}

export async function getSessionInfo({ certType }: { certType: KakaoCertSessionType }) {
  return (await Native.sessionInfo(certType)) ?? undefined;
}

export function fetchSessionInfo({ certType, txId }: { certType: 'K2220'; txId: string }) {
  return Native.fetchSessionInfo(certType, txId);
}

export function fetchSessionInfoByAppKey({
  certType,
  txId,
  targetAppKey,
}: {
  certType: 'K3220';
  txId: string;
  targetAppKey?: string;
}) {
  return Native.fetchSessionInfoByAppKey(certType, txId, targetAppKey);
}

export function isValidSession({ certType }: { certType: KakaoCertSessionType }) {
  return Native.isValidSession(certType);
}

export function deleteKeyPair({ certType }: { certType: KakaoCertSessionType }) {
  return Native.deleteKeyPair(certType);
}

export function reducedSign({ certType, data }: { certType: KakaoCertSessionType; data: string }) {
  return Native.reducedSign(certType, data);
}

export function isKakaoTalkSignAvailable() {
  return Native.isKakaoTalkSignAvailable();
}

export function signWithKakaoTalk({ txId, targetAppKey }: { txId: string; targetAppKey?: string }) {
  return Native.signWithKakaoTalk(txId, targetAppKey);
}

export async function authorizeForCertWeb(_options: KakaoCertWebAuthorizeOptions): Promise<void> {
  kCreateWebError({
    code: 'Package-UnsupportedPlatform',
    message: 'authorizeForCertWeb is available on web only.',
  });
}

function validateLoginRequest(options: KakaoCertLoginRequest & KakaoCertLoginBase) {
  kAssert(
    options.prompts?.every((prompt) => certificationPrompts.includes(prompt)) ?? true,
    '[cert login] unsupported prompt',
  );

  kAssert(
    options.identifyItems?.every((item) => signerInformationItems.includes(item)) ?? true,
    '[cert login] unsupported signer information',
  );

  if (options.certType === accountCertType) {
    kAssert(
      !!options.settleId && !!options.signData,
      '[cert login] settleId and signData are required',
    );
  } else {
    kAssert(options.certType === 'K2220' && !!options.txId, '[cert login] K2220 requires txId');
  }
}

const KakaoCert = {
  certLoginWithKakaoTalk,
  certLoginWithKakaoAccount,
  issueCertTokenWithCode,
  getPublicKey,
  getSessionInfo,
  fetchSessionInfo,
  fetchSessionInfoByAppKey,
  isValidSession,
  deleteKeyPair,
  reducedSign,
  isKakaoTalkSignAvailable,
  signWithKakaoTalk,
  authorizeForCertWeb,
};
export default KakaoCert;
export type KakaoCertAPI = typeof KakaoCert;
