import CoreFoundation
import KakaoMapsSDK
import UIKit

private let mapDimInvalidArgument = "ERR_KAKAO_MAP_DIM_INVALID_ARGUMENT"
private let mapDimNotFound = "ERR_KAKAO_MAP_DIM_NOT_FOUND"
private let mapDimUnsupported = "ERR_KAKAO_MAP_UNSUPPORTED_PLATFORM_FEATURE"

final class MapDimScreen {
  typealias EventEmitter = ([String: Any]) -> Void

  private weak var map: KakaoMap?
  private let emit: EventEmitter
  private var geographicHighlights: [String: MapPolygonShape] = [:]
  private var modelHighlights: [String: PolygonShape] = [:]
  private var animations: [String: ShapeAnimator] = [:]
  private var styleFingerprints: [String: String] = [:]
  private var isDisposed = false

  init(map: KakaoMap, emit: @escaping EventEmitter) {
    self.map = map
    self.emit = emit
  }

  func apply(_ options: [String: Any]) throws {
    guard !isDisposed, let dimScreen = map?.dimScreen else {
      throw KakaoMapException(mapDimNotFound, "The map is no longer available.")
    }
    let parsed = try parse(options)
    var stylesToAdd: [(id: String, fingerprint: String, native: PolygonStyleSet)] = []
    for style in parsed.styleSets {
      let id = try string(style, "id")
      let fingerprint = try fingerprint(style)
      if let current = styleFingerprints[id], current != fingerprint {
        throw exception(
          "Dim-screen style \(id) cannot be replaced during a map engine lifetime; use a new style ID."
        )
      }
      if styleFingerprints[id] == nil {
        try stylesToAdd.append((id, fingerprint, mapShapePolygonStyleSet(style)))
      }
    }
    let availableStyleIds = Set(styleFingerprints.keys).union(stylesToAdd.map(\.id))
    let highlightIds = try Set(parsed.highlights.map { try string($0, "id") })
    try parsed.highlights
      .forEach { try validateHighlight($0, availableStyleIds: availableStyleIds) }
    try parsed.animations.forEach { animation in
      _ = try mapShapeWaveEffect(animation)
      let id = try string(animation, "animationId")
      let shapeIds = try strings(animation, "shapeIds")
      guard !shapeIds.isEmpty
      else { throw exception("Dim-screen animation \(id) requires a target.") }
      try unique(shapeIds, name: "animation target")
      for shapeId in shapeIds where !highlightIds.contains(shapeId) {
        throw exception("Dim-screen animation \(id) references unknown highlight \(shapeId).")
      }
    }
    clearObjects()
    do {
      for style in stylesToAdd {
        dimScreen.addPolygonStyleSet(style.native)
        styleFingerprints[style.id] = style.fingerprint
      }
      for highlight in parsed.highlights {
        try addHighlight(highlight, to: dimScreen)
      }
      for animation in parsed.animations {
        try addAnimation(animation, to: dimScreen)
      }
      dimScreen.color = try color(parsed.color)
      dimScreen.cover = try cover(parsed.cover)
      dimScreen.isEnabled = parsed.enabled
    } catch {
      clearObjects()
      throw error
    }
  }

  func setHighlightVisible(id: String, visible: Bool) throws {
    guard !isDisposed, map != nil else {
      throw KakaoMapException(mapDimNotFound, "The dim-screen manager was disposed.")
    }
    if let shape = geographicHighlights[id] {
      visible ? shape.show() : shape.hide()
      return
    }
    if let shape = modelHighlights[id] {
      visible ? shape.show() : shape.hide()
      return
    }
    throw KakaoMapException(mapDimNotFound, "Dim-screen highlight \(id) was not found.")
  }

  func startAnimation(id: String) throws {
    try requireAnimation(id).start()
  }

  func stopAnimation(id: String) throws {
    try requireAnimation(id).stop()
  }

  func status() throws -> [String: Any] {
    guard let dimScreen = map?.dimScreen else {
      throw KakaoMapException(mapDimNotFound, "The map is no longer available.")
    }
    let geographic = (dimScreen.getAllHighlightMapPolygonShapes() ?? []).map { shape in
      [
        "id": shape.shapeID,
        "visible": shape.isShow,
        "geometryType": "geographicPolygon"
      ] as [String: Any]
    }
    let model = (dimScreen.getAllHighlightPolygonShapes() ?? []).map { shape in
      [
        "id": shape.shapeID,
        "visible": shape.isShow,
        "geometryType": "modelPolygon"
      ] as [String: Any]
    }
    let animationStatus = animations.keys.sorted().compactMap { id -> [String: Any]? in
      guard let animation = dimScreen.getShapeAnimator(animatorID: id) else { return nil }
      return ["id": animation.animatorID, "running": animation.isStart]
    }
    return [
      "enabled": dimScreen.isEnabled,
      "color": colorString(dimScreen.color),
      "cover": coverName(dimScreen.cover),
      "highlights": (geographic + model).sorted {
        ($0["id"] as? String ?? "") < ($1["id"] as? String ?? "")
      },
      "animations": animationStatus,
      "counts": [
        "highlights": geographic.count + model.count,
        "animations": animationStatus.count
      ],
      "capabilities": [
        "coversRoute": false,
        "modelHighlights": true,
        "modelOrientation": true,
        "animations": true,
        "animationDuration": true,
        "animationState": true,
        "nativeConfigurationState": true
      ]
    ]
  }

  func dispose() {
    guard !isDisposed else { return }
    isDisposed = true
    map?.dimScreen.isEnabled = false
    clearObjects()
    map = nil
  }

  private func addHighlight(_ value: [String: Any], to dimScreen: DimScreen) throws {
    let id = try string(value, "id")
    let styleSetId = try string(value, "styleSetId")
    guard styleFingerprints[styleSetId] != nil else {
      throw exception("Highlight \(id) references unknown style set \(styleSetId).")
    }
    let zIndex = try integer(value, "zIndex", default: 0)
    let isVisible = try boolean(value, "visible", default: true)
    let geometry = try dictionary(value, "geometry")
    let type = try string(geometry, "type")
    let parts = try dictionaries(geometry, "parts")
    guard !parts.isEmpty
    else { throw exception("Highlight \(id) requires at least one polygon part.") }
    switch type {
    case "geographicPolygon":
      let option = MapPolygonShapeOptions(shapeID: id, styleID: styleSetId, zOrder: zIndex)
      option.polygons = try parts.map(mapShapeMapPolygon)
      guard let shape = dimScreen.addHighlightMapPolygonShape(option) else {
        throw exception("Could not add geographic dim-screen highlight \(id).")
      }
      isVisible ? shape.show() : shape.hide()
      geographicHighlights[id] = shape
    case "modelPolygon":
      let option = PolygonShapeOptions(shapeID: id, styleID: styleSetId, zOrder: zIndex)
      let base = try dictionary(geometry, "base")
      option.basePosition = try mapPoint(base)
      option.polygons = try parts.map(mapShapeModelPolygon)
      guard let shape = dimScreen.addHighlightPolygonShape(option) else {
        throw exception("Could not add model dim-screen highlight \(id).")
      }
      shape.orientation = try orientation(geometry) * .pi / 180
      isVisible ? shape.show() : shape.hide()
      modelHighlights[id] = shape
    default:
      throw exception("Dim-screen highlights require geographicPolygon or modelPolygon geometry.")
    }
  }

  private func validateHighlight(_ value: [String: Any], availableStyleIds: Set<String>) throws {
    let id = try string(value, "id")
    let styleSetId = try string(value, "styleSetId")
    guard availableStyleIds.contains(styleSetId) else {
      throw exception("Highlight \(id) references unknown style set \(styleSetId).")
    }
    _ = try boolean(value, "visible", default: true)
    _ = try integer(value, "zIndex", default: 0)
    let geometry = try dictionary(value, "geometry")
    let type = try string(geometry, "type")
    let parts = try dictionaries(geometry, "parts")
    guard !parts.isEmpty
    else { throw exception("Highlight \(id) requires at least one polygon part.") }
    switch type {
    case "geographicPolygon": _ = try parts.map(mapShapeMapPolygon)
    case "modelPolygon":
      _ = try mapPoint(dictionary(geometry, "base"))
      _ = try orientation(geometry)
      _ = try parts.map(mapShapeModelPolygon)
    default: throw exception(
        "Dim-screen highlights require geographicPolygon or modelPolygon geometry."
      )
    }
  }

  private func addAnimation(_ value: [String: Any], to dimScreen: DimScreen) throws {
    let id = try string(value, "animationId")
    guard let animator = try dimScreen.addShapeAnimator(
      animatorID: id,
      effect: mapShapeWaveEffect(value)
    ) else {
      throw exception("Could not add dim-screen animation \(id).")
    }
    let shapeIds = try strings(value, "shapeIds")
    guard !shapeIds.isEmpty
    else { throw exception("Dim-screen animation \(id) requires a target.") }
    for shapeId in shapeIds {
      if let shape = geographicHighlights[shapeId] {
        animator.addMapPolygonShape(shape)
      } else if let shape = modelHighlights[shapeId] {
        animator.addPolygonShape(shape)
      } else {
        throw exception("Dim-screen animation \(id) references unknown highlight \(shapeId).")
      }
    }
    let animatorIdentity = ObjectIdentifier(animator)
    animator.setStopCallback { [weak self] _ in
      guard let self, !self.isDisposed,
            let active = animations[id],
            ObjectIdentifier(active) == animatorIdentity
      else { return }
      emit(["type": "animationStopped", "id": id])
    }
    animations[id] = animator
  }

  private func clearObjects() {
    guard let dimScreen = map?.dimScreen else { return }
    let removedAnimations = Array(animations.values)
    animations.removeAll()
    removedAnimations.forEach { $0.stop() }
    dimScreen.clearAllShapeAnimators()
    dimScreen.clearAllHighlightShapes()
    geographicHighlights.removeAll()
    modelHighlights.removeAll()
  }

  private func requireAnimation(_ id: String) throws -> ShapeAnimator {
    guard !isDisposed, map != nil else {
      throw KakaoMapException(mapDimNotFound, "The dim-screen manager was disposed.")
    }
    guard let animation = animations[id] else {
      throw KakaoMapException(mapDimNotFound, "Dim-screen animation \(id) was not found.")
    }
    return animation
  }

  private func parse(_ value: [String: Any]) throws -> (
    enabled: Bool,
    color: String,
    cover: String,
    styleSets: [[String: Any]],
    highlights: [[String: Any]],
    animations: [[String: Any]]
  ) {
    let enabled = try boolean(value, "enabled")
    if value["zIndex"] != nil {
      throw KakaoMapException(
        mapDimUnsupported,
        "iOS SDK 2.12.19 does not expose dim-screen z-order."
      )
    }
    let color = try string(value, "color")
    _ = try self.color(color)
    let cover = try string(value, "cover")
    if cover == "mapAndRoute" {
      throw KakaoMapException(
        mapDimUnsupported,
        "iOS SDK 2.12.19 does not support mapAndRoute dimming."
      )
    }
    _ = try self.cover(cover)
    let styleSets = try optionalDictionaries(value, "styleSets")
    let highlights = try optionalDictionaries(value, "highlights")
    let animations = try optionalDictionaries(value, "animations")
    try unique(styleSets.map { try string($0, "id") }, name: "dim-screen style")
    try unique(highlights.map { try string($0, "id") }, name: "dim-screen highlight")
    try unique(animations.map { try string($0, "animationId") }, name: "dim-screen animation")
    return (enabled, color, cover, styleSets, highlights, animations)
  }

  private func cover(_ value: String) throws -> DimScreenCover {
    switch value {
    case "map": .map
    case "mapAndLabel": .mapAndLabels
    case "all": .all
    case "mapAndRoute": throw KakaoMapException(
        mapDimUnsupported,
        "iOS SDK 2.12.19 does not support mapAndRoute dimming."
      )
    default: throw exception("Unknown dim-screen cover: \(value).")
    }
  }

  private func coverName(_ value: DimScreenCover) -> String {
    switch value {
    case .map: "map"
    case .mapAndLabels: "mapAndLabel"
    case .all: "all"
    default: "map"
    }
  }

  private func mapPoint(_ value: [String: Any]) throws -> MapPoint {
    guard let latitude = value["latitude"] as? Double,
          let longitude = value["longitude"] as? Double,
          latitude.isFinite, longitude.isFinite,
          (-90 ... 90).contains(latitude), (-180 ... 180).contains(longitude)
    else { throw exception("Invalid dim-screen base coordinate.") }
    return MapPoint(longitude: longitude, latitude: latitude)
  }

  private func orientation(_ geometry: [String: Any]) throws -> Double {
    guard let raw = geometry["orientation"] else { return 0 }
    guard let numeric = raw as? NSNumber,
          CFGetTypeID(numeric) != CFBooleanGetTypeID()
    else { throw exception("Model-polygon orientation must be numeric degrees.") }
    let orientation = numeric.doubleValue
    guard orientation.isFinite else {
      throw exception("Model-polygon orientation must be finite degrees.")
    }
    return orientation
  }

  private func color(_ value: String) throws -> UIColor {
    guard value.hasPrefix("#") else {
      throw exception("Colors must use #RRGGBB or #RRGGBBAA.")
    }
    let hex = String(value.dropFirst())
    guard [6, 8].contains(hex.count), let number = UInt64(hex, radix: 16) else {
      throw exception("Colors must use #RRGGBB or #RRGGBBAA.")
    }
    let alpha = hex.count == 8 ? CGFloat(number & 0xFF) / 255 : 1
    let rgb = hex.count == 8 ? number >> 8 : number
    return UIColor(
      red: CGFloat((rgb >> 16) & 0xFF) / 255,
      green: CGFloat((rgb >> 8) & 0xFF) / 255,
      blue: CGFloat(rgb & 0xFF) / 255,
      alpha: alpha
    )
  }

  private func colorString(_ value: UIColor) -> String {
    var red: CGFloat = 0
    var green: CGFloat = 0
    var blue: CGFloat = 0
    var alpha: CGFloat = 0
    guard value.getRed(&red, green: &green, blue: &blue, alpha: &alpha) else { return "#00000000" }
    return String(
      format: "#%02X%02X%02X%02X",
      Int(red * 255), Int(green * 255), Int(blue * 255), Int(alpha * 255)
    )
  }

  private func fingerprint(_ value: [String: Any]) throws -> String {
    guard JSONSerialization.isValidJSONObject(value) else {
      throw exception("Dim-screen styles must contain serializable finite values.")
    }
    do {
      let data = try JSONSerialization.data(withJSONObject: value, options: [.sortedKeys])
      return data.base64EncodedString()
    } catch {
      throw exception("Dim-screen styles could not be serialized: \(error.localizedDescription)")
    }
  }

  private func string(_ value: [String: Any], _ key: String) throws -> String {
    guard let result = value[key] as? String, !result.isEmpty else {
      throw exception("\(key) must be a nonempty string.")
    }
    return result
  }

  private func strings(_ value: [String: Any], _ key: String) throws -> [String] {
    guard let result = value[key] as? [String]
    else { throw exception("\(key) must be a string array.") }
    return result
  }

  private func integer(_ value: [String: Any], _ key: String, default fallback: Int) throws -> Int {
    guard let number = value[key] else { return fallback }
    guard let numeric = number as? NSNumber,
          CFGetTypeID(numeric) != CFBooleanGetTypeID()
    else { throw exception("\(key) must be an integer.") }
    let double = numeric.doubleValue
    guard double.isFinite, double.rounded() == double,
          double >= Double(Int32.min), double <= Double(Int32.max)
    else { throw exception("\(key) must be a 32-bit integer.") }
    return Int(double)
  }

  private func dictionary(_ value: [String: Any], _ key: String) throws -> [String: Any] {
    guard let result = value[key] as? [String: Any]
    else { throw exception("\(key) must be an object.") }
    return result
  }

  private func dictionaries(_ value: [String: Any], _ key: String) throws -> [[String: Any]] {
    guard let result = value[key] as? [[String: Any]]
    else { throw exception("\(key) must be an object array.") }
    return result
  }

  private func optionalDictionaries(
    _ value: [String: Any],
    _ key: String
  ) throws -> [[String: Any]] {
    guard let raw = value[key] else { return [] }
    guard let items = raw as? [Any] else { throw exception("\(key) must be an object array.") }
    return try items.map { item in
      guard let object = item as? [String: Any] else {
        throw exception("\(key) must contain only objects.")
      }
      return object
    }
  }

  private func boolean(
    _ value: [String: Any],
    _ key: String,
    default fallback: Bool? = nil
  ) throws -> Bool {
    guard let raw = value[key] else {
      guard let fallback else { throw exception("\(key) must be a boolean.") }
      return fallback
    }
    guard let numeric = raw as? NSNumber,
          CFGetTypeID(numeric) == CFBooleanGetTypeID()
    else { throw exception("\(key) must be a boolean.") }
    return numeric.boolValue
  }

  private func unique(_ values: [String], name: String) throws {
    guard Set(values).count == values.count else { throw exception("Duplicate \(name) ID.") }
  }

  private func exception(_ message: String) -> KakaoMapException {
    KakaoMapException(mapDimInvalidArgument, message)
  }
}
