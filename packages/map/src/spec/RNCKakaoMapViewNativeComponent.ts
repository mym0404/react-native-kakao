import type { ViewProps } from 'react-native';
import type { Double } from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeCommands from 'react-native/Libraries/Utilities/codegenNativeCommands';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

interface Camera {
  lat: Double;
  lng: Double;
  tilt?: Double;
  rotation?: Double;
  zoomLevel?: Double;
}
interface Props extends ViewProps {
  buildingScale?: Double;
  overlays?: ReadonlyArray<string>;
  poiEnabled?: boolean;
  poiClickable?: boolean;
  poiScale?: string;
  language?: string;
  baseMapType?: string;
  camera?: Camera;
  initialCamera?: Camera;
  cameraMinLevel?: Double;
  cameraMaxLevel?: Double;
  cameraAnimationDuration?: Double;
}

// type ComponentType = HostComponent<Props>;

interface NativeCommands {}

export default codegenNativeComponent<Props>('RNCKakaoMapView');
export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: [],
});
