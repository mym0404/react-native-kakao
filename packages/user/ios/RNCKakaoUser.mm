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
                  : (BOOL)useKakaoAccountLogin scopes
                  : (NSArray*)scopes resolve
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject) {
  [[self manager] login:serviceTerms
                   prompts:prompts
      useKakaoAccountLogin:useKakaoAccountLogin
                    scopes:scopes
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

RCT_EXPORT_METHOD(scopes
                  : (NSArray*)scopes resolve
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject) {
  [[self manager] scopes:scopes resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(revokeScopes
                  : (NSArray*)scopes resolve
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject) {
  [[self manager] revokeScopes:scopes resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(serviceTerms
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject) {
  [[self manager] serviceTerms:resolve reject:reject];
}

RCT_EXPORT_METHOD(shippingAddresses
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject) {
  [[self manager] shippingAddresses:resolve reject:reject];
}

RCT_EXPORT_METHOD(me : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] me:resolve reject:reject];
}

// Don't compile this code when we build for the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams&)params {
  return std::make_shared<facebook::react::NativeKakaoUserSpecJSI>(params);
}
#endif

@end
