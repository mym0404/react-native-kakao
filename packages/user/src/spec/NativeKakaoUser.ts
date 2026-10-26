import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';

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
    loginHint?: string,
    channelPublicIds?: string[],
  ): Promise<KakaoLoginToken>;
  loginWithKakao(
    uiMode: string,
    orientation: string,
    launchMethod: string,
    prompts: string[],
    loginHint?: string,
    nonce?: string,
    channelPublicIds?: string[],
    serviceTerms?: string[],
  ): Promise<KakaoLoginToken>;
  refreshToken(): Promise<KakaoLoginToken>;
  signup(properties?: UnsafeObject): Promise<void>;
  logout(): Promise<void>;
  unlink(): Promise<void>;
  isLogined(): Promise<boolean>;
  hasToken(): Promise<boolean>;
  scopes(scopes?: string[]): Promise<KakaoScopeInfo[]>;
  revokeScopes(scopes: string[]): Promise<void>;
  serviceTerms(result?: string, tags?: string[]): Promise<KakaoServiceTerms[]>;
  revokeServiceTerms(tags: string[]): Promise<KakaoRevokedServiceTerms[]>;
  shippingAddresses(
    addressId?: number,
    fromUpdatedAt?: number,
    pageSize?: number,
  ): Promise<KakaoShippingAddressResult>;
  selectShippingAddress(): Promise<number>;
  me(secureResource?: boolean): Promise<KakaoUser>;
  updateProfile(properties: UnsafeObject): Promise<void>;
  getAccessToken(): Promise<KakaoAccessTokenInfo>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNCKakaoUser');
