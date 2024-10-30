#import "RNCKakaoSocial.h"

#if __has_include("RNCKakaoSocial-Swift.h")
#import "RNCKakaoSocial-Swift.h"
#else
#import <RNCKakaoSocial/RNCKakaoSocial-Swift.h>
#endif

@implementation RNCKakaoSocial

- (RNCKakaoSocialManager*)manager {
  return [RNCKakaoSocialManager shared];
}

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(getProfile : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)
                      reject) {
  [[self manager] getProfile:resolve reject:reject];
}

RCT_EXPORT_METHOD(selectFriends : (BOOL)multiple mode : (NSString*)mode options : (NSDictionary*)
                      options resolve : (RCTPromiseResolveBlock)
                          resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] selectFriends:multiple mode:mode options:options resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(getFriends : (NSDictionary*)options resolve : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] getFriendsWithOptions:options resolve:resolve reject:reject];
}

// Don't compile this code when we build for the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams&)params {
  return std::make_shared<facebook::react::NativeKakaoSocialSpecJSI>(params);
}
#endif

@end
