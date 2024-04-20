#import "RNCKakaoUser.h"
#import "RNCKakaoUser-Swift.h"

@implementation RNCKakaoUser

+ (BOOL)isKakaoTalkLoginUrl:(NSURL*)url {
  return [RNCKakaoUserManager isKakaoTalkLoginUrl:url];
}

+ (BOOL)handleOpenUrl:(NSURL*)url {
  return [RNCKakaoUserManager handleOpenUrl:url];
}

- (RNCKakaoUserManager*)manager {
  return [RNCKakaoUserManager shared];
}

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(isKakaoTalkLoginAvailable
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject) {
  [[self manager] isKakaoTalkLoginAvailable:resolve reject:reject];
}

RCT_EXPORT_METHOD(loginWithKakaoTalk
                  : (NSArray*)serviceTerms resolve
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject) {
  [[self manager] loginWithKakaoTalk:serviceTerms resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(loginWithKakaoAccount
                  : (NSArray*)prompts resolve
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject) {
  [[self manager] loginWithKakaoAccount:prompts resolve:resolve reject:reject];
}

// Don't compile this code when we build for the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams&)params {
  return std::make_shared<facebook::react::NativeKakaoUserSpecJSI>(params);
}
#endif

@end
