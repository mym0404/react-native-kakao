#ifdef RCT_NEW_ARCH_ENABLED
#import "RNCKakaoNaviSpec.h"

@interface RNCKakaoNavi : NSObject <NativeKakaoNaviSpec>
#else
#import <React/RCTBridgeModule.h>

@interface RNCKakaoNavi : NSObject <RCTBridgeModule>
#endif

@end
