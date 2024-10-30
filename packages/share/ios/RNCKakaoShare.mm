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

// Don't compile this code when we build for the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams&)params {
  return std::make_shared<facebook::react::NativeKakaoShareSpecJSI>(params);
}
#endif

@end
