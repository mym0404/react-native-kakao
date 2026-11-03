import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';

import type { KakaoCertSessionInfo, KakaoCertSignStatusInfo, KakaoCertTokenInfo } from '..';

export interface Spec extends TurboModule {
  certLoginWithKakaoTalk(options: UnsafeObject): Promise<KakaoCertTokenInfo>;
  certLoginWithKakaoAccount(options: UnsafeObject): Promise<KakaoCertTokenInfo>;
  issueCertTokenWithCode(
    code: string,
    codeVerifier?: string,
    redirectUri?: string,
  ): Promise<KakaoCertTokenInfo>;
  publicKey(certType: string): Promise<string | null>;
  sessionInfo(certType: string): Promise<KakaoCertSessionInfo | null>;
  fetchSessionInfo(certType: string, txId: string): Promise<KakaoCertSessionInfo>;
  fetchSessionInfoByAppKey(
    certType: string,
    txId: string,
    targetAppKey?: string,
  ): Promise<KakaoCertSessionInfo>;
  isValidSession(certType: string): Promise<boolean>;
  deleteKeyPair(certType: string): Promise<void>;
  reducedSign(certType: string, data: string): Promise<string>;
  isKakaoTalkSignAvailable(): Promise<boolean>;
  signWithKakaoTalk(txId: string, targetAppKey?: string): Promise<KakaoCertSignStatusInfo>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNCKakaoCert');
