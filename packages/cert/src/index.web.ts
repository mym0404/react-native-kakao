import { filterNonNullishKeys } from '@mj-studio/js-util';
import { kCreateWebError, kRunWebAPI } from '@react-native-kakao/core';

import type { KakaoCertAPI } from './index';

declare const Kakao: { Auth: { authorizeForCert: (options: object) => void } };

const unsupportedPlatformErrorCode = 'Package-UnsupportedPlatform';

async function unsupported(): Promise<never> {
  kCreateWebError({
    code: unsupportedPlatformErrorCode,
    message: 'This certification operation requires the Android or iOS Cert SDK.',
  });
}

const KakaoCert: KakaoCertAPI = {
  certLoginWithKakaoTalk: unsupported,
  certLoginWithKakaoAccount: unsupported,
  issueCertTokenWithCode: async () => {
    kCreateWebError({
      code: unsupportedPlatformErrorCode,
      message: 'issueCertTokenWithCode is only available on iOS.',
    });
  },
  getPublicKey: unsupported,
  getSessionInfo: unsupported,
  fetchSessionInfo: unsupported,
  fetchSessionInfoByAppKey: unsupported,
  isValidSession: unsupported,
  deleteKeyPair: unsupported,
  reducedSign: unsupported,
  isKakaoTalkSignAvailable: async () => false,
  signWithKakaoTalk: unsupported,
  authorizeForCertWeb: (options) =>
    kRunWebAPI(() => {
      Kakao.Auth.authorizeForCert(
        filterNonNullishKeys({
          ...options,
          prompt: options.prompt?.join(','),
          scope: options.scope?.join(','),
          serviceTerms: options.serviceTerms?.join(','),
          identifyItems: options.identifyItems?.join(','),
        }),
      );
    }),
};

export const {
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
} = KakaoCert;
export default KakaoCert;
