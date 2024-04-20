#ifdef RCT_NEW_ARCH_ENABLED
#import "RNCKakaoUserSpec.h"

@interface RNCKakaoUser : NSObject <NativeKakaoUserSpec>
#else
#import <React/RCTBridgeModule.h>

@interface RNCKakaoUser : NSObject <RCTBridgeModule>
#endif

@end
