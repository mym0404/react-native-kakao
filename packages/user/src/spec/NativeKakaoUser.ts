import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';

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
  serviceTerms(result?: string, tags?: string[]): Promise<KakaoServiceTerms[]>;
  shippingAddresses(): Promise<KakaoShippingAddressResult>;
  selectShippingAddress(): Promise<number>;
  me(propertyKeys?: string[]): Promise<KakaoUser>;
  updateProfile(properties: UnsafeObject): Promise<void>;
  getAccessToken(): Promise<KakaoAccessTokenInfo>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNCKakaoUser');
