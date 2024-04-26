#import "RNCKakaoSocial.h"
#import "RNCKakaoSocial-Swift.h"

@implementation RNCKakaoSocial

- (RNCKakaoSocialManager*)manager {
  return [RNCKakaoSocialManager shared];
}

RCT_EXPORT_MODULE()

- (void)getProfile:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[self manager] getProfile:resolve reject:reject];
}

- (void)selectFriends:(BOOL)multiple
                 mode:(NSString*)mode
              options:(NSDictionary*)options
              resolve:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject {
  [[self manager] selectFriends:multiple mode:mode options:options resolve:resolve reject:reject];
}

// Don't compile this code when we build for the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams&)params {
  return std::make_shared<facebook::react::NativeKakaoSocialSpecJSI>(params);
}
#endif

@end
