
#ifdef RCT_NEW_ARCH_ENABLED
#import "RNKakaoShareSpec.h"

@interface KakaoShare : NSObject <NativeKakaoShareSpec>
#else
#import <React/RCTBridgeModule.h>

@interface KakaoShare : NSObject <RCTBridgeModule>
#endif

@end
