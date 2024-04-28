#ifdef RCT_NEW_ARCH_ENABLED
#import "RNCKakaoChannelSpec.h"

@interface RNCKakaoChannel : NSObject <NativeKakaoChannelSpec>
#else
#import <React/RCTBridgeModule.h>

@interface RNCKakaoChannel : NSObject <RCTBridgeModule>
#endif

@end
