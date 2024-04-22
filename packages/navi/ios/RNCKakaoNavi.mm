#import "RNCKakaoNavi.h"
#import "RNCKakaoNavi-Swift.h"

@implementation RNCKakaoNavi

- (RNCKakaoNaviManager*)manager {
  return [RNCKakaoNaviManager shared];
}

RCT_EXPORT_MODULE()

// Don't compile this code when we build for the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams&)params {
  return std::make_shared<facebook::react::NativeKakaoNaviSpecJSI>(params);
}
#endif

@end
