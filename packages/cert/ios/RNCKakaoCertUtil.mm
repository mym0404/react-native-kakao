#import "RNCKakaoCertUtil.h"
#import <React/RCTBridgeModule.h>

#if __has_include("RNCKakaoCert-Swift.h")
#import "RNCKakaoCert-Swift.h"
#else
#import <RNCKakaoCert/RNCKakaoCert-Swift.h>
#endif

@implementation RNCKakaoCertUtil
+ (BOOL)isKakaoTalkSignReturnUrl:(NSURL*)url {
  return [RNCKakaoCertManager isKakaoTalkSignReturnUrl:url];
}
+ (BOOL)handleOpenUrl:(NSURL*)url {
  return [RNCKakaoCertManager handleOpenUrl:url];
}
@end
