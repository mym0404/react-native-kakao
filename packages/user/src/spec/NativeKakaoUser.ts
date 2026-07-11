import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

import type {
  KakaoAccessTokenInfo,
  KakaoLoginToken,
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
  scopes(scopes?: string[]): Promise<KakaoScopeInfo[]>;
  revokeScopes(scopes: string[]): Promise<void>;
  serviceTerms(): Promise<KakaoServiceTerms[]>;
  shippingAddresses(): Promise<KakaoShippingAddressResult>;
  me(): Promise<KakaoUser>;
  getAccessToken(): Promise<KakaoAccessTokenInfo>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNCKakaoUser');
