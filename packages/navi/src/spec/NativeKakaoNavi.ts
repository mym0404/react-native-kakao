import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { Double, UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';

export interface KakaoNaviOption {
  coordType?: 'WGS84' | 'KATEC';
  vehicleType?: 'First' | 'Second' | 'Third' | 'Fourth' | 'Fifth' | 'Sixth' | 'TwoWheel';
  rpOption?:
    | 'Fast'
    | 'Free'
    | 'Shortest'
    | 'NoAuto'
    | 'Wide'
    | 'Highway'
    | 'Normal'
    | 'Recommended';
  routeInfo?: boolean;
  startX?: Double;
  startY?: Double;
  startAngle?: Double;
  returnUri?: string;
}
export interface KakaoNaviLocation {
  name: string;
  x: Double;
  y: Double;
  rpflag?: string;
}

export interface Spec extends TurboModule {
  navigateOrShareTo(
    destination: UnsafeObject,
    option?: UnsafeObject,
    viaList?: ReadonlyArray<UnsafeObject>,
    openWebInstallUrlIfNaviAppNotAvailable?: boolean,
    isShare?: boolean,
  ): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNCKakaoNavi');
