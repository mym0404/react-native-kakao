import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  init(): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNCKakaoCore');
