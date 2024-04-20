import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  isKakaoTalkLoginAvailable(): Promise<boolean>;
  loginWithKakaoTalk(serviceTerms?: string[]): Promise<void>;
  loginWithKakaoAccount(prompts?: string[]): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNCKakaoUser');
