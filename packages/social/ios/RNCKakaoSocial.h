#ifdef RCT_NEW_ARCH_ENABLED
#import "RNCKakaoSocialSpec.h"

@interface RNCKakaoSocial : NSObject <NativeKakaoSocialSpec>
#else
#import <React/RCTBridgeModule.h>

@interface RNCKakaoSocial : NSObject <RCTBridgeModule>
#endif

@end
