#import "RNCKakaoShare.h"
#import "RNCKakaoShare-Swift.h"

@implementation RNCKakaoShare

- (RNCKakaoShareManager*)manager {
  return [RNCKakaoShareManager shared];
}

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(shareCustom
                  : (double)templateId useWebBrwoserIfKakaoTalkNotAvailable
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

// Don't compile this code when we build for the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams&)params {
  return std::make_shared<facebook::react::NativeKakaoShareSpecJSI>(params);
}
#endif

@end
