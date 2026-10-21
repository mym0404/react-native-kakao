#import "RNCKakaoShare.h"
#if __has_include("RNCKakaoShare-Swift.h")
#import "RNCKakaoShare-Swift.h"
#else
#import <RNCKakaoShare/RNCKakaoShare-Swift.h>
#endif

@implementation RNCKakaoShare

- (RNCKakaoShareManager*)manager {
  return [RNCKakaoShareManager shared];
}

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(uploadImage : (NSString*)imageUri secureResource : (BOOL)
                      secureResource resolve : (RCTPromiseResolveBlock)
                          resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] uploadImage:imageUri secureResource:secureResource resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(
    shareScrapTemplate : (NSString*)requestUrl useWebBrowserIfKakaoTalkNotAvailable : (BOOL)
        useWebBrowserIfKakaoTalkNotAvailable templateId : (NSNumber*)templateId templateArgs : (
            NSDictionary*)templateArgs serverCallbackArgs : (NSDictionary*)serverCallbackArgs
            resolve : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] shareScrapTemplate:requestUrl
      useWebBrowserIfKakaoTalkNotAvailable:useWebBrowserIfKakaoTalkNotAvailable
                                templateId:templateId
                              templateArgs:templateArgs
                        serverCallbackArgs:serverCallbackArgs
                                   resolve:resolve
                                    reject:reject];
}

RCT_EXPORT_METHOD(scrapImage : (NSString*)imageUrl secureResource : (BOOL)secureResource resolve : (
    RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] scrapImage:imageUrl secureResource:secureResource resolve:resolve reject:reject];
}

// RNC_KAKAO_SHARE_EXPORT_DEFAULT_TEMPLATE(shareFeedTemplate, feed)
// RNC_KAKAO_SHARE_EXPORT_DEFAULT_TEMPLATE(shareListTemplate, list)
// RNC_KAKAO_SHARE_EXPORT_DEFAULT_TEMPLATE(shareLocationTemplate, location)
// RNC_KAKAO_SHARE_EXPORT_DEFAULT_TEMPLATE(shareCommerceTemplate, commerce)
// RNC_KAKAO_SHARE_EXPORT_DEFAULT_TEMPLATE(shareTextTemplate, text)
// RNC_KAKAO_SHARE_EXPORT_DEFAULT_TEMPLATE(shareCalendarTemplate, calendar)

RCT_EXPORT_METHOD(
    shareOrSendMeOrSendFriendOrWhatever : (NSString*)sendType templateType : (NSString*)
        templateType templateId : (double)templateId templateJson : (NSDictionary*)templateJson
            receiverUuids : (NSArray*)receiverUuids useWebBrowserIfKakaoTalkNotAvailable : (BOOL)
                useWebBrowserIfKakaoTalkNotAvailable templateArgs : (NSDictionary*)
                    templateArgs serverCallbackArgs : (NSDictionary*)serverCallbackArgs resolve : (
                        RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] shareOrSendMeOrSendFriendOrWhatever:sendType
                                         templateType:templateType
                                           templateId:templateId
                                         templateJson:templateJson
                                        receiverUuids:receiverUuids
                 useWebBrowserIfKakaoTalkNotAvailable:useWebBrowserIfKakaoTalkNotAvailable
                                         templateArgs:templateArgs
                                   serverCallbackArgs:serverCallbackArgs
                                              resolve:resolve
                                               reject:reject];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams&)params {
  return std::make_shared<facebook::react::NativeKakaoShareSpecJSI>(params);
}

@end
