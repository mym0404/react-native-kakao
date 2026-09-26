//
//  RNCKakaoUserUtil.h
//  RNCKakaoUser
//
//  Created by mj on 4/21/24.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface RNCKakaoUserUtil : NSObject
+ (BOOL)isKakaoTalkLoginUrl:(NSURL*)url;
+ (BOOL)handleOpenUrl:(NSURL*)url;
@end

NS_ASSUME_NONNULL_END
