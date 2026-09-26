#import "RNCKakaoCore.h"
#if __has_include("RNCKakaoCore-Swift.h")
#import "RNCKakaoCore-Swift.h"
#else
#import <RNCKakaoCore/RNCKakaoCore-Swift.h>
#endif

@implementation RNCKakaoCore

- (RNCKakaoCoreManager*)manager {
  return [RNCKakaoCoreManager shared];
}

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(initializeKakaoSDK : (NSString*)appKey) {
  [[self manager] initializeKakaoSDK:appKey];
}

RCT_EXPORT_METHOD(getKeyHashAndroid : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  resolve(nil);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams&)params {
  return std::make_shared<facebook::react::NativeKakaoCoreSpecJSI>(params);
}

@end
