import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export type KakaoSDKInfo = {
  version: string;
  isInitialized: boolean;
  appKey?: string;
  kaHeader?: string;
  redirectUri?: string;
  loggingEnabled?: boolean;
};

export interface Spec extends TurboModule {
  initializeKakaoSDK(
    appKey: string,
    loggingEnabled: boolean,
    customScheme?: string,
    androidSdkIdentifier?: string,
  ): Promise<void>;
  getKakaoSDKInfo(): Promise<KakaoSDKInfo>;
  getKeyHashAndroid(): Promise<string | undefined>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNCKakaoCore');
