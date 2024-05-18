//
//  RNCKakaoUserUtil.m
//  RNCKakaoUser
//
//  Created by mj on 4/21/24.
//

#import "RNCKakaoUserUtil.h"
#if __has_include("RNCKakaoUser-Swift.h")
#import "RNCKakaoUser-Swift.h"
#else
#import <RNCKakaoUser/RNCKakaoUser-Swift.h>
#endif

@implementation RNCKakaoUserUtil
+ (BOOL)isKakaoTalkLoginUrl:(NSURL*)url {
  return [RNCKakaoUserManager isKakaoTalkLoginUrl:url];
}

+ (BOOL)handleOpenUrl:(NSURL*)url {
  return [RNCKakaoUserManager handleOpenUrl:url];
}
@end
