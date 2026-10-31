#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN
@interface RNCKakaoCertUtil : NSObject
+ (BOOL)isKakaoTalkSignReturnUrl:(NSURL*)url NS_SWIFT_NAME(isKakaoTalkSignReturnUrl(_:));
+ (BOOL)handleOpenUrl:(NSURL*)url;
@end
NS_ASSUME_NONNULL_END
