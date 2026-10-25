#import "RNCKakaoNavi.h"
#if __has_include("RNCKakaoNavi-Swift.h")
#import "RNCKakaoNavi-Swift.h"
#else
#import <RNCKakaoNavi/RNCKakaoNavi-Swift.h>
#endif
@implementation RNCKakaoNavi

- (RNCKakaoNaviManager*)manager {
  return [RNCKakaoNaviManager shared];
}

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(isKakaoNaviInstalled : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] isKakaoNaviInstalled:resolve];
}

RCT_EXPORT_METHOD(makeNaviUrl : (NSDictionary*)destination isShare : (BOOL)isShare option : (
    NSDictionary*)option viaList : (NSArray*)viaList resolve : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] makeNaviUrl:destination
                      isShare:isShare
                       option:option
                      viaList:viaList
                      resolve:resolve
                       reject:reject];
}

RCT_EXPORT_METHOD(navigateOrShareTo : (NSDictionary*)destination option : (NSDictionary*)
                      option viaList : (NSArray*)viaList openWebInstallUrlIfNaviAppNotAvailable : (
                          NSNumber*)openWebInstallUrlIfNaviAppNotAvailable isShare : (NSNumber*)
                          isShare resolve : (RCTPromiseResolveBlock)
                              resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] navigateOrShareTo:destination
                                      option:option
                                     viaList:viaList
      openWebInstallUrlIfNaviAppNotAvailable:openWebInstallUrlIfNaviAppNotAvailable
                                     isShare:isShare
                                     resolve:resolve
                                      reject:reject];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams&)params {
  return std::make_shared<facebook::react::NativeKakaoNaviSpecJSI>(params);
}

@end
