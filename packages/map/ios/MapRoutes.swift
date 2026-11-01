import CoreFoundation
import KakaoMapsSDK
import UIKit

final class MapRoutes {
  private let imageLoader: MapImageLoader
  private let emit: (String, [String: Any]) -> Void
  private let manager: RouteManager
  private var layers: [String: RouteLayer] = [:]
  private var routes: [String: Route] = [:]
  private var styles: [String: RouteStyleSet] = [:]
  private var styleCounts: [String: Int] = [:]
  private var nativeStyleIDs: [String: String] = [:]
  private var nativeLayerIDs: [String: String] = [:]
  private var routeLayerIDs: [String: String] = [:]
  private var animators: [String: RouteAnimator] = [:]
  private var animationTargets: [String: Set<String>] = [:]
  private var animationNativeIDs: [String: String] = [:]
  private var animationRunEpochs: [String: UInt64] = [:]
  private var progress: [String: Float] = [:]
  private var progressEpochs: [String: UInt64] = [:]
  private var imageTokens: [MapImageLoadToken] = []
  private var pendingApply: ((Result<[String: Any], Error>) -> Void)?
  private var generation = 0
  private var sceneSequence = 0
  private var animationSequence: UInt64 = 0

  init(
    map: KakaoMap,
    imageLoader: MapImageLoader,
    emit: @escaping (String, [String: Any]) -> Void
  ) {
    self.imageLoader = imageLoader
    self.emit = emit
    manager = map.getRouteManager()
  }

  func apply(
    _ scene: [String: Any],
    completion: @escaping (Result<[String: Any], Error>) -> Void
  ) throws {
    rejectPendingApply(
      code: "ERR_KAKAO_MAP_ROUTE_SUPERSEDED",
      message: "The route scene was superseded by a newer update."
    )
    cancelImages()
    generation += 1
    let token = generation
    let styleSpecs = try scene.objectList("styleSets")
    let layerSpecs = try scene.objectList("layers")
    let routeSpecs = try scene.objectList("routes")
    try validateScene(styles: styleSpecs, layers: layerSpecs, routes: routeSpecs)
    pendingApply = completion
    let uris = try Set(styleSpecs.flatMap { style in
      try style.objectList("patterns").flatMap { pattern in
        try [pattern.object("image").string("uri"), pattern.optionalObject("symbol")?.string("uri")]
          .compactMap { $0 }
      }
    })
    guard !uris.isEmpty else {
      let result = Result { try buildScene(
        styles: styleSpecs,
        layers: layerSpecs,
        routes: routeSpecs,
        images: [:]
      ) }
      pendingApply = nil
      completion(result)
      return
    }
    var images: [String: UIImage] = [:]
    var didFinish = false
    let finish: (Result<[String: Any], Error>) -> Void = { [weak self] result in
      guard let self, !didFinish, token == generation else { return }
      didFinish = true
      if case .failure = result {
        imageTokens.forEach { $0.cancel() }
      }
      imageTokens.removeAll()
      pendingApply = nil
      completion(result)
    }
    for uri in uris {
      imageTokens.append(imageLoader.load(uri) { [weak self] result in
        guard let self, token == generation else { return }
        switch result {
        case let .success(image):
          images[uri] = image
          if images.count == uris.count {
            finish(Result { try self.buildScene(
              styles: styleSpecs,
              layers: layerSpecs,
              routes: routeSpecs,
              images: images
            ) })
          }
        case let .failure(error):
          finish(.failure(error))
        }
      })
    }
  }

  func command(_ command: [String: Any]) throws -> [String: Any] {
    switch try command.string("type") {
    case "setVisible":
      let visible = try command.bool("visible")
      let targets = try routeEntries(command.stringList("ids"))
      targets.forEach { visible ? $0.show() : $0.hide() }
      return none()
    case "setZIndex":
      try route(command.string("id")).zOrder = command.int("zIndex")
      return none()
    case "changeData":
      let id = try command.string("id")
      let styleID = try command.string("styleSetId")
      guard styles[styleID] != nil else { throw routeNotFound("route style set", id: styleID) }
      guard let nativeStyleID = nativeStyleIDs[styleID]
      else { throw routeNotFound("route style set", id: styleID) }
      let segmentSpecs = try command.objectList("segments")
      try validateSegments(segmentSpecs, styleCount: styleCounts[styleID] ?? 0)
      let target = try route(id)
      invalidateProgressRequest(id)
      try target.changeStyleAndData(
        styleID: nativeStyleID,
        segments: segmentSpecs.map(routeSegment)
      )
      return none()
    case "setProgress":
      let id = try command.string("id")
      let value = try routeProgress(command.double("progress"))
      let mode = try progressType(command.string("mode"))
      let duration = try command.nonnegativeInt("duration", default: 0)
      let target = try route(id)
      progress[id] = value
      let sceneGeneration = generation
      let requestEpoch = nextProgressEpoch(id)
      if duration == 0 {
        target.setProgress(progress: value, type: mode, duration: 0, callback: nil)
        emitRequestedProgress(
          id: id,
          progress: value,
          sceneGeneration: sceneGeneration,
          requestEpoch: requestEpoch,
          target: target
        )
      } else {
        target
          .setProgress(
            progress: value,
            type: mode,
            duration: UInt(duration)
          ) { [weak self] completedRoute in
            guard completedRoute == nil || completedRoute === target else { return }
            self?.emitRequestedProgress(
              id: id,
              progress: value,
              sceneGeneration: sceneGeneration,
              requestEpoch: requestEpoch,
              target: target
            )
          }
      }
      return none()
    case "getProgress":
      throw routeUnsupported("iOS Kakao Maps does not expose fields from RouteProgressInfo.")
    case "getRequestedProgress":
      let id = try command.string("id")
      _ = try route(id)
      return ["type": "progress", "progress": progress[id] ?? 0, "source": "requested"]
    case "getProgressAtCoordinate":
      return try [
        "type": "progress",
        "source": "native",
        "progress": route(command.string("id"))
          .getProgressAlongRouteLine(position: command.coordinate("coordinate"))
      ]
    case "getCoordinateAtProgress":
      throw routeUnsupported(
        "iOS Kakao Maps does not expose fields from RoutePointInfo."
      )
    case "getState":
      return try state(command.string("id"))
    case "getCounts":
      return counts()
    case "getCapabilities":
      return capabilities().merging(["type": "capabilities"]) { _, new in new }
    case "startProgressAnimation":
      try startAnimation(command.object("animation"))
      return none()
    case "stopAnimation":
      try stopAnimation(command.string("animationId"), emitEvent: true)
      return none()
    case "remove":
      let ids = try command.stringList("ids")
      _ = try routeEntries(ids)
      try ids.forEach(remove)
      return none()
    default:
      throw routeInvalid("Unknown route command type.")
    }
  }

  func dispose() {
    generation += 1
    rejectPendingApply(
      code: "ERR_KAKAO_MAP_ROUTE_DISPOSED",
      message: "The map view was disposed while applying the route scene."
    )
    cancelImages()
    disposeObjects()
    styles.removeAll()
    styleCounts.removeAll()
    nativeStyleIDs.removeAll()
    nativeLayerIDs.removeAll()
    routeLayerIDs.removeAll()
  }

  private func rejectPendingApply(code: String, message: String) {
    let completion = pendingApply
    pendingApply = nil
    completion?(.failure(KakaoMapException(code, message)))
  }

  func capabilities() -> [String: Any] {
    [
      "curves": true,
      "patterns": true,
      "patternSymbols": true,
      "patternImageSizing": false,
      "progressAtCoordinate": true,
      "coordinateAtProgress": false,
      "nativeProgressRead": false,
      "fractionalStyleWidth": false,
      "progressAnimationRepeat": false
    ]
  }

  private func validateScene(
    styles styleSpecs: [[String: Any]],
    layers layerSpecs: [[String: Any]],
    routes routeSpecs: [[String: Any]]
  ) throws {
    try requireUniqueRoute(styleSpecs, noun: "style set")
    try requireUniqueRoute(layerSpecs, noun: "route layer")
    try requireUniqueRoute(routeSpecs, noun: "route")
    for layer in layerSpecs {
      _ = try layer.int("zIndex", default: 0)
      _ = try layer.bool("visible", default: true)
    }
    let styles = try Dictionary(uniqueKeysWithValues: styleSpecs.map { try ($0.string("id"), $0) })
    let layerIDs = try Set(layerSpecs.map { try $0.string("id") })
    for route in routeSpecs {
      _ = try route.int("zIndex", default: 0)
      _ = try route.bool("visible", default: true)
      let id = try route.string("id")
      guard try layerIDs.contains(route.string("layerId"))
      else { throw routeInvalid("Route \(id) references an unknown layer.") }
      let styleID = try route.string("styleSetId")
      guard let style = styles[styleID]
      else { throw routeInvalid("Route \(id) references an unknown style set.") }
      let styleCount = try style.objectList("styles").count
      let segments = try route.objectList("segments")
      guard !segments.isEmpty else { throw routeInvalid("Routes require at least one segment.") }
      for segment in segments {
        guard try segment.coordinateList("coordinates").count >= 2
        else { throw routeInvalid("Route segments require at least two coordinates.") }
        guard try segment.nonnegativeInt("styleIndex", default: 0) < styleCount
        else { throw routeInvalid("Route segment styleIndex is out of range.") }
        _ = try routeSegment(segment)
      }
    }
    for style in styleSpecs {
      let patterns = try style.objectList("patterns")
      let patternCount = patterns.count
      for pattern in patterns {
        let image = try pattern.object("image")
        guard try !image.string("uri").isEmpty
        else { throw routeInvalid("Route pattern image URI must not be empty.") }
        try rejectRouteImageSizing(image)
        if let symbol = try pattern.optionalObject("symbol") {
          guard try !symbol.string("uri").isEmpty
          else { throw routeInvalid("Route symbol image URI must not be empty.") }
          try rejectRouteImageSizing(symbol)
        }
        guard try pattern.nonnegativeDouble("distance") > 0
        else { throw routeInvalid("Route pattern distance must be positive.") }
      }
      let routeStyles = try style.objectList("styles")
      guard !routeStyles.isEmpty else { throw routeInvalid("Route style sets require styles.") }
      for routeStyle in routeStyles {
        guard try !routeStyle.objectList("levels").isEmpty
        else { throw routeInvalid("Route styles require levels.") }
      }
      for level in try routeStyles.flatMap({ try $0.objectList("levels") }) {
        let index = try level.int("patternIndex", default: -1)
        guard (-1 ..< patternCount).contains(index)
        else { throw routeInvalid("Route patternIndex is out of range.") }
        _ = try level.nonnegativeInt("width")
        _ = try level.nonnegativeInt("strokeWidth", default: 0)
        _ = try level.int("level")
        _ = try level.color("color")
        _ = try level.color("strokeColor", default: .clear)
      }
    }
  }

  private func buildScene(
    styles styleSpecs: [[String: Any]],
    layers layerSpecs: [[String: Any]],
    routes routeSpecs: [[String: Any]],
    images: [String: UIImage]
  ) throws -> [String: Any] {
    var nextStyles: [String: RouteStyleSet] = [:]
    var nextStyleCounts: [String: Int] = [:]
    var nextNativeStyleIDs: [String: String] = [:]
    var nextLayers: [String: RouteLayer] = [:]
    var nextNativeLayerIDs: [String: String] = [:]
    var nextRoutes: [String: Route] = [:]
    var nextRouteLayerIDs: [String: String] = [:]
    try registerStyles(
      styleSpecs,
      images: images,
      styles: &nextStyles,
      styleCounts: &nextStyleCounts,
      nativeStyleIDs: &nextNativeStyleIDs
    )
    let scenePrefix = "rnk-routes-\(ObjectIdentifier(self).hashValue)-scene-\(sceneSequence)"
    sceneSequence += 1
    do {
      for spec in layerSpecs {
        let id = try spec.string("id")
        let nativeID = "\(scenePrefix)-layer-\(id)"
        guard let layer = try manager.addRouteLayer(
          layerID: nativeID,
          zOrder: spec.int("zIndex", default: 0)
        ) else {
          throw routeInvalid("Could not create route layer \(id).")
        }
        layer.visible = false
        nextLayers[id] = layer
        nextNativeLayerIDs[id] = nativeID
      }
      for spec in routeSpecs {
        let id = try spec.string("id")
        let styleID = try spec.string("styleSetId")
        guard let nativeStyleID = nextNativeStyleIDs[styleID]
        else { throw routeNotFound("route style set", id: styleID) }
        let options = try RouteOptions(
          routeID: id,
          styleID: nativeStyleID,
          zOrder: spec.int("zIndex", default: 0)
        )
        options.segments = try spec.objectList("segments").map(routeSegment)
        let layerID = try spec.string("layerId")
        guard let value = nextLayers[layerID]?.addRoute(option: options) else {
          throw routeInvalid("Could not create route \(id).")
        }
        if try spec.bool("visible", default: true) {
          value.show()
        } else {
          value.hide()
        }
        nextRoutes[id] = value
        nextRouteLayerIDs[id] = layerID
      }
    } catch {
      nextNativeLayerIDs.values.forEach { manager.removeRouteLayer(layerID: $0) }
      throw error
    }
    disposeObjects()
    styles = nextStyles
    styleCounts = nextStyleCounts
    nativeStyleIDs = nextNativeStyleIDs
    layers = nextLayers
    nativeLayerIDs = nextNativeLayerIDs
    routes = nextRoutes
    routeLayerIDs = nextRouteLayerIDs
    progress = Dictionary(uniqueKeysWithValues: nextRoutes.keys.map { ($0, 0) })
    for spec in layerSpecs {
      try nextLayers[spec.string("id")]?.visible = try spec.bool("visible", default: true)
    }
    return counts()
  }

  private func registerStyles(
    _ specs: [[String: Any]],
    images: [String: UIImage],
    styles: inout [String: RouteStyleSet],
    styleCounts: inout [String: Int],
    nativeStyleIDs: inout [String: String]
  ) throws {
    for spec in specs {
      let id = try spec.string("id")
      let nativeID = mapStyleNativeID("rnk-route-style", spec)
      let patterns = try spec.objectList("patterns").map { pattern -> RoutePattern in
        let imageURI = try pattern.object("image").string("uri")
        guard let image = images[imageURI]
        else { throw routeInvalid("Missing route pattern image.") }
        let symbol = try pattern.optionalObject("symbol").map { source -> UIImage in
          let uri = try source.string("uri")
          guard let result = images[uri] else { throw routeInvalid("Missing route symbol image.") }
          return result
        }
        return try RoutePattern(
          pattern: image,
          distance: routePixelFloat(pattern.nonnegativeDouble("distance")),
          symbol: symbol,
          pinStart: pattern.bool("pinStart", default: false),
          pinEnd: pattern.bool("pinEnd", default: false)
        )
      }
      let routeStyles = try spec.objectList("styles").map { style in
        try RouteStyle(styles: style.objectList("levels").map { level in
          try PerLevelRouteStyle(
            width: routePixelUInt(level.nonnegativeInt("width")),
            color: level.color("color"),
            strokeWidth: routePixelUInt(level.nonnegativeInt("strokeWidth", default: 0)),
            strokeColor: level.color("strokeColor", default: .clear),
            level: level.int("level"),
            patternIndex: level.int("patternIndex", default: -1)
          )
        })
      }
      let styleSet = RouteStyleSet(styleID: nativeID, styles: routeStyles)
      patterns.forEach(styleSet.addPattern)
      manager.addRouteStyleSet(styleSet)
      styles[id] = styleSet
      styleCounts[id] = routeStyles.count
      nativeStyleIDs[id] = nativeID
    }
  }

  private func routeSegment(_ spec: [String: Any]) throws -> RouteSegment {
    try RouteSegment(
      points: routePoints(spec),
      styleIndex: UInt(spec.nonnegativeInt("styleIndex", default: 0))
    )
  }

  private func validateSegments(_ segments: [[String: Any]], styleCount: Int) throws {
    guard !segments.isEmpty else { throw routeInvalid("Routes require at least one segment.") }
    for segment in segments {
      guard try segment.coordinateList("coordinates").count >= 2
      else { throw routeInvalid("Route segments require at least two coordinates.") }
      guard try segment.nonnegativeInt("styleIndex", default: 0) < styleCount
      else { throw routeInvalid("Route segment styleIndex is out of range.") }
      _ = try routeSegment(segment)
    }
  }

  private func routePoints(_ spec: [String: Any]) throws -> [MapPoint] {
    let coordinates = try spec.coordinateList("coordinates")
    let curve = try spec.optionalString("curve") ?? "none"
    let points: [MapPoint]
    switch curve {
    case "none": points = coordinates
    case "left",
         "right":
      points = coordinates.indices.dropLast().flatMap { index -> [MapPoint] in
        let part = Primitives.getCurvePoints(
          startPoint: coordinates[index],
          endPoint: coordinates[index + 1],
          isLeft: curve == "left"
        )
        return index == 0 ? part : Array(part.dropFirst())
      }
    default: throw routeInvalid("Unknown route curve type.")
    }
    return points
  }

  private func startAnimation(_ animation: [String: Any]) throws {
    let id = try animation.string("animationId")
    guard !id.isEmpty else { throw routeInvalid("Route animationId must not be empty.") }
    guard animators[id] == nil else { throw routeInvalid("Route animation \(id) already exists.") }
    guard try animation.minimumInt("repeat", default: 1, minimum: 1) == 1 else {
      throw routeUnsupported("The Kakao route progress animator does not support repeat counts.")
    }
    let duration = try animation.minimumInt("duration", minimum: 1)
    let direction: ProgressDirection
    switch try animation.string("direction") {
    case "forward": direction = .forward
    case "backward": direction = .backward
    default: throw routeInvalid("Unknown route animation direction.")
    }
    let routeIDs = try animation.stringList("routeIds")
    guard !routeIDs.isEmpty else { throw routeInvalid("Route animation requires routeIds.") }
    let mode = try animation.string("mode")
    let resetToInitial = try animation.bool("resetToInitial", default: false)
    let targets = try routeIDs.map(route)
    let effect = try ProgressAnimationEffect(
      direction: direction,
      type: progressType(mode)
    )
    effect.interpolation = try routeInterpolation(
      duration: duration,
      method: animation.optionalString("interpolation") ?? "linear"
    )
    effect.hideAtStop = try animation.bool("hideAtStop", default: false)
    effect.resetToInitialState = resetToInitial
    animationSequence &+= 1
    let runEpoch = animationSequence
    let nativeID = "rnk-route-\(ObjectIdentifier(self).hashValue)-\(runEpoch)"
    guard let animator = manager.addRouteAnimator(animatorID: nativeID, effect: effect) else {
      throw routeInvalid("Could not create route animation \(id).")
    }
    routeIDs.forEach(invalidateProgressRequest)
    for (index, routeID) in routeIDs.enumerated() {
      animator.addRoute(targets[index])
      if !resetToInitial {
        progress[routeID] = mode == "fill" ? 1 : 0
      }
    }
    animator.setStopCallback { [weak self, weak animator] _ in
      guard let self,
            let animator,
            animationNativeIDs[id] == nativeID,
            animationRunEpochs[id] == runEpoch,
            animators[id] === animator
      else { return }
      animators.removeValue(forKey: id)
      animationTargets.removeValue(forKey: id)
      animationNativeIDs.removeValue(forKey: id)
      animationRunEpochs.removeValue(forKey: id)
      manager.removeRouteAnimator(animatorID: nativeID)
      emit("onRouteAnimationStop", ["animationId": id])
    }
    animators[id] = animator
    animationTargets[id] = Set(routeIDs)
    animationNativeIDs[id] = nativeID
    animationRunEpochs[id] = runEpoch
    animator.start()
  }

  private func stopAnimation(_ id: String, emitEvent: Bool) throws {
    guard let animator = animators.removeValue(forKey: id) else { throw routeNotFound(
      "route animation",
      id: id
    ) }
    animationTargets.removeValue(forKey: id)
    guard let nativeID = animationNativeIDs.removeValue(forKey: id)
    else { throw routeNotFound("route animation", id: id) }
    animationRunEpochs.removeValue(forKey: id)
    animator.setStopCallback(nil)
    animator.stop()
    manager.removeRouteAnimator(animatorID: nativeID)
    if emitEvent {
      emit("onRouteAnimationStop", ["animationId": id])
    }
  }

  private func state(_ id: String) throws -> [String: Any] {
    let value = try route(id)
    guard let layerID = routeLayerIDs[id]
    else { throw routeNotFound("route layer", id: "") }
    return [
      "type": "state",
      "id": id,
      "layerId": layerID,
      "visible": value.isShow,
      "zIndex": value.zOrder,
      "nativeProgress": NSNull(),
      "requestedProgress": progress[id] ?? 0
    ]
  }

  private func counts() -> [String: Any] {
    [
      "type": "counts",
      "layers": layers.count,
      "routes": routes.count,
      "animations": animators.count
    ]
  }

  private func none() -> [String: Any] {
    ["type": "none"]
  }

  private func route(_ id: String) throws -> Route {
    guard let value = routes[id]
    else { throw routeNotFound(
      "route",
      id: id
    ) }; return value
  }

  private func routeEntries(_ ids: [String]) throws -> [Route] {
    guard Set(ids).count == ids.count
    else { throw routeInvalid("Route command IDs must be unique.") }
    return try ids.map(route)
  }

  private func remove(_ id: String) throws {
    invalidateProgressRequest(id)
    for animationID in animationTargets.filter({ $0.value.contains(id) }).map(\.key) {
      try stopAnimation(animationID, emitEvent: true)
    }
    let value = try route(id)
    guard let layerID = routeLayerIDs[id], let layer = layers[layerID] else { throw routeNotFound(
      "route layer",
      id: routeLayerIDs[id] ?? ""
    ) }
    layer.removeRoute(routeID: value.routeID)
    routes.removeValue(forKey: id)
    progress.removeValue(forKey: id)
    routeLayerIDs.removeValue(forKey: id)
  }

  private func cancelImages() {
    imageTokens.forEach { $0.cancel() }
    imageTokens.removeAll()
  }

  private func disposeObjects() {
    let activeAnimators = animators
    let activeNativeIDs = animationNativeIDs
    animators.removeAll()
    animationTargets.removeAll()
    animationNativeIDs.removeAll()
    animationRunEpochs.removeAll()
    for (id, animator) in activeAnimators {
      animator.setStopCallback(nil)
      animator.stop()
      if let nativeID = activeNativeIDs[id] {
        manager.removeRouteAnimator(animatorID: nativeID)
      }
    }
    nativeLayerIDs.values.forEach { manager.removeRouteLayer(layerID: $0) }
    layers.removeAll()
    nativeLayerIDs.removeAll()
    routes.removeAll()
    routeLayerIDs.removeAll()
    progress.removeAll()
    progressEpochs.removeAll()
  }

  @discardableResult
  private func nextProgressEpoch(_ id: String) -> UInt64 {
    let epoch = (progressEpochs[id] ?? 0) &+ 1
    progressEpochs[id] = epoch
    return epoch
  }

  private func invalidateProgressRequest(_ id: String) {
    nextProgressEpoch(id)
  }

  private func emitRequestedProgress(
    id: String,
    progress: Float,
    sceneGeneration: Int,
    requestEpoch: UInt64,
    target: Route
  ) {
    guard generation == sceneGeneration,
          progressEpochs[id] == requestEpoch,
          routes[id] === target
    else { return }
    emit("onRouteProgress", ["id": id, "progress": progress, "source": "requested"])
  }
}

private func routeProgress(_ value: Double) throws -> Float {
  guard value.isFinite,
        (0 ... 1).contains(value)
  else { throw routeInvalid("Route progress must be between 0 and 1.") }
  return Float(value)
}

private func progressType(_ value: String) throws -> RouteProgressType {
  switch value {
  case "fill": .fillFromStart; case "clear": .clearFromStart; default: throw routeInvalid(
      "Unknown route progress mode."
    )
  }
}

private func routeInterpolation(
  duration: Int,
  method value: String
) throws -> AnimationInterpolation {
  let method: InterpolationMethodType
  switch value {
  case "linear": method = .linear; case "cubicIn": method = .cubicIn; case "cubicOut": method =
    .cubicOut; case "cubicInOut": method =
    .cubicInOut; default: throw routeInvalid("Unknown interpolation \(value).")
  }
  return AnimationInterpolation(duration: UInt32(duration), method: method)
}

private func rejectRouteImageSizing(_ source: [String: Any]) throws {
  guard source["width"] == nil, source["height"] == nil
  else { throw routeUnsupported("Kakao route patterns use the source bitmap size.") }
}

private func requireUniqueRoute(_ values: [[String: Any]], noun: String) throws {
  let ids = try values.map { try $0.string("id") }; guard Set(ids).count == ids.count
  else { throw routeInvalid("Duplicate \(noun) ID.") }
  guard !ids.contains(where: \.isEmpty)
  else { throw routeInvalid("\(noun) ID must not be empty.") }
}

private func routeInvalid(_ message: String) -> KakaoMapException {
  KakaoMapException(
    "ERR_KAKAO_MAP_ROUTE_INVALID_ARGUMENT",
    message
  )
}

private func routeUnsupported(_ message: String) -> KakaoMapException {
  KakaoMapException(
    "ERR_KAKAO_MAP_ROUTE_UNSUPPORTED",
    message
  )
}

private func routeNotFound(_ noun: String, id: String) -> KakaoMapException {
  KakaoMapException(
    "ERR_KAKAO_MAP_ROUTE_NOT_FOUND",
    "Unknown \(noun) \(id)."
  )
}

private extension [String: Any] {
  func object(_ key: String) throws
    -> [String: Any]
  {
    guard let value = self[key] as? [String: Any]
    else { throw routeInvalid("\(key) must be an object.") }; return value
  }

  func optionalObject(_ key: String) throws -> [String: Any]? {
    guard let raw = self[key]
    else { return nil }; guard let value = raw as? [String: Any]
    else { throw routeInvalid("\(key) must be an object.") }; return value
  }

  func objectList(_ key: String) throws -> [[String: Any]] {
    guard let raw = self[key]
    else { return [] }; guard let value = raw as? [[String: Any]]
    else { throw routeInvalid("\(key) must be an array of objects.") }; return value
  }

  func string(_ key: String) throws -> String {
    guard let value = self[key] as? String
    else { throw routeInvalid("\(key) must be a string.") }; return value
  }

  func optionalString(_ key: String) throws -> String? {
    guard let raw = self[key] else { return nil }
    guard let value = raw as? String
    else { throw routeInvalid("\(key) must be a string.") }
    return value
  }

  func stringList(_ key: String) throws -> [String] {
    guard let value = self[key] as? [String]
    else { throw routeInvalid("\(key) must be an array of strings.") }; return value
  }

  func bool(
    _ key: String,
    default fallback: Bool? = nil
  ) throws
    -> Bool
  {
    guard let raw = self[key] else {
      guard let fallback else { throw routeInvalid("\(key) must be a boolean.") }
      return fallback
    }
    guard CFGetTypeID(raw as CFTypeRef) == CFBooleanGetTypeID(),
          let value = raw as? Bool
    else { throw routeInvalid("\(key) must be a boolean.") }
    return value
  }

  func double(
    _ key: String,
    default fallback: Double? = nil
  ) throws -> Double {
    guard let raw = self[key] else {
      guard let fallback else { throw routeInvalid("\(key) must be finite.") }
      return fallback
    }
    guard let value = raw as? NSNumber,
          CFGetTypeID(value) != CFBooleanGetTypeID(),
          value.doubleValue.isFinite
    else { throw routeInvalid("\(key) must be finite.") }
    return value.doubleValue
  }

  func int(_ key: String, default fallback: Int? = nil) throws -> Int {
    let value = try double(
      key,
      default: fallback.map(Double.init)
    ); guard let integer = Int(exactly: value)
    else { throw routeInvalid("\(key) must be an integer.") }; return integer
  }

  func nonnegativeInt(
    _ key: String,
    default fallback: Int? = nil
  ) throws -> Int {
    let value = try int(
      key,
      default: fallback
    ); guard value >= 0 else { throw routeInvalid("\(key) must be non-negative.") }; return value
  }

  func minimumInt(
    _ key: String,
    default fallback: Int? = nil,
    minimum: Int
  ) throws -> Int {
    let value = try int(
      key,
      default: fallback
    ); guard value >= minimum
    else { throw routeInvalid("\(key) must be at least \(minimum).") }; return value
  }

  func nonnegativeDouble(_ key: String) throws -> Double {
    let value = try double(
      key
    ); guard value >=
      0 else { throw routeInvalid("\(key) must be non-negative.") }; return value
  }

  func color(
    _ key: String,
    default fallback: UIColor? = nil
  ) throws
    -> UIColor
  {
    guard let raw = self[key] else {
      guard let fallback else { throw routeInvalid("\(key) must be a color.") }
      return fallback
    }
    guard let value = raw as? String
    else { throw routeInvalid("\(key) must be a color.") }
    return try parseRouteColor(value)
  }

  func coordinate(_ key: String) throws -> MapPoint {
    try object(key).coordinateValue()
  }

  func coordinateValue() throws
    -> MapPoint
  {
    let latitude = try double("latitude"); let longitude =
      try double("longitude"); guard (-90 ... 90).contains(latitude),
      (-180 ... 180).contains(longitude)
    else { throw routeInvalid("Invalid coordinate.") }; return MapPoint(
      longitude: longitude,
      latitude: latitude
    )
  }

  func coordinateList(_ key: String) throws
    -> [MapPoint]
  {
    guard let values = self[key] as? [[String: Any]]
    else { throw routeInvalid("\(key) must be an array of coordinates.") }; return try values
      .map { try $0.coordinateValue() }
  }
}

private func routePixels(_ points: Double) throws -> Double {
  let pixels = MapUnits.pixels(points)
  guard pixels.isFinite else { throw routeInvalid("Pixel dimensions must be finite.") }
  return pixels
}

private func routePixelUInt(_ points: Int) throws -> UInt {
  let pixels = try routePixels(Double(points)).rounded()
  guard let integer = UInt(exactly: pixels)
  else { throw routeInvalid("Pixel dimensions are out of range.") }
  return integer
}

private func routePixelFloat(_ points: Double) throws -> Float {
  let pixels = try routePixels(points)
  guard abs(pixels) <= Double(Float.greatestFiniteMagnitude)
  else { throw routeInvalid("Pixel dimensions are out of range.") }
  return Float(pixels)
}

private func parseRouteColor(_ value: String) throws -> UIColor {
  guard value.range(of: "^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$", options: .regularExpression) != nil
  else { throw routeInvalid("Colors must be #RRGGBB or #RRGGBBAA.") }
  let raw = String(value.dropFirst())
  let rgb = UInt64(raw.prefix(6), radix: 16) ?? 0
  let alpha = raw.count == 8 ? UInt64(raw.suffix(2), radix: 16) ?? 255 : 255
  return UIColor(
    red: CGFloat((rgb >> 16) & 255) / 255,
    green: CGFloat((rgb >> 8) & 255) / 255,
    blue: CGFloat(rgb & 255) / 255,
    alpha: CGFloat(alpha) / 255
  )
}
