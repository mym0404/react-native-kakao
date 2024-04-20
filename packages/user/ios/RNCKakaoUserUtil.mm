//
//  RNCKakaoUserUtil.m
//  RNCKakaoUser
//
//  Created by mj on 4/21/24.
//

#import "RNCKakaoUserUtil.h"
#import "RNCKakaoUser-Swift.h"

@implementation RNCKakaoUserUtil
+ (BOOL)isKakaoTalkLoginUrl:(NSURL*)url {
  return [RNCKakaoUserManager isKakaoTalkLoginUrl:url];
}

+ (BOOL)handleOpenUrl:(NSURL*)url {
  return [RNCKakaoUserManager handleOpenUrl:url];
}
@end
