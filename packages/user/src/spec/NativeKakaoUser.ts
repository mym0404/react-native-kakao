import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

import type { KakaoLoginToken } from '..';

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
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNCKakaoUser');
