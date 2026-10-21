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
RCT_EXPORT_METHOD(
    login : (NSArray*)serviceTerms prompts : (NSArray*)prompts useKakaoAccountLogin : (BOOL)
        useKakaoAccountLogin scopes : (NSArray*)scopes nonce : (NSString*)
            nonce loginHint : (NSString*)loginHint channelPublicIds : (NSArray*)channelPublicIds
                resolve : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] login:serviceTerms
                   prompts:prompts
      useKakaoAccountLogin:useKakaoAccountLogin
                    scopes:scopes
                     nonce:nonce
                 loginHint:loginHint
          channelPublicIds:channelPublicIds
                   resolve:resolve
                    reject:reject];
}

RCT_EXPORT_METHOD(signup : (NSDictionary*)properties resolve : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] signup:properties resolve:resolve reject:reject];
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

RCT_EXPORT_METHOD(hasToken : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)
                      reject) {
  [[self manager] hasToken:resolve reject:reject];
}

RCT_EXPORT_METHOD(scopes : (NSArray*)scopes resolve : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] scopes:scopes resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(revokeScopes : (NSArray*)scopes resolve : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] revokeScopes:scopes resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(serviceTerms : (NSString*)result tags : (NSArray*)tags resolve : (
    RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] serviceTerms:result tags:tags resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(shippingAddresses : (NSNumber*)addressId fromUpdatedAt : (
    NSNumber*)fromUpdatedAt pageSize : (NSNumber*)pageSize resolve : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] shippingAddresses:addressId
                      fromUpdatedAt:fromUpdatedAt
                           pageSize:pageSize
                            resolve:resolve
                             reject:reject];
}

RCT_EXPORT_METHOD(revokeServiceTerms : (NSArray*)tags resolve : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] revokeServiceTerms:tags resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(updateProfile : (NSDictionary*)properties resolve : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] updateProfile:properties resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(me : (NSArray*)propertyKeys secureResource : (NSNumber*)secureResource resolve : (
    RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] me:propertyKeys secureResource:secureResource resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(selectShippingAddress : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] selectShippingAddress:resolve reject:reject];
}

RCT_EXPORT_METHOD(getAccessToken : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)
                      reject) {
  [[self manager] getAccessToken:resolve reject:reject];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams&)params {
  return std::make_shared<facebook::react::NativeKakaoUserSpecJSI>(params);
}

@end
