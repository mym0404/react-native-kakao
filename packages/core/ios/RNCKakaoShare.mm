#import "RNCKakaoCore.h"

@implementation RNCKakaoCore
RCT_EXPORT_MODULE()

// Example method
// See // https://reactnative.dev/docs/native-modules-ios
RCT_EXPORT_METHOD(multiply
                  : (double)a b
                  : (double)b resolve
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject) {
  NSNumber* result = @(a * b);

  resolve(result);
}

- (NSNumber*)add:(double)a b:(double)b {
  return @(a + b);
}

// Don't compile this code when we build for the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams&)params {
  return std::make_shared<facebook::react::NativeKakaoCoreSpecJSI>(params);
}
#endif

@end
