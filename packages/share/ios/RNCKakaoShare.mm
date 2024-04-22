#import "RNCKakaoShare.h"
#import "RNCKakaoShare-Swift.h"

#define RNC_KAKAO_SHARE_EXPORT_DEFAULT_TEMPLATE(name, type_name)                                   \
  RCT_EXPORT_METHOD(name                                                                           \
                    : (NSDictionary*)value useWebBrowserIfKakaoTalkNotAvailable                    \
                    : (BOOL)useWebBrowserIfKakaoTalkNotAvailable serverCallbackArgs                \
                    : (NSDictionary*)serverCallbackArgs resolve                                    \
                    : (RCTPromiseResolveBlock)resolve reject                                       \
                    : (RCTPromiseRejectBlock)reject) {                                             \
    [[self manager] shareDefaultTemplate:value                                                     \
                                        type:@ #type_name                                          \
        useWebBrowserIfKakaoTalkNotAvailable:useWebBrowserIfKakaoTalkNotAvailable                  \
                          serverCallbackArgs:serverCallbackArgs                                    \
                                     resolve:resolve                                               \
                                      reject:reject];                                              \
  }

@implementation RNCKakaoShare

- (RNCKakaoShareManager*)manager {
  return [RNCKakaoShareManager shared];
}

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(shareCustom
                  : (double)templateId useWebBrowserIfKakaoTalkNotAvailable
                  : (BOOL)useWebBrowserIfKakaoTalkNotAvailable templateArgs
                  : (NSDictionary*)templateArgs serverCallbackArgs
                  : (NSDictionary*)serverCallbackArgs resolve
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject) {
  [[self manager] shareCustom:(NSInteger)templateId
      useWebBrowserIfKakaoTalkNotAvailable:useWebBrowserIfKakaoTalkNotAvailable
                              templateArgs:templateArgs
                        serverCallbackArgs:serverCallbackArgs
                                   resolve:resolve
                                    reject:reject];
}

RNC_KAKAO_SHARE_EXPORT_DEFAULT_TEMPLATE(shareFeedTemplate, feed)
RNC_KAKAO_SHARE_EXPORT_DEFAULT_TEMPLATE(shareListTemplate, list)
RNC_KAKAO_SHARE_EXPORT_DEFAULT_TEMPLATE(shareLocationTemplate, location)
RNC_KAKAO_SHARE_EXPORT_DEFAULT_TEMPLATE(shareCommerceTemplate, commerce)
RNC_KAKAO_SHARE_EXPORT_DEFAULT_TEMPLATE(shareTextTemplate, text)
RNC_KAKAO_SHARE_EXPORT_DEFAULT_TEMPLATE(shareCalendarTemplate, calendar)

// Don't compile this code when we build for the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams&)params {
  return std::make_shared<facebook::react::NativeKakaoShareSpecJSI>(params);
}
#endif

@end
