#import "RNCKakaoUser.h"
#import "RNCKakaoUser-Swift.h"

@implementation RNCKakaoUser

- (RNCKakaoUserManager*)manager {
  return [RNCKakaoUserManager shared];
}

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(isKakaoTalkLoginAvailable
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject) {
  [[self manager] isKakaoTalkLoginAvailable:resolve reject:reject];
}

RCT_EXPORT_METHOD(login
                  : (NSArray*)serviceTerms prompts
                  : (NSArray*)prompts useKakaoAccountLoginIos
                  : (BOOL)useKakaoAccountLoginIos resolve
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject) {
  [[self manager] login:serviceTerms
                      prompts:prompts
      useKakaoAccountLoginIos:useKakaoAccountLoginIos
                      resolve:resolve
                       reject:reject];
}

RCT_EXPORT_METHOD(logout : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] logout:resolve reject:reject];
}

RCT_EXPORT_METHOD(unlink : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] unlink:resolve reject:reject];
}

RCT_EXPORT_METHOD(isLogined
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject) {
  [[self manager] isLogined:resolve reject:reject];
}

// Don't compile this code when we build for the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams&)params {
  return std::make_shared<facebook::react::NativeKakaoUserSpecJSI>(params);
}
#endif

@end
