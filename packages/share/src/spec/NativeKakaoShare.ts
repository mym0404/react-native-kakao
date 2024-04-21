import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { Int32, UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  shareCustom(
    templateId: Int32,
    useWebBrowserIfKakaoTalkNotAvailable: boolean,
    templateArgs: UnsafeObject,
    serverCallbackArgs: UnsafeObject,
  ): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNCKakaoShare');
