import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

import type {
  KakaoAccessTokenInfo,
  KakaoLoginToken,
  KakaoRevokedServiceTerms,
  KakaoScopeInfo,
  KakaoServiceTerms,
  KakaoShippingAddressResult,
  KakaoUser,
} from '..';

export interface Spec extends TurboModule {
  isKakaoTalkLoginAvailable(): Promise<boolean>;
  login(
    serviceTerms: string[],
    prompts: string[],
    useKakaoAccountLogin: boolean,
    scopes?: string[],
    nonce?: string,
  ): Promise<KakaoLoginToken>;
  logout(): Promise<void>;
  unlink(): Promise<void>;
  isLogined(): Promise<boolean>;
  hasToken(): Promise<boolean>;
  scopes(scopes?: string[]): Promise<KakaoScopeInfo[]>;
  revokeScopes(scopes: string[]): Promise<void>;
  serviceTerms(result?: string, tags?: string[]): Promise<KakaoServiceTerms[]>;
  revokeServiceTerms(tags: string[]): Promise<KakaoRevokedServiceTerms[]>;
  shippingAddresses(): Promise<KakaoShippingAddressResult>;
  selectShippingAddress(): Promise<number>;
  me(): Promise<KakaoUser>;
  getAccessToken(): Promise<KakaoAccessTokenInfo>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNCKakaoUser');
