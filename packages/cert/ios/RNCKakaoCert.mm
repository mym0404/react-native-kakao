#import "RNCKakaoCert.h"

#if __has_include("RNCKakaoCert-Swift.h")
#import "RNCKakaoCert-Swift.h"
#else
#import <RNCKakaoCert/RNCKakaoCert-Swift.h>
#endif

@implementation RNCKakaoCert
RCT_EXPORT_MODULE()

- (RNCKakaoCertManager*)manager {
  return [RNCKakaoCertManager shared];
}

RCT_EXPORT_METHOD(certLoginWithKakaoTalk : (NSDictionary*)options resolve : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] certLoginWithKakaoTalk:options resolve:resolve reject:reject];
}
RCT_EXPORT_METHOD(certLoginWithKakaoAccount : (NSDictionary*)options resolve : (
    RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] certLoginWithKakaoAccount:options resolve:resolve reject:reject];
}
RCT_EXPORT_METHOD(issueCertTokenWithCode : (NSString*)code codeVerifier : (
    NSString*)codeVerifier redirectUri : (NSString*)redirectUri resolve : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] issueCertTokenWithCode:code
                            codeVerifier:codeVerifier
                             redirectUri:redirectUri
                                 resolve:resolve
                                  reject:reject];
}
RCT_EXPORT_METHOD(publicKey : (NSString*)certType resolve : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] publicKey:certType resolve:resolve reject:reject];
}
RCT_EXPORT_METHOD(sessionInfo : (NSString*)certType resolve : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] sessionInfo:certType resolve:resolve reject:reject];
}
RCT_EXPORT_METHOD(fetchSessionInfo : (NSString*)certType txId : (NSString*)txId resolve : (
    RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] fetchSessionInfo:certType txId:txId resolve:resolve reject:reject];
}
RCT_EXPORT_METHOD(fetchSessionInfoByAppKey : (NSString*)certType txId : (NSString*)
                      txId targetAppKey : (NSString*)targetAppKey resolve : (RCTPromiseResolveBlock)
                          resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] fetchSessionInfoByAppKey:certType
                                      txId:txId
                              targetAppKey:targetAppKey
                                   resolve:resolve
                                    reject:reject];
}
RCT_EXPORT_METHOD(isValidSession : (NSString*)certType resolve : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] isValidSession:certType resolve:resolve reject:reject];
}
RCT_EXPORT_METHOD(deleteKeyPair : (NSString*)certType resolve : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] deleteKeyPair:certType resolve:resolve reject:reject];
}
RCT_EXPORT_METHOD(reducedSign : (NSString*)certType data : (NSString*)data resolve : (
    RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] reducedSign:certType data:data resolve:resolve reject:reject];
}
RCT_EXPORT_METHOD(isKakaoTalkSignAvailable : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] isKakaoTalkSignAvailable:resolve reject:reject];
}
RCT_EXPORT_METHOD(signWithKakaoTalk : (NSString*)txId targetAppKey : (NSString*)
                      targetAppKey resolve : (RCTPromiseResolveBlock)
                          resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] signWithKakaoTalk:txId targetAppKey:targetAppKey resolve:resolve reject:reject];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams&)params {
  return std::make_shared<facebook::react::NativeKakaoCertSpecJSI>(params);
}
@end
