
#ifdef RCT_NEW_ARCH_ENABLED
#import "RNCKakaoCoreSpec.h"

@interface RNCKakaoCore : NSObject <NativeKakaoCoreSpec>
#else
#import <React/RCTBridgeModule.h>

@interface RNCKakaoCore : NSObject <RCTBridgeModule>
#endif

@end
