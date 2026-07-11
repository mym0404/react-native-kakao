#import "RNCKakaoUser.h"
#if __has_include("RNCKakaoUser-Swift.h")
#import "RNCKakaoUser-Swift.h"
#else
#import <RNCKakaoUser/RNCKakaoUser-Swift.h>
#endif

@implementation RNCKakaoUser

- (RNCKakaoUserManager*)manager {
  return [RNCKakaoUserManager shared];
}

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(isKakaoTalkLoginAvailable : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] isKakaoTalkLoginAvailable:resolve reject:reject];
}
RCT_EXPORT_METHOD(login : (NSArray*)serviceTerms prompts : (NSArray*)
                      prompts useKakaoAccountLogin : (BOOL)useKakaoAccountLogin scopes : (NSArray*)
                          scopes nonce : (NSString*)nonce resolve : (RCTPromiseResolveBlock)
                              resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] login:serviceTerms
                   prompts:prompts
      useKakaoAccountLogin:useKakaoAccountLogin
                    scopes:scopes
                     nonce:nonce
                   resolve:resolve
                    reject:reject];
}

RCT_EXPORT_METHOD(logout : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] logout:resolve reject:reject];
}

RCT_EXPORT_METHOD(unlink : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] unlink:resolve reject:reject];
}

RCT_EXPORT_METHOD(isLogined : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)
                      reject) {
  [[self manager] isLogined:resolve reject:reject];
}

RCT_EXPORT_METHOD(scopes : (NSArray*)scopes resolve : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] scopes:scopes resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(revokeScopes : (NSArray*)scopes resolve : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] revokeScopes:scopes resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(serviceTerms : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)
                      reject) {
  [[self manager] serviceTerms:resolve reject:reject];
}

RCT_EXPORT_METHOD(shippingAddresses : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] shippingAddresses:resolve reject:reject];
}

RCT_EXPORT_METHOD(me : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] me:resolve reject:reject];
}

RCT_EXPORT_METHOD(getAccessToken : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)
                      reject) {
  [[self manager] getAccessToken:resolve reject:reject];
}

// Don't compile this code when we build for the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams&)params {
  return std::make_shared<facebook::react::NativeKakaoUserSpecJSI>(params);
}
#endif

@end
