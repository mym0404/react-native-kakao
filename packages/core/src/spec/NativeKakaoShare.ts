import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { Int32 } from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  multiply(a: number, b: number): Promise<number>;
  add(a: Int32, b: Int32): Int32;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNCKakaoShare');
