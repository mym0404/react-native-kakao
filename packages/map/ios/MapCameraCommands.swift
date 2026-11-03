import CoreFoundation
import CoreGraphics
import Foundation
import KakaoMapsSDK

private let cameraUnsupported = "ERR_KAKAO_MAP_UNSUPPORTED_PLATFORM_FEATURE"
private let cameraDestroyed = "ERR_KAKAO_MAP_VIEW_DESTROYED"
private let maximumPendingCameraOperations = 64

final class MapCameraCommands {
  private weak var map: KakaoMap?
  private let emitOperation: ([String: Any]) -> Void
  private var generation: UInt = 0
  private var operations: [String: UInt] = [:]
  private var nextToken: UInt = 0
  private var disposed = false

  init(map: KakaoMap, emitOperation: @escaping ([String: Any]) -> Void) {
    self.map = map
    self.emitOperation = emitOperation
  }

  func command(_ command: [String: Any]) throws -> [String: Any] {
    try requireMainThread()
    let type = try command.string("type")
    switch type {
    case "getCapabilities": return capabilities()
    case "getState": return try ["type": "state", "camera": state(requireMap())]
    case "moveToHeight": return try moveToHeight(command)
    case "transform": return try transform(command)
    case "fit": return try fit(command)
    case "canShow": return try canShow(command)
    case "heightAtLevel": return try heightAtLevel(command)
    case "resetOrientation": return try resetOrientation(command)
    case "setBackToNorthDuringAutoElevation": return try setBackToNorth(command)
    case "setReferencePointLock": return try setReferencePointLock(command)
    default: throw invalidCamera("Unsupported advanced camera command: \(type).")
    }
  }

  func dispose() {
    precondition(Thread.isMainThread, "MapCameraCommands.dispose() must run on the main thread.")
    disposed = true
    generation &+= 1
    operations.removeAll()
    map = nil
  }

  func supersedePendingOperations() {
    supersedeOperations(except: nil)
  }

  private func moveToHeight(_ command: [String: Any]) throws -> [String: Any] {
    let camera = try command.object("camera")
    let latitude = try camera.finiteNumber("latitude")
    let longitude = try camera.finiteNumber("longitude")
    let height = try camera.finiteNumber("height")
    let tilt = try camera.finiteNumber("tilt")
    let rotation = try camera.finiteNumber("rotation")
    try validateCoordinate(latitude: latitude, longitude: longitude)
    guard height > 0, (0 ... 90).contains(tilt) else {
      throw invalidCamera(
        "Camera height must be positive and tilt must be between 0 and 90 degrees."
      )
    }
    let position = CameraPosition(
      target: MapPoint(longitude: longitude, latitude: latitude), height: height,
      rotation: rotation.normalizedDegrees * .pi / 180, tilt: tilt * .pi / 180
    )
    return try dispatch(CameraUpdate.make(cameraPosition: position), command: command)
  }

  private func transform(_ command: [String: Any]) throws -> [String: Any] {
    let delta = try command.object("delta")
    let supportedFields: Set = ["latitude", "longitude", "height", "rotation", "tilt"]
    guard !delta.isEmpty, Set(delta.keys).isSubset(of: supportedFields) else {
      throw invalidCamera("Camera transform delta must contain only supported transform fields.")
    }
    let transform = try CameraTransform(
      deltaPos: CameraTransformDelta(
        deltaLon: delta.optionalFiniteNumber("longitude") ?? 0,
        deltaLat: delta.optionalFiniteNumber("latitude") ?? 0
      ),
      deltaHeight: delta.optionalFiniteNumber("height") ?? 0,
      deltaRotation: (delta.optionalFiniteNumber("rotation") ?? 0) * (.pi / 180),
      deltaTilt: (delta.optionalFiniteNumber("tilt") ?? 0) * (.pi / 180)
    )
    return try dispatch(CameraUpdate.make(transform: transform), command: command)
  }

  private func fit(_ command: [String: Any]) throws -> [String: Any] {
    let points = try command.coordinates("coordinates")
    if let padding = try command.optionalFiniteNumber("padding"), padding != 0 {
      throw unsupportedCamera("Fit padding is not exposed by Kakao Maps iOS SDK 2.12.19.")
    }
    let map = try requireMap()
    let levelLimit = try command.optionalInteger("levelLimit")
    if let levelLimit, !(map.cameraMinLevel ... map.cameraMaxLevel).contains(levelLimit) {
      throw invalidCamera("Camera fit levelLimit is outside the configured camera range.")
    }
    return try dispatch(
      CameraUpdate.make(area: AreaRect(points: points), levelLimit: levelLimit ?? -1),
      command: command
    )
  }

  private func canShow(_ command: [String: Any]) throws -> [String: Any] {
    let map = try requireMap()
    let level = try command.integer("zoomLevel")
    guard (map.cameraMinLevel ... map.cameraMaxLevel).contains(level) else {
      throw invalidCamera("canShow zoomLevel is outside the configured camera range.")
    }
    let rotation = try command.optionalFiniteNumber("rotation") ?? 0
    let weight = try command.optionalFiniteNumber("weight") ?? 1
    guard weight > 0, weight <= Double(Float.greatestFiniteMagnitude) else {
      throw invalidCamera("canShow weight must be a positive finite Float value.")
    }
    let rect: CGRect? = try command["rect"].map { raw in
      guard let value = raw as? [String: Any]
      else { throw invalidCamera("rect must be an object.") }
      let x = try value.finiteNumber("x")
      let y = try value.finiteNumber("y")
      let width = try value.finiteNumber("width")
      let height = try value.finiteNumber("height")
      guard x >= 0, y >= 0, width >= 0, height >= 0,
            x + width <= map.viewRect.width, y + height <= map.viewRect.height
      else {
        throw invalidCamera("rect must be inside the map viewport.")
      }
      return CGRect(x: x, y: y, width: width, height: height)
    }
    return try [
      "type": "canShow",
      "value": map.canShow(
        mapPoints: command.coordinates("coordinates"), atLevel: level,
        rotationAngle: rotation.normalizedDegrees * .pi / 180, weight: Float(weight), inRect: rect
      )
    ]
  }

  private func heightAtLevel(_ command: [String: Any]) throws -> [String: Any] {
    let map = try requireMap()
    let level = try command.integer("zoomLevel")
    guard (map.minLevel ... map.maxLevel).contains(level) else {
      throw invalidCamera("heightAtLevel zoomLevel is outside the SDK map range.")
    }
    return ["type": "heightAtLevel", "height": map.heightAtLevel(level)]
  }

  private func resetOrientation(_ command: [String: Any]) throws -> [String: Any] {
    let map = try requireMap()
    let parsed = try animation(command)
    let operation = try beginOperation(command, animation: parsed)
    if parsed.options.consecutive.boolValue == false {
      supersedeOperations(except: operation?.id)
    }
    map.resetCameraOrientation(parsed.options) { [weak self] in
      self?.complete(operation)
    }
    return dispatched(operation?.id)
  }

  private func setBackToNorth(_ command: [String: Any]) throws -> [String: Any] {
    try requireMap().setBackToNorthDuringAutoElevation(command.bool("enabled"))
    return ["type": "applied"]
  }

  private func setReferencePointLock(_ command: [String: Any]) throws -> [String: Any] {
    let map = try requireMap()
    let gesture = try referenceGesture(command.string("gesture"))
    if try command.bool("locked") {
      map.lockReferencePoint(forGesture: gesture)
    } else {
      map.unlockReferencePoint(forGesture: gesture)
    }
    return ["type": "applied"]
  }

  private func dispatch(_ update: CameraUpdate, command: [String: Any]) throws -> [String: Any] {
    let map = try requireMap()
    let parsed = try animation(command)
    let operation = try beginOperation(command, animation: parsed)
    if parsed.options.durationInMillis == 0 || parsed.options.consecutive.boolValue == false {
      supersedeOperations(except: operation?.id)
    }
    let callback: () -> Void = { [weak self] in
      self?.complete(operation)
    }
    if parsed.options.durationInMillis == 0 {
      map.moveCamera(update, callback: callback)
    } else {
      map.animateCamera(cameraUpdate: update, options: parsed.options, callback: callback)
    }
    return dispatched(operation?.id)
  }

  private func animation(_ command: [String: Any]) throws -> (
    options: CameraAnimationOptions,
    supplied: Bool
  ) {
    guard let raw = command["animation"] else {
      return (
        CameraAnimationOptions(
          autoElevation: ObjCBool(false),
          consecutive: ObjCBool(false),
          durationInMillis: 0
        ),
        false
      )
    }
    guard let value = raw as? [String: Any] else {
      throw invalidCamera("animation must be an object.")
    }
    let duration = try value.integer("duration")
    guard (0 ... Int(Int32.max)).contains(duration) else {
      throw invalidCamera(
        "Animation duration must be an integer between 0 and 2147483647 milliseconds."
      )
    }
    return try (
      CameraAnimationOptions(
        autoElevation: ObjCBool(value.optionalBool("autoElevation") ?? false),
        consecutive: ObjCBool(value.optionalBool("consecutive") ?? false),
        durationInMillis: UInt(duration)
      ),
      true
    )
  }

  private func beginOperation(
    _ command: [String: Any],
    animation: (options: CameraAnimationOptions, supplied: Bool)
  ) throws -> (id: String, token: UInt, generation: UInt)? {
    guard let rawID = command["operationId"] else { return nil }
    guard let id = rawID as? String, !id.isEmpty else {
      throw invalidCamera("operationId must be a non-empty string.")
    }
    guard animation.supplied, animation.options.durationInMillis > 0 else {
      throw invalidCamera("operationId requires an animation with a positive duration.")
    }
    guard operations[id] == nil else {
      throw invalidCamera("operationId must be unique while pending.")
    }
    guard operations.count < maximumPendingCameraOperations else {
      throw KakaoMapException(
        "ERR_KAKAO_MAP_CAMERA_OPERATION_LIMIT",
        "Too many camera operations are pending."
      )
    }
    nextToken &+= 1
    operations[id] = nextToken
    return (id, nextToken, generation)
  }

  private func supersedeOperations(except preservedID: String?) {
    for id in Array(operations.keys) where id != preservedID {
      operations[id] = nil
      emitOperation(["operationId": id, "status": "superseded"])
    }
  }

  private func complete(_ operation: (id: String, token: UInt, generation: UInt)?) {
    guard let operation else { return }
    let body = { [weak self] in
      guard let self, !self.disposed, generation == operation.generation,
            operations[operation.id] == operation.token else { return }
      operations[operation.id] = nil
      guard let map else { return }
      emitOperation([
        "operationId": operation.id,
        "status": "completed",
        "camera": state(map)
      ])
    }
    if Thread.isMainThread {
      body()
    } else {
      DispatchQueue.main.async(execute: body)
    }
  }

  private func state(_ map: KakaoMap) -> [String: Any] {
    let margins = map.margins
    let center = CGPoint(
      x: (margins.left + map.viewRect.width - margins.right) / 2,
      y: (margins.top + map.viewRect.height - margins.bottom) / 2
    )
    let coordinate = map.getPosition(center).wgsCoord
    return [
      "latitude": coordinate.latitude,
      "longitude": coordinate.longitude,
      "zoomLevel": map.zoomLevel,
      "height": map.cameraHeight,
      "tilt": map.tiltAngle * 180 / .pi,
      "rotation": (map.rotationAngle * 180 / .pi).normalizedDegrees
    ]
  }

  private func capabilities() -> [String: Any] {
    [
      "type": "capabilities",
      "capabilities": [
        "transform": true,
        "absoluteHeight": true,
        "heightAtLevel": true,
        "fit": ["padding": false, "levelLimit": true],
        "canShow": ["basic": true, "rotation": true, "weight": true, "rect": true],
        "resetOrientation": true,
        "backToNorthDuringAutoElevation": true,
        "animation": [
          "autoElevation": true,
          "consecutive": true,
          "operationCompletion": true
        ],
        "referencePoint": ["supported": true, "gestures": referenceGestures]
      ]
    ]
  }

  private func requireMap() throws -> KakaoMap {
    guard !disposed, let map else {
      throw KakaoMapException(cameraDestroyed, "The map view was destroyed.")
    }
    return map
  }
}

private let referenceGestures = ["rotate", "zoom", "tilt", "rotateZoom", "oneFingerZoom"]

private func referenceGesture(_ value: String) throws -> GestureType {
  switch value {
  case "rotate": .rotate
  case "zoom": .zoom
  case "tilt": .tilt
  case "rotateZoom": .rotateZoom
  case "oneFingerZoom": .oneFingerZoom
  default: throw invalidCamera("Unsupported reference-point gesture: \(value).")
  }
}

private func dispatched(_ operationID: String?) -> [String: Any] {
  var payload: [String: Any] = ["type": "dispatched"]
  if let operationID {
    payload["operationId"] = operationID
  }
  return payload
}

private func validateCoordinate(latitude: Double, longitude: Double) throws {
  guard (-90 ... 90).contains(latitude), (-180 ... 180).contains(longitude) else {
    throw invalidCamera("Coordinate latitude or longitude is outside its valid range.")
  }
}

private extension [String: Any] {
  func string(_ name: String) throws -> String {
    guard let value = self[name] as? String else {
      throw invalidCamera("\(name) must be a string.")
    }
    return value
  }

  func bool(_ name: String) throws -> Bool {
    guard let value = self[name] as? NSNumber, CFGetTypeID(value) == CFBooleanGetTypeID() else {
      throw invalidCamera("\(name) must be a boolean.")
    }
    return value.boolValue
  }

  func optionalBool(_ name: String) throws -> Bool? {
    guard let raw = self[name] else { return nil }
    guard let value = raw as? NSNumber, CFGetTypeID(value) == CFBooleanGetTypeID() else {
      throw invalidCamera("\(name) must be a boolean.")
    }
    return value.boolValue
  }

  func object(_ name: String) throws -> [String: Any] {
    guard let value = self[name] as? [String: Any] else {
      throw invalidCamera("\(name) must be an object.")
    }
    return value
  }

  func finiteNumber(_ name: String) throws -> Double {
    guard let value = try optionalFiniteNumber(name) else {
      throw invalidCamera("\(name) must be a finite number.")
    }
    return value
  }

  func optionalFiniteNumber(_ name: String) throws -> Double? {
    guard let raw = self[name] else { return nil }
    guard let number = raw as? NSNumber, CFGetTypeID(number) != CFBooleanGetTypeID() else {
      throw invalidCamera("\(name) must be a finite number.")
    }
    let value = number.doubleValue
    guard value.isFinite else { throw invalidCamera("\(name) must be a finite number.") }
    return value
  }

  func integer(_ name: String) throws -> Int {
    guard let value = try optionalInteger(name) else {
      throw invalidCamera("\(name) must be an integer.")
    }
    return value
  }

  func optionalInteger(_ name: String) throws -> Int? {
    guard let value = try optionalFiniteNumber(name) else { return nil }
    guard let integer = Int(exactly: value) else {
      throw invalidCamera("\(name) must be an integer.")
    }
    return integer
  }

  func coordinates(_ name: String) throws -> [MapPoint] {
    guard let values = self[name] as? [[String: Any]], !values.isEmpty else {
      throw invalidCamera("\(name) must contain at least one coordinate.")
    }
    return try values.map { coordinate in
      let latitude = try coordinate.finiteNumber("latitude")
      let longitude = try coordinate.finiteNumber("longitude")
      try validateCoordinate(latitude: latitude, longitude: longitude)
      return MapPoint(longitude: longitude, latitude: latitude)
    }
  }
}

private extension Double {
  var normalizedDegrees: Double {
    (truncatingRemainder(dividingBy: 360) + 360).truncatingRemainder(dividingBy: 360)
  }
}

private func requireMainThread() throws {
  guard Thread.isMainThread else {
    throw KakaoMapException(
      "ERR_KAKAO_MAP_WRONG_THREAD",
      "Advanced camera commands must run on the main thread."
    )
  }
}

private func invalidCamera(_ message: String) -> KakaoMapException {
  KakaoMapException(invalidCameraArgument, message)
}

private func unsupportedCamera(_ message: String) -> KakaoMapException {
  KakaoMapException(cameraUnsupported, message)
}
