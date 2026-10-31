import CoreFoundation
import ExpoModulesCore
import Foundation
import KakaoMapsSDK

private let utilityUnsupported = "ERR_KAKAO_MAP_UNSUPPORTED_PLATFORM_FEATURE"
private let utilityDestroyed = "ERR_KAKAO_MAP_VIEW_DESTROYED"
private let maximumUtilityInteger = Double(Int32.max)

final class MapUtilities {
  private weak var map: KakaoMap?
  private weak var controller: KMController?
  private let viewName: String
  private var isDisposed = false

  init(map: KakaoMap, controller: KMController) {
    self.map = map
    self.controller = controller
    viewName = map.viewName()
  }

  func command(_ command: [String: Any]) throws -> [String: Any] {
    try requireAlive()
    switch try command.utilityString("type") {
    case "getCapabilities":
      return capabilities()
    case "getState":
      return try state()
    case "setPoiVisible":
      try requireMap().setPoiEnabled(command.utilityBool("visible"))
      return none()
    case "setPoiCategoryVisible":
      try requireMap().setLabelCategoryVisible(
        category: command.utilityCategory("category"),
        visible: command.utilityBool("visible")
      )
      return none()
    case "setPoiCategoryMaxCount":
      try requireMap().setMaxCountPerTile(
        category: command.utilityCategory("category"),
        count: UInt(command.utilityInteger("count"))
      )
      return none()
    case "resetPoiCategoryMaxCount":
      try requireMap().resetMaxCountPerTile(category: command.utilityCategory("category"))
      return none()
    case "setTapInterval":
      try requireMap().tapInterval = UInt(command.utilityInteger("milliseconds"))
      return none()
    case "setCameraAnimationEnabled":
      try requireMap().cameraAnimationEnabled = command.utilityBool("enabled")
      return none()
    case "setEnabled":
      try requireMap().isEnabled = command.utilityBool("enabled")
      return none()
    case "setVisible":
      throw unsupported("The Kakao Maps iOS SDK does not expose map visibility.")
    case "setKeepLevelOnResize":
      try requireMap().keepLevelOnResize = command.utilityBool("enabled")
      return none()
    case "getViewport":
      return try viewport()
    case "setViewport":
      throw unsupported("The Kakao Maps iOS SDK does not expose a custom viewport setter.")
    case "refresh":
      try requireMap().refresh()
      return none()
    case "registerFont":
      throw unsupported("The Kakao Maps iOS SDK does not register compiled font resources.")
    case "getVersion":
      return try version(command.utilityString("component"))
    case "convertCoordinate":
      return try convert(command)
    case "clearCache":
      try clearCache(command.utilityString("kind"))
      return none()
    default:
      throw invalidUtility("Unknown map utility command.")
    }
  }

  func dispose() {
    isDisposed = true
    map = nil
    controller = nil
  }

  func requestPoiState(_ promise: Promise) {
    do {
      try requireAlive()
      promise
        .reject(
          unsupported("The Kakao Maps iOS SDK does not expose an asynchronous POI-state query.")
        )
    } catch {
      promise.reject(error)
    }
  }

  private func capabilities() -> [String: Any] {
    [
      "type": "capabilities",
      "poi": [
        "visibility": true,
        "visibilityReadable": false,
        "categoryVisibility": true,
        "categoryMaxCount": true,
        "stateRequest": false,
        "categories": utilityCategoryNames
      ],
      "settings": [
        "tapInterval": true,
        "cameraAnimationEnabled": true,
        "cameraAnimationEnabledReadable": true,
        "enabled": true,
        "visible": false,
        "keepLevelOnResize": true,
        "refresh": true,
        "focusedReadable": true
      ],
      "viewport": ["readable": true, "writable": false],
      "fontRegistration": false,
      "versionComponents": ["sdk"],
      "coordinateSystems": utilityCoordinateSystems,
      "coordinateConversions": utilityConversions(systems: utilityCoordinateSystems),
      "cacheKinds": ["disk", "memory", "viewInfo", "all"]
    ]
  }

  private func state() throws -> [String: Any] {
    let map = try requireMap()
    return [
      "type": "state",
      "tapInterval": map.tapInterval,
      "cameraAnimationEnabled": map.cameraAnimationEnabled,
      "enabled": map.isEnabled,
      "keepLevelOnResize": map.keepLevelOnResize,
      "focused": map.isFocused
    ]
  }

  private func viewport() throws -> [String: Any] {
    let rect = try requireMap().viewRect
    return [
      "type": "viewport",
      "viewport": [
        "x": rect.origin.x,
        "y": rect.origin.y,
        "width": rect.width,
        "height": rect.height
      ]
    ]
  }

  private func version(_ component: String) throws -> [String: Any] {
    guard component == "sdk" else {
      if component == "engine" {
        throw unsupported("The Kakao Maps iOS SDK does not expose its engine version.")
      }
      throw invalidUtility("Unknown map version component.")
    }
    guard let value = Bundle(for: KMController.self)
      .object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String,
      !value.isEmpty
    else {
      throw KakaoMapException(
        "ERR_KAKAO_MAP_VERSION_UNAVAILABLE",
        "The Kakao Maps SDK version is unavailable."
      )
    }
    return ["type": "version", "component": component, "version": value]
  }

  private func convert(_ command: [String: Any]) throws -> [String: Any] {
    let source = try command.utilityString("from")
    let destination = try command.utilityString("to")
    guard utilityCoordinateSystems.contains(source), utilityCoordinateSystems.contains(destination)
    else {
      throw invalidUtility("Unknown coordinate system.")
    }
    let value = try command.utilityObject("coordinate").utilityCoordinate(system: source)
    let converted: (Double, Double)
    switch (source, destination) {
    case let (source, destination) where source == destination:
      converted = value
    case ("wgs84", "wtm"):
      converted = cartesian(MapCoordConverter.fromWGS84ToWTM(wgs: geo(value)))
    case ("wgs84", "wcong"):
      converted = cartesian(MapCoordConverter.fromWGS84ToWCong(wgs: geo(value)))
    case ("wgs84", "kakao"):
      converted = cartesian(MapCoordConverter.fromWGS84ToKakao(wgs: geo(value)))
    case ("wtm", "wgs84"):
      converted = geographic(MapCoordConverter.fromWTMToWGS84(wtm: cart(value)))
    case ("wtm", "wcong"):
      converted = cartesian(MapCoordConverter.fromWTMToWCong(wtm: cart(value)))
    case ("wtm", "kakao"):
      converted = cartesian(MapCoordConverter.fromWTMToKakao(wtm: cart(value)))
    case ("wcong", "wgs84"):
      converted = geographic(MapCoordConverter.fromWCongToWGS84(wcong: cart(value)))
    case ("wcong", "wtm"):
      converted = cartesian(MapCoordConverter.fromWCongToWTM(wcong: cart(value)))
    case ("wcong", "kakao"):
      converted = cartesian(MapCoordConverter.fromWCongToKakao(wcong: cart(value)))
    case ("kakao", "wgs84"):
      converted = geographic(MapCoordConverter.fromKakaoToWGS84(kakao: cart(value)))
    case ("kakao", "wtm"):
      converted = cartesian(MapCoordConverter.fromKakaoToWTM(kakao: cart(value)))
    case ("kakao", "wcong"):
      converted = cartesian(MapCoordConverter.fromKakaoToWCong(kakao: cart(value)))
    default:
      throw unsupported("The requested coordinate conversion is unavailable on iOS.")
    }
    guard converted.0.isFinite, converted.1.isFinite else {
      throw KakaoMapException(
        "ERR_KAKAO_MAP_COORDINATE_CONVERSION_FAILED",
        "Kakao Maps returned an invalid coordinate."
      )
    }
    return [
      "type": "coordinate",
      "system": destination,
      "coordinate": ["x": converted.0, "y": converted.1]
    ]
  }

  private func clearCache(_ kind: String) throws {
    guard let controller else { throw destroyed() }
    switch kind {
    case "disk":
      controller.clearDiskCache()
    case "memory":
      controller.clearMemoryCache(viewName)
    case "viewInfo":
      controller.clearViewInfoCaches()
    case "all":
      controller.clearMemoryCache(viewName)
      controller.clearViewInfoCaches()
      controller.clearDiskCache()
    default:
      throw invalidUtility("Unknown map cache kind.")
    }
  }

  private func requireAlive() throws {
    if isDisposed {
      throw destroyed()
    }
  }

  private func requireMap() throws -> KakaoMap {
    guard !isDisposed, let map else { throw destroyed() }
    return map
  }
}

private let utilityCoordinateSystems = ["wgs84", "wtm", "wcong", "kakao"]

private let utilityCategoryNames = [
  "policyCategory", "address", "district", "busStop", "railroadPlatform",
  "railroadEntrance", "railroadLine", "brand", "place", "climb", "climbWave", "road",
  "roadNumber", "roadInfo", "facilities", "publicFacilities", "apartNumber", "apartDetail",
  "houseNumber", "land", "indoor", "indoorPlace", "detailCategory"
]

private let utilityCategoryValues = Dictionary(
  uniqueKeysWithValues: utilityCategoryNames.enumerated().map { index, name in
    (name, index == utilityCategoryNames.count - 1 ? 1000 : index)
  }
)

private func utilityConversions(systems: [String]) -> [String] {
  systems.flatMap { source in systems.map { "\(source):\($0)" } }
}

private func geo(_ value: (Double, Double)) -> GeoCoordinate {
  GeoCoordinate(longitude: value.0, latitude: value.1)
}

private func cart(_ value: (Double, Double)) -> CartesianCoordinate {
  CartesianCoordinate(x: value.0, y: value.1)
}

private func geographic(_ value: GeoCoordinate) -> (Double, Double) {
  (value.longitude, value.latitude)
}

private func cartesian(_ value: CartesianCoordinate) -> (Double, Double) {
  (value.x, value.y)
}

private func none() -> [String: Any] {
  ["type": "none"]
}

private func invalidUtility(_ message: String) -> KakaoMapException {
  KakaoMapException(invalidCameraArgument, message)
}

private func unsupported(_ message: String) -> KakaoMapException {
  KakaoMapException(utilityUnsupported, message)
}

private func destroyed() -> KakaoMapException {
  KakaoMapException(utilityDestroyed, "The map view was destroyed.")
}

private extension [String: Any] {
  func utilityString(_ key: String) throws -> String {
    guard let value = self[key] as? String, !value.isEmpty else {
      throw invalidUtility("\(key) must be a non-empty string.")
    }
    return value
  }

  func utilityBool(_ key: String) throws -> Bool {
    guard let value = self[key] as? NSNumber, CFGetTypeID(value) == CFBooleanGetTypeID() else {
      throw invalidUtility("\(key) must be a boolean.")
    }
    return value.boolValue
  }

  func utilityInteger(_ key: String) throws -> Int {
    guard let value = self[key] as? NSNumber, CFGetTypeID(value) != CFBooleanGetTypeID() else {
      throw invalidUtility("\(key) must be an integer.")
    }
    let number = value.doubleValue
    guard number.isFinite, number.rounded() == number,
          (0 ... maximumUtilityInteger).contains(number)
    else {
      throw invalidUtility("\(key) must be an integer between 0 and \(Int32.max).")
    }
    return Int(number)
  }

  func utilityObject(_ key: String) throws -> [String: Any] {
    guard let value = self[key] as? [String: Any] else {
      throw invalidUtility("\(key) must be an object.")
    }
    return value
  }

  func utilityCategory(_ key: String) throws -> LabelCategory {
    let name = try utilityString(key)
    guard let value = utilityCategoryValues[name],
          let category = LabelCategory(rawValue: value)
    else {
      throw invalidUtility("Unknown POI category.")
    }
    return category
  }

  func utilityCoordinate(system: String) throws -> (Double, Double) {
    guard let x = self["x"] as? NSNumber, let y = self["y"] as? NSNumber,
          CFGetTypeID(x) != CFBooleanGetTypeID(), CFGetTypeID(y) != CFBooleanGetTypeID(),
          x.doubleValue.isFinite, y.doubleValue.isFinite
    else {
      throw invalidUtility("Coordinate x and y must be finite numbers.")
    }
    let value = (x.doubleValue, y.doubleValue)
    if system == "wgs84", !((-180 ... 180).contains(value.0) && (-90 ... 90).contains(value.1)) {
      throw invalidUtility("WGS84 x must be longitude and y must be latitude.")
    }
    return value
  }
}
