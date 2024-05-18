//
//  RNCKakaoMapView.h
//  RNCKakaoMap
//
//  Created by mj on 5/5/24.
//

#import "RCTFabricComponentsPlugins.h"
#import <KakaoMapsSDK/KakaoMapsSDK-Swift.h>
#import <KakaoMapsSDK/KakaoMapsSDK.h>
#import <React/RCTViewComponentView.h>
#import <React/UIView+ComponentViewProtocol.h>
#import <UIKit/UIKit.h>
#import <react/renderer/components/RNCKakaoMapSpec/ComponentDescriptors.h>
#import <react/renderer/components/RNCKakaoMapSpec/EventEmitters.h>
#import <react/renderer/components/RNCKakaoMapSpec/Props.h>
#import <react/renderer/components/RNCKakaoMapSpec/RCTComponentViewHelpers.h>

@interface RNCKakaoMapView : RCTViewComponentView

@property(nonatomic, assign) double cameraAnimationDuration;

@end
