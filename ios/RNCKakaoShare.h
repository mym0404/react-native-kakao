
#ifdef RCT_NEW_ARCH_ENABLED
#import "RNCKakaoShareSpec.h"

@interface RNCKakaoShare : NSObject <NativeKakaoShareSpec>
#else
#import <React/RCTBridgeModule.h>

@interface RNCKakaoShare : NSObject <RCTBridgeModule>
#endif

@end
