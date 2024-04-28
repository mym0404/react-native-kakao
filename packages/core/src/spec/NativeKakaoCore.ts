import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  initializeKakaoSDK(appKey: string): void;
  getKeyHashAndroid(): Promise<string | undefined>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNCKakaoCore');
