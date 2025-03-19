#import "RNCKakaoChannel.h"
#if __has_include("RNCKakaoChannel-Swift.h")
#import "RNCKakaoChannel-Swift.h"
#else
#import <RNCKakaoChannel/RNCKakaoChannel-Swift.h>
#endif

@implementation RNCKakaoChannel

- (RNCKakaoChannelManager*)manager {
  return [RNCKakaoChannelManager shared];
}

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(followChannel : (NSString*)channelPublicId resolve : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] followChannel:channelPublicId resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(addChannel : (NSString*)channelPublicId resolve : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] addChannel:channelPublicId resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(getAddChannelUrl : (NSString*)channelPublicId resolve : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] getAddChannelUrl:channelPublicId resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(openAddChannelUrl : (NSString*)channelPublicId resolve : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] openAddChannelUrl:channelPublicId resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(chatChannel : (NSString*)channelPublicId resolve : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] chatChannel:channelPublicId resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(getChatChannelUrl : (NSString*)channelPublicId resolve : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] getChatChannelUrl:channelPublicId resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(openChatChannelUrl : (NSString*)channelPublicId resolve : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] openChatChannelUrl:channelPublicId resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(channels : (NSArray*)channelPublicIds resolve : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject) {
  [[self manager] channels:channelPublicIds resolve:resolve reject:reject];
}

// Don't compile this code when we build for the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams&)params {
  return std::make_shared<facebook::react::NativeKakaoChannelSpecJSI>(params);
}
#endif

@end
