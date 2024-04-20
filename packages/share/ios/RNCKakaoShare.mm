#import "RNCKakaoShare.h"
#import "RNCKakaoShare-Swift.h"

@implementation RNCKakaoShare

- (RNCKakaoShareManager*)manager {
  return [RNCKakaoShareManager shared];
}

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(multiply
                  : (double)a b
                  : (double)b resolve
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject) {
  NSNumber* result = @(a * b);

  resolve(result);
}

// Don't compile this code when we build for the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams&)params {
  return std::make_shared<facebook::react::NativeKakaoShareSpecJSI>(params);
}
#endif

@end
