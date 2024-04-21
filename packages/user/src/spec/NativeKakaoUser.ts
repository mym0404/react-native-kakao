import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

import type {
  KakaoAppServiceTerms,
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
    useKakaoAccountLoginIos: boolean,
  ): Promise<KakaoLoginToken>;
  logout(): Promise<void>;
  unlink(): Promise<void>;
  isLogined(): Promise<boolean>;
  scopes(scopes?: string[]): Promise<KakaoScopeInfo[]>;
  revokeScopes(scopes: string[]): Promise<void>;
  serviceTerms(): Promise<{
    allowedServiceTerms?: KakaoServiceTerms[];
    appServiceTerms?: KakaoAppServiceTerms[];
  }>;
  shippingAddresses(): Promise<KakaoShippingAddressResult>;
  me(): Promise<KakaoUser>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNCKakaoUser');
