//
//  Util.h
//  RNCKakaoMap
//
//  Created by mj on 5/5/24.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <KakaoMapsSdk/KakaoMapsSdk.h>
#import <KakaoMapsSDK/KakaoMapsSDK-Swift.h>
#import <react/renderer/components/RNCKakaoMapSpec/ComponentDescriptors.h>
#import <react/renderer/components/RNCKakaoMapSpec/EventEmitters.h>
#import <react/renderer/components/RNCKakaoMapSpec/Props.h>
#import <react/renderer/components/RNCKakaoMapSpec/RCTComponentViewHelpers.h>

using namespace facebook::react;

static inline BOOL isValidNumber(NSNumber* value) {
  if (!value || [value isKindOfClass:[NSNull class]]) {
    return false;
  }

  double INVALID = -123123123.0;

  if ([value doubleValue]<INVALID + 1 && [value doubleValue]> INVALID - 1) {
    return false;
  }

  return true;
}

static inline BOOL isValidNumber(double value) {
  return isValidNumber([NSNumber numberWithDouble:value]);
}

static inline NSNumber* getNumberOrNil(NSNumber* value) {
  if (!isValidNumber(value)) {
    return nil;
  }

  return value;
}

static inline double getDoubleOrDefault(NSNumber* value, double def) {
  if (!isValidNumber(value)) {
    return def;
  }

  return [value doubleValue];
}

static inline double getDoubleOrDefault(double value, double def) {
  if (!isValidNumber(value)) {
    return def;
  }

  return value;
}

static inline NSString* getNsStr(std::string str) {
  return [NSString stringWithUTF8String:str.c_str()];
}

static inline BOOL isNotEmptyString(NSString* str) {
  return ![str isKindOfClass:[NSNull class]] && str && str.length > 0;
}

static inline double clamp(double a, double b, double c) {
  return MIN(MAX(a, b), c);
}

static inline UIColor* intToColor(NSInteger intToConvert) {
  float alpha = ((intToConvert & 0xFF000000) >> 24) / 255.0;
  float red = ((intToConvert & 0xFF0000) >> 16) / 255.0;
  float green = ((intToConvert & 0x00FF00) >> 8) / 255.0;
  float blue = (intToConvert & 0x0000FF) / 255.0;
  return [UIColor colorWithRed:red green:green blue:blue alpha:alpha];
}

static inline MapPoint* makePoint(double lat, double lng) {
  return [[MapPoint alloc] initWithLongitude:lng latitude:lat];
}

static inline bool operator==(const RNCKakaoMapViewCameraStruct& c1,
                              const RNCKakaoMapViewCameraStruct& c2) {
  return c1.lat == c2.lat && c1.lng == c2.lng && c1.zoomLevel == c2.zoomLevel &&
         c1.rotation == c2.rotation && c1.tilt == c2.tilt;
}

#define all(X) (X).begin(), (X).end()
#define sz(X) (int)(X).size()
#define cntt(X, x) count(all(X), x)
#define has(X, x) (std::find(all((X)), x) != (X).end())
#define hass(X, x) ((X).find(x) != (X).end())
#define hasstr(X, x) (!!strstr(&(X)[0], &(x)[0]))
#define uniq(X) std::sort(all(X)), (X).resize(std::unique(all((X))) - (X).begin())
