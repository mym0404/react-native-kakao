//
//  RNCKakaoMapView.m
//  RNCKakaoMap
//
//  Created by mj on 5/5/24.
//

#import "RNCKakaoMapView.h"

using namespace facebook::react;

NSString* MAP_VIEW_NAME = @"mapview";
NSString* MAP_VIEW_INFO_SKYVIEW_NAME = @"skyview";
NSString* MAP_VIEW_INFO_MAP_NAME = @"map";
NSString* APP_NAME = @"openmap";

@interface RNCKakaoMapView () <RCTRNCKakaoMapViewViewProtocol, MapControllerDelegate>
@end

@implementation RNCKakaoMapView {
  BOOL _isAuthSuccess;
  KMViewContainer* _container;
  KMController* _controller;
  BOOL _shouldForceUpdatePropsForInitialRender;
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RNCKakaoMapViewProps>();
    _props = defaultProps;

    _container = [[KMViewContainer alloc] init];
    _controller = [[KMController alloc] initWithViewContainer:_container];
    [_controller clearDiskCache];
    _controller.delegate = self;

    [_controller prepareEngine];
    self.contentView = _container;
  }

  return self;
}

- (void)dealloc {
  [_controller pauseEngine];
  [_controller resetEngine];
}

- (KakaoMap*)map {
  return static_cast<KakaoMap*>([_controller getView:MAP_VIEW_NAME]);
}

- (void)updateProps:(Props::Shared const&)props oldProps:(Props::Shared const&)oldProps {
  BOOL (^check)(BOOL) = ^(BOOL condition) {
    if (!self.map)
      return NO;
    return self->_shouldForceUpdatePropsForInitialRender || condition;
  };
  const auto& p = *std::static_pointer_cast<RNCKakaoMapViewProps const>(_props);
  const auto& n = *std::static_pointer_cast<RNCKakaoMapViewProps const>(props);

  _cameraAnimationDuration = n.cameraAnimationDuration;

  if (check(p.baseMapType != n.baseMapType))
    [self.map changeViewInfoWithAppName:APP_NAME viewInfoName:getNsStr(n.baseMapType)];
  if (check(p.overlays != n.overlays)) {
    if (has(n.overlays, "hill_shading")) {
      [self.map showOverlay:@"hill_shading"];
    } else {
      [self.map hideOverlay:@"hill_shading"];
    }
    if (has(n.overlays, "roadview_line")) {
      [self.map showOverlay:@"roadview_line"];
    } else {
      [self.map hideOverlay:@"roadview_line"];
    }
    if (has(n.overlays, "bicycle_road")) {
      [self.map showOverlay:@"bicycle_road"];
    } else {
      [self.map hideOverlay:@"bicycle_road"];
    }
    if (has(n.overlays, "hybrid")) {
      [self.map showOverlay:@"hybrid"];
    } else {
      [self.map hideOverlay:@"hybrid"];
    }
  }

  if (check(p.camera != n.camera))
    [self moveCamera:n.camera noAnimation:_shouldForceUpdatePropsForInitialRender];
  if (check(p.cameraMinLevel != n.cameraMinLevel && isValidNumber(n.cameraMinLevel)))
    [self.map setCameraMinLevel:n.cameraMinLevel];
  if (check(p.cameraMaxLevel != n.cameraMaxLevel && isValidNumber(n.cameraMaxLevel)))
    [self.map setCameraMaxLevel:n.cameraMaxLevel];
  if (check(p.buildingScale != n.buildingScale))
    [self.map setBuildingScale:n.buildingScale];
  if (check(p.poiEnabled != n.poiEnabled))
    [self.map setPoiEnabled:n.poiEnabled];
  if (check(p.poiClickable != n.poiClickable))
    [self.map setPoiClickable:n.poiClickable];
  if (check(p.poiScale != n.poiScale))
    [self.map setPoiScale:n.poiScale == "small"     ? PoiScaleTypeSmall
                          : n.poiScale == "regular" ? PoiScaleTypeRegular
                          : n.poiScale == "large"   ? PoiScaleTypeLarge
                                                    : PoiScaleTypeXLarge];
  if (check(p.language != n.language))
    [self.map setLanguage:n.language == "en" ? @"en" : @"ko"];

  [super updateProps:props oldProps:oldProps];
  if (self.map && _shouldForceUpdatePropsForInitialRender) {
    _shouldForceUpdatePropsForInitialRender = NO;
  }
}

- (void)moveCamera:(const RNCKakaoMapViewCameraStruct&)c noAnimation:(BOOL)noAnimation {
  CameraUpdate* update =
      [CameraUpdate makeWithTarget:makePoint(c.lat, c.lng)
                         zoomLevel:getDoubleOrDefault(c.zoomLevel, self.map.zoomLevel)
                          rotation:getDoubleOrDefault(c.rotation, self.map.rotationAngle)
                              tilt:getDoubleOrDefault(c.tilt, self.map.tiltAngle)
                           mapView:self.map];

  if (self.cameraAnimationDuration != 0 && !noAnimation) {
    [self.map animateCameraWithCameraUpdate:update
                                    options:CameraAnimationOptions{
                                                .autoElevation = YES,
                                                .consecutive = NO,
                                                .durationInMillis =
                                                    (NSUInteger)self.cameraAnimationDuration}
                                   callback:^{
                                   }];
  } else {
    [self.map moveCamera:update
                callback:^{
                }];
  }
}

- (void)addViews {
  MapviewInfo* info = [[MapviewInfo alloc] initWithViewName:MAP_VIEW_NAME
                                                    appName:APP_NAME
                                               viewInfoName:MAP_VIEW_INFO_MAP_NAME
                                            defaultPosition:makePoint(37.402001, 127.108678)
                                               defaultLevel:17
                                                    enabled:YES];
  [_controller addView:info];
}

@end

@implementation RNCKakaoMapView (MapControllerDelegate)
- (void)authenticationSucceeded {
  _isAuthSuccess = YES;
  if (!_controller.isEngineActive) {
    [_controller activateEngine];
  }
}
- (void)authenticationFailed:(NSInteger)errorCode desc:(NSString*)desc {
  NSLog(@"[RNCKakaoMapView] authenticationFailed %d, %@ retry...", (int)errorCode, desc);
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(3 * NSEC_PER_SEC)),
                 dispatch_get_main_queue(), ^{
                   [self->_controller prepareEngine];
                 });
}

- (void)addViewSucceeded:(NSString*)viewName viewInfoName:(NSString*)viewInfoName {
  if ([viewName isEqualToString:MAP_VIEW_NAME]) {
    _shouldForceUpdatePropsForInitialRender = YES;
    [self updateProps:_props oldProps:_props];
  }
}
- (void)addViewFailed:(NSString*)viewName viewInfoName:(NSString*)viewInfoName {
  NSLog(@"add view failed %@ %@", viewName, viewInfoName);
}
- (void)containerDidResized:(CGSize)size {
  self.map.viewRect = CGRectMake(0, 0, size.width, size.height);
}
- (void)viewWillDestroyed:(ViewBase*)view {
}
@end

@implementation RNCKakaoMapView (ReactNative)

//- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args {
//}

Class<RCTComponentViewProtocol> RNCKakaoMapViewCls(void) {
  return RNCKakaoMapView.class;
}
+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<RNCKakaoMapViewComponentDescriptor>();
}

@end
