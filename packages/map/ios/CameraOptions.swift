import ExpoModulesCore
import KakaoMapsSDK

let invalidCameraArgument = "ERR_KAKAO_MAP_INVALID_ARGUMENT"
let mapNotInitialized = "ERR_KAKAO_MAP_NOT_INITIALIZED"

final class KakaoMapException: Exception {
  init(_ code: String, _ message: String) {
    super.init(name: "KakaoMapError", description: message, code: code)
  }
}

struct CameraOptions: Record {
  @Field(.required) var latitude: Double = .nan
  @Field(.required) var longitude: Double = .nan
  @Field(.required) var zoomLevel: Double = .nan
  @Field var tilt: Double = 0
  @Field var rotation: Double = 0

  var values: [Double] {
    [latitude, longitude, zoomLevel, tilt, rotation]
  }

  func update(for map: KakaoMap) throws -> CameraUpdate {
    guard values.allSatisfy(\.isFinite), (-90 ... 90).contains(latitude),
          (-180 ... 180).contains(longitude), zoomLevel.rounded() == zoomLevel,
          zoomLevel >= Double(map.minLevel), zoomLevel <= Double(map.maxLevel),
          (0 ... 90).contains(tilt)
    else {
      throw KakaoMapException(
        invalidCameraArgument,
        "Invalid camera coordinates, zoom level, tilt, or rotation."
      )
    }
    return CameraUpdate.make(
      target: MapPoint(longitude: longitude, latitude: latitude), zoomLevel: Int(zoomLevel),
      rotation: rotation.truncatingRemainder(dividingBy: 360) * .pi / 180, tilt: tilt * .pi / 180,
      mapView: map
    )
  }
}
