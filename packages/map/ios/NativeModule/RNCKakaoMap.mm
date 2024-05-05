#import "RNCKakaoMap.h"

@implementation RNCKakaoMap

- (void)initializeKakaoMapSDK:(NSString*)appKey
                      resolve:(RCTPromiseResolveBlock)resolve
                       reject:(RCTPromiseRejectBlock)reject {
  [SDKInitializer InitSDKWithAppKey:appKey];
  resolve(@(42));
}

RCT_EXPORT_MODULE()

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams&)params {
  return std::make_shared<facebook::react::NativeKakaoMapSpecJSI>(params);
}

@end
