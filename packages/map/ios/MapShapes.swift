import CoreFoundation
import KakaoMapsSDK
import UIKit

final class MapShapes {
  private let emit: (String, [String: Any]) -> Void
  private let manager: ShapeManager
  private var layers: [String: ShapeLayer] = [:]
  private var shapes: [String: ShapeEntry] = [:]
  private var animators: [String: ShapeAnimator] = [:]
  private var animationTargets: [String: Set<String>] = [:]
  private var animationNativeIDs: [String: String] = [:]
  private var animationRunEpochs: [String: UInt64] = [:]
  private var polygonStyles: [String: PolygonStyleSet] = [:]
  private var polylineStyles: [String: PolylineStyleSet] = [:]
  private var styleCounts: [String: Int] = [:]
  private var nativeStyleIDs: [String: String] = [:]
  private var nativeLayerIDs: [String: String] = [:]
  private var sceneSequence = 0
  private var replacementSequence = 0
  private var animationSequence: UInt64 = 0

  init(map: KakaoMap, emit: @escaping (String, [String: Any]) -> Void) {
    self.emit = emit
    manager = map.getShapeManager()
  }

  func apply(_ scene: [String: Any]) throws -> [String: Any] {
    let styleSpecs = try scene.objectList("styleSets")
    let layerSpecs = try scene.objectList("layers")
    let shapeSpecs = try scene.objectList("shapes")
    try validateScene(styles: styleSpecs, layers: layerSpecs, shapes: shapeSpecs)
    var nextPolygonStyles: [String: PolygonStyleSet] = [:]
    var nextPolylineStyles: [String: PolylineStyleSet] = [:]
    var nextStyleCounts: [String: Int] = [:]
    var nextNativeStyleIDs: [String: String] = [:]
    var nextLayers: [String: ShapeLayer] = [:]
    var nextNativeLayerIDs: [String: String] = [:]
    var nextShapes: [String: ShapeEntry] = [:]
    try registerStyles(
      styleSpecs,
      polygonStyles: &nextPolygonStyles,
      polylineStyles: &nextPolylineStyles,
      styleCounts: &nextStyleCounts,
      nativeStyleIDs: &nextNativeStyleIDs
    )
    let scenePrefix = "rnk-shapes-\(ObjectIdentifier(self).hashValue)-scene-\(sceneSequence)"
    sceneSequence += 1
    do {
      for spec in layerSpecs {
        try addLayer(
          spec,
          scenePrefix: scenePrefix,
          layers: &nextLayers,
          nativeLayerIDs: &nextNativeLayerIDs
        )
      }
      for spec in shapeSpecs {
        try addShape(
          spec,
          layers: nextLayers,
          shapes: &nextShapes,
          polygonStyles: nextPolygonStyles,
          polylineStyles: nextPolylineStyles,
          nativeStyleIDs: nextNativeStyleIDs
        )
      }
    } catch {
      nextNativeLayerIDs.values.forEach { manager.removeShapeLayer(layerID: $0) }
      throw error
    }
    disposeObjects()
    polygonStyles = nextPolygonStyles
    polylineStyles = nextPolylineStyles
    styleCounts = nextStyleCounts
    nativeStyleIDs = nextNativeStyleIDs
    layers = nextLayers
    nativeLayerIDs = nextNativeLayerIDs
    shapes = nextShapes
    for spec in layerSpecs {
      try nextLayers[spec.string("id")]?.visible = try spec.bool("visible", default: true)
    }
    return counts()
  }

  func command(_ command: [String: Any]) throws -> [String: Any] {
    switch try command.string("type") {
    case "setVisible":
      let isVisible = try command.bool("visible")
      let targets = try entries(command.stringList("ids"))
      try targets.forEach { try $0.setVisible(isVisible) }
      return none()
    case "setPosition":
      try entry(command.string("id")).setPosition(command.coordinate("position"))
      return none()
    case "setZIndex":
      throw shapeUnsupported("iOS Kakao Maps does not expose mutable shape z-order.")
    case "setOrientation":
      try entry(command.string("id")).setOrientation(command.double("orientation"))
      return none()
    case "changeData":
      try changeData(command)
      return none()
    case "startWave":
      try startWave(command.object("animation"))
      return none()
    case "stopAnimation":
      try stopAnimation(command.string("animationId"), emitEvent: true)
      return none()
    case "getState":
      return try state(command.string("id"))
    case "getCounts":
      return counts()
    case "getCapabilities":
      return capabilities().merging(["type": "capabilities"]) { _, new in new }
    case "remove":
      let ids = try command.stringList("ids")
      _ = try entries(ids)
      try ids.forEach(remove)
      return none()
    default:
      throw shapeInvalid("Unknown shape command type.")
    }
  }

  func capabilities() -> [String: Any] {
    [
      "layerPasses": ["default", "overlay", "route"],
      "geographicPrimitives": true,
      "modelPrimitives": true,
      "geographicPosition": false,
      "geographicOrientation": true,
      "modelPosition": true,
      "modelOrientation": true,
      "zIndexMutation": false,
      "fractionalStyleWidth": false,
      "waveAnimation": true,
      "waveTargets": ["polygon", "polyline"],
      "waveNaturalStopEvent": true
    ]
  }

  func resolveShape(_ id: String) -> (any Shape)? {
    shapes[id]?.nativeShape
  }

  func dispose() {
    disposeObjects()
    polygonStyles.removeAll()
    polylineStyles.removeAll()
    styleCounts.removeAll()
    nativeStyleIDs.removeAll()
    nativeLayerIDs.removeAll()
  }

  private func validateScene(
    styles styleSpecs: [[String: Any]],
    layers layerSpecs: [[String: Any]],
    shapes shapeSpecs: [[String: Any]]
  ) throws {
    try requireUniqueShape(styleSpecs, noun: "style set")
    try requireUniqueShape(layerSpecs, noun: "shape layer")
    try requireUniqueShape(shapeSpecs, noun: "shape")
    try styleSpecs.forEach(validateStyleSet)
    for layer in layerSpecs {
      _ = try layer.int("zIndex", default: defaultShapeLayerZIndex)
      _ = try shapeLayerPass(layer.optionalString("pass") ?? "default")
      _ = try layer.bool("visible", default: true)
    }
    let styleTypes = try Dictionary(uniqueKeysWithValues: styleSpecs.map { try (
      $0.string("id"),
      $0.string("type")
    ) })
    let styleCounts = try Dictionary(uniqueKeysWithValues: styleSpecs.map { try (
      $0.string("id"),
      $0.objectList("styles").count
    ) })
    let layerIDs = try Set(layerSpecs.map { try $0.string("id") })
    for spec in shapeSpecs {
      _ = try spec.int("zIndex", default: 0)
      _ = try spec.bool("visible", default: true)
      let geometry = try spec.object("geometry")
      let type = try geometry.string("type")
      let polylinePrimitives = ["geographicCurve", "modelArc", "geographicArc"]
      let requiredStyle = type.contains("Polyline") || polylinePrimitives
        .contains(type) ? "polyline" : "polygon"
      let id = try spec.string("id")
      guard try layerIDs.contains(spec.string("layerId"))
      else { throw shapeInvalid("Shape \(id) references an unknown layer.") }
      let styleID = try spec.string("styleSetId")
      guard styleTypes[styleID] == requiredStyle, let count = styleCounts[styleID] else {
        throw shapeInvalid("Shape \(id) references an incompatible style set.")
      }
      try validateShapeGeometry(normalizeShapeGeometry(geometry), styleCount: count)
    }
  }

  private func validateStyleSet(_ spec: [String: Any]) throws {
    let styles = try spec.objectList("styles")
    guard !styles.isEmpty else { throw shapeInvalid("Shape style sets require styles.") }
    switch try spec.string("type") {
    case "polygon":
      _ = try mapShapePolygonStyleSet(spec)
    case "polyline":
      _ = try polylineCap(spec.optionalString("cap") ?? "square")
      for style in styles {
        let levels = try style.objectList("levels")
        guard !levels.isEmpty else { throw shapeInvalid("Polyline styles require levels.") }
        for level in levels {
          _ = try level.int("level")
          _ = try level.nonnegativeInt("width")
          _ = try level.nonnegativeInt("strokeWidth", default: 0)
          _ = try level.color("color")
          _ = try level.color("strokeColor", default: .clear)
        }
      }
    default:
      throw shapeInvalid("Unknown shape style type.")
    }
  }

  private func registerStyles(
    _ specs: [[String: Any]],
    polygonStyles: inout [String: PolygonStyleSet],
    polylineStyles: inout [String: PolylineStyleSet],
    styleCounts: inout [String: Int],
    nativeStyleIDs: inout [String: String]
  ) throws {
    for spec in specs {
      let id = try spec.string("id")
      let nativeID = mapStyleNativeID("rnk-shape-style", spec)
      let nativeSpec = spec.merging(["id": nativeID]) { _, new in new }
      if try spec.string("type") == "polygon" {
        let styleSet = try mapShapePolygonStyleSet(nativeSpec)
        manager.addPolygonStyleSet(styleSet)
        polygonStyles[id] = styleSet
      } else {
        let styles = try spec.objectList("styles").map { style in
          try PolylineStyle(styles: style.objectList("levels").map { level in
            try PerLevelPolylineStyle(
              bodyColor: level.color("color"),
              bodyWidth: shapePixelUInt(level.nonnegativeInt("width")),
              strokeColor: level.color("strokeColor", default: .clear),
              strokeWidth: shapePixelUInt(level.nonnegativeInt("strokeWidth", default: 0)),
              level: level.int("level")
            )
          })
        }
        let styleSet = try PolylineStyleSet(
          styleSetID: nativeID,
          styles: styles,
          capType: polylineCap(spec.optionalString("cap") ?? "square")
        )
        manager.addPolylineStyleSet(styleSet)
        polylineStyles[id] = styleSet
      }
      styleCounts[id] = try spec.objectList("styles").count
      nativeStyleIDs[id] = nativeID
    }
  }

  private func addLayer(
    _ spec: [String: Any],
    scenePrefix: String,
    layers: inout [String: ShapeLayer],
    nativeLayerIDs: inout [String: String]
  ) throws {
    let id = try spec.string("id")
    let nativeID = "\(scenePrefix)-layer-\(id)"
    guard let layer = try manager.addShapeLayer(
      layerID: nativeID,
      zOrder: spec.int("zIndex", default: defaultShapeLayerZIndex),
      passType: shapeLayerPass(spec.optionalString("pass") ?? "default")
    ) else { throw shapeInvalid("Could not create shape layer \(id).") }
    layer.visible = false
    layers[id] = layer
    nativeLayerIDs[id] = nativeID
  }

  private func addShape(
    _ spec: [String: Any],
    layers: [String: ShapeLayer],
    shapes: inout [String: ShapeEntry],
    polygonStyles: [String: PolygonStyleSet],
    polylineStyles: [String: PolylineStyleSet],
    nativeStyleIDs: [String: String],
    nativeShapeID: String? = nil
  ) throws {
    let id = try spec.string("id")
    let shapeID = nativeShapeID ?? id
    let layerID = try spec.string("layerId")
    guard let layer = layers[layerID] else { throw shapeNotFound("shape layer", id: layerID) }
    let styleID = try spec.string("styleSetId")
    guard let nativeStyleID = nativeStyleIDs[styleID]
    else { throw shapeNotFound("shape style set", id: styleID) }
    let rawGeometry = try spec.object("geometry")
    let geometryType = try rawGeometry.string("type")
    let geometry = try normalizeShapeGeometry(rawGeometry)
    let zOrder = try spec.int("zIndex", default: 0)
    let isVisible = try spec.bool("visible", default: true)
    let type = try geometry.string("type")
    let entry: ShapeEntry
    switch type {
    case "geographicPolygon":
      guard polygonStyles[styleID] != nil else { throw shapeNotFound(
        "polygon style set",
        id: styleID
      ) }
      let options = MapPolygonShapeOptions(shapeID: shapeID, styleID: nativeStyleID, zOrder: zOrder)
      options.polygons = try geometry.objectList("parts").map(mapShapeMapPolygon)
      guard let shape = layer.addMapPolygonShape(options)
      else { throw shapeInvalid("Could not create polygon \(id).") }
      shape.userObject = NSNumber(value: zOrder)
      entry = .mapPolygon(layerID, geometryType, shape)
    case "modelPolygon":
      guard polygonStyles[styleID] != nil else { throw shapeNotFound(
        "polygon style set",
        id: styleID
      ) }
      let options = PolygonShapeOptions(shapeID: shapeID, styleID: nativeStyleID, zOrder: zOrder)
      options.basePosition = try geometry.coordinate("base")
      options.polygons = try geometry.objectList("parts").map(mapShapeModelPolygon)
      guard let shape = layer.addPolygonShape(options)
      else { throw shapeInvalid("Could not create model polygon \(id).") }
      shape.userObject = NSNumber(value: zOrder)
      shape.orientation = try geometry.double("orientation", default: 0) * .pi / 180
      entry = .polygon(layerID, geometryType, shape)
    case "geographicPolyline",
         "geographicCurve":
      guard polylineStyles[styleID] != nil else { throw shapeNotFound(
        "polyline style set",
        id: styleID
      ) }
      let options = MapPolylineShapeOptions(
        shapeID: shapeID,
        styleID: nativeStyleID,
        zOrder: zOrder
      )
      options.polylines = try geometry.objectList("parts").map(mapPolyline)
      guard let shape = layer.addMapPolylineShape(options)
      else { throw shapeInvalid("Could not create polyline \(id).") }
      shape.userObject = NSNumber(value: zOrder)
      entry = .mapPolyline(layerID, geometryType, shape)
    case "modelPolyline":
      guard polylineStyles[styleID] != nil else { throw shapeNotFound(
        "polyline style set",
        id: styleID
      ) }
      let options = PolylineShapeOptions(shapeID: shapeID, styleID: nativeStyleID, zOrder: zOrder)
      options.basePosition = try geometry.coordinate("base")
      options.polylines = try geometry.objectList("parts").map(modelPolyline)
      guard let shape = layer.addPolylineShape(options)
      else { throw shapeInvalid("Could not create model polyline \(id).") }
      shape.userObject = NSNumber(value: zOrder)
      shape.orientation = try geometry.double("orientation", default: 0) * .pi / 180
      entry = .polyline(layerID, geometryType, shape)
    default:
      throw shapeInvalid("Unsupported normalized shape geometry.")
    }
    try entry.setVisible(isVisible)
    shapes[id] = entry
  }

  private func normalizeShapeGeometry(_ geometry: [String: Any]) throws -> [String: Any] {
    switch try geometry.string("type") {
    case "modelCircle":
      let points = try Primitives.getCirclePoints(
        radius: geometry.positiveDouble("radius"),
        numPoints: geometry.minimumInt("pointCount", default: 64, minimum: 3),
        cw: geometry.bool("clockwise", default: true)
      ).map(shapeSDKModelPointToMeters)
      return try [
        "type": "modelPolygon",
        "base": geometry.object("base"),
        "orientation": geometry.double("orientation", default: 0),
        "parts": [[
          "outer": pointPayload(points),
          "styleIndex": geometry.int("styleIndex", default: 0)
        ]]
      ]
    case "modelRectangle":
      let points = try Primitives.getRectanglePoints(
        width: geometry.positiveDouble("width"),
        height: geometry.positiveDouble("height"),
        cw: geometry.bool("clockwise", default: true)
      ).map(shapeSDKModelPointToMeters)
      return try [
        "type": "modelPolygon",
        "base": geometry.object("base"),
        "orientation": geometry.double("orientation", default: 0),
        "parts": [[
          "outer": pointPayload(points),
          "styleIndex": geometry.int("styleIndex", default: 0)
        ]]
      ]
    case "geographicCircle":
      let points = try Primitives.getCirclePoints(
        radius: geometry.positiveDouble("radius"),
        numPoints: geometry.minimumInt("pointCount", default: 64, minimum: 3),
        cw: geometry.bool("clockwise", default: true),
        center: geometry.coordinate("center")
      )
      return try [
        "type": "geographicPolygon",
        "parts": [[
          "outer": coordinatePayload(points),
          "styleIndex": geometry.int("styleIndex", default: 0)
        ]]
      ]
    case "geographicRectangle":
      let points = try Primitives.getRectanglePoints(
        width: geometry.positiveDouble("width"),
        height: geometry.positiveDouble("height"),
        cw: geometry.bool("clockwise", default: true),
        center: geometry.coordinate("center")
      )
      return try [
        "type": "geographicPolygon",
        "parts": [[
          "outer": coordinatePayload(points),
          "styleIndex": geometry.int("styleIndex", default: 0)
        ]]
      ]
    case "geographicCurve":
      let isLeft: Bool
      switch try geometry.string("side") {
      case "left": isLeft = true
      case "right": isLeft = false
      default: throw shapeInvalid("Curve side must be left or right.")
      }
      let points = try Primitives.getCurvePoints(
        startPoint: geometry.coordinate("start"),
        endPoint: geometry.coordinate("end"),
        isLeft: isLeft
      )
      return try [
        "type": "geographicCurve",
        "parts": [[
          "points": coordinatePayload(points),
          "styleIndex": geometry.int("styleIndex", default: 0)
        ]]
      ]
    case "modelArc":
      return try [
        "type": "modelPolyline",
        "base": geometry.object("base"),
        "orientation": geometry.double("orientation", default: 0),
        "parts": [[
          "points": pointPayload(shapeArcPoints(geometry)),
          "styleIndex": geometry.int("styleIndex", default: 0)
        ]]
      ]
    case "geographicArc":
      let center = try geometry.coordinate("center")
      let points = try shapeArcPoints(geometry).map {
        shapeOffset(center, east: Double($0.x), north: Double($0.y))
      }
      return try [
        "type": "geographicPolyline",
        "parts": [[
          "points": coordinatePayload(points),
          "styleIndex": geometry.int("styleIndex", default: 0)
        ]]
      ]
    default:
      return geometry
    }
  }

  private func changeData(_ command: [String: Any]) throws {
    let id = try command.string("id")
    let old = try entry(id)
    let styleID = try command.string("styleSetId")
    let requestedGeometry = try command.object("geometry")
    let geometry = try normalizeShapeGeometry(requestedGeometry)
    let type = try geometry.string("type")
    let isVisible = old.isVisible
    let expectsPolyline = type.contains("Polyline") || type == "geographicCurve"
    guard expectsPolyline ? polylineStyles[styleID] != nil : polygonStyles[styleID] != nil
    else { throw shapeInvalid("Shape \(id) references an incompatible style set.") }
    try validateShapeGeometry(geometry, styleCount: styleCounts[styleID] ?? 0)
    let spec: [String: Any] = [
      "id": id,
      "layerId": old.layerID,
      "styleSetId": styleID,
      "zIndex": old.zOrder,
      "visible": false,
      "geometry": requestedGeometry
    ]
    var replacement: [String: ShapeEntry] = [:]
    try addShape(
      spec,
      layers: layers,
      shapes: &replacement,
      polygonStyles: polygonStyles,
      polylineStyles: polylineStyles,
      nativeStyleIDs: nativeStyleIDs,
      nativeShapeID: "rnk-shape-replacement-\(ObjectIdentifier(self).hashValue)-\(replacementSequence)"
    )
    replacementSequence += 1
    try remove(id)
    guard let value = replacement[id]
    else { throw shapeInvalid("Could not replace shape \(id).") }
    try value.setVisible(isVisible)
    shapes[id] = value
  }

  private func startWave(_ animation: [String: Any]) throws {
    let id = try animation.string("animationId")
    guard !id.isEmpty else { throw shapeInvalid("Shape animationId must not be empty.") }
    guard animators[id] == nil else { throw shapeInvalid("Shape animation \(id) already exists.") }
    let effect = try mapShapeWaveEffect(animation)
    let targets = try animation.stringList("shapeIds").map(entry)
    guard !targets.isEmpty else { throw shapeInvalid("Shape wave animation requires shapeIds.") }
    animationSequence &+= 1
    let runEpoch = animationSequence
    let nativeID = "rnk-shape-\(ObjectIdentifier(self).hashValue)-\(runEpoch)"
    guard let animator = manager.addShapeAnimator(animatorID: nativeID, effect: effect) else {
      throw shapeInvalid("Could not create shape animation \(id).")
    }
    for target in targets {
      switch target {
      case let .mapPolygon(_, _, shape): animator.addMapPolygonShape(shape)
      case let .polygon(_, _, shape): animator.addPolygonShape(shape)
      case let .mapPolyline(_, _, shape): animator.addMapPolylineShape(shape)
      case let .polyline(_, _, shape): animator.addPolylineShape(shape)
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
      manager.removeShapeAnimator(animatorID: nativeID)
      emit("onShapeAnimationStop", ["animationId": id])
    }
    animators[id] = animator
    animationTargets[id] = try Set(animation.stringList("shapeIds"))
    animationNativeIDs[id] = nativeID
    animationRunEpochs[id] = runEpoch
    animator.start()
  }

  private func stopAnimation(_ id: String, emitEvent: Bool) throws {
    guard let animator = animators.removeValue(forKey: id) else { throw shapeNotFound(
      "shape animation",
      id: id
    ) }
    animationTargets.removeValue(forKey: id)
    guard let nativeID = animationNativeIDs.removeValue(forKey: id)
    else { throw shapeNotFound("shape animation", id: id) }
    animationRunEpochs.removeValue(forKey: id)
    animator.setStopCallback(nil)
    animator.stop()
    manager.removeShapeAnimator(animatorID: nativeID)
    if emitEvent {
      emit("onShapeAnimationStop", ["animationId": id])
    }
  }

  private func remove(_ id: String) throws {
    for animationID in animationTargets.filter({ $0.value.contains(id) }).map(\.key) {
      try stopAnimation(animationID, emitEvent: true)
    }
    let value = try entry(id)
    guard let layer = layers[value.layerID] else { throw shapeNotFound(
      "shape layer",
      id: value.layerID
    ) }
    switch value {
    case let .mapPolygon(_, _, shape): layer.removeMapPolygonShape(shapeID: shape.shapeID)
    case let .polygon(_, _, shape): layer.removePolygonShape(shapeID: shape.shapeID)
    case let .mapPolyline(_, _, shape): layer.removeMapPolylineShape(shapeID: shape.shapeID)
    case let .polyline(_, _, shape): layer.removePolylineShape(shapeID: shape.shapeID)
    }
    shapes.removeValue(forKey: id)
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
        manager.removeShapeAnimator(animatorID: nativeID)
      }
    }
    for id in layers.keys {
      if let nativeID = nativeLayerIDs[id] {
        manager.removeShapeLayer(layerID: nativeID)
      }
    }
    layers.removeAll()
    nativeLayerIDs.removeAll()
    shapes.removeAll()
  }

  private func state(_ id: String) throws -> [String: Any] {
    let value = try entry(id)
    return [
      "type": "state",
      "id": id,
      "layerId": value.layerID,
      "visible": value.isVisible,
      "zIndex": value.zOrder,
      "geometryType": value.geometryType,
      "position": value.positionPayload ?? NSNull(),
      "orientation": value.orientationDegrees
    ]
  }

  private func counts() -> [String: Any] {
    [
      "type": "counts",
      "layers": layers.count,
      "shapes": shapes.count,
      "animations": animators.count
    ]
  }

  private func none() -> [String: Any] {
    ["type": "none"]
  }

  private func entry(_ id: String) throws -> ShapeEntry {
    guard let value = shapes[id]
    else { throw shapeNotFound(
      "shape",
      id: id
    ) }; return value
  }

  private func entries(_ ids: [String]) throws -> [ShapeEntry] {
    guard Set(ids).count == ids.count
    else { throw shapeInvalid("Shape command IDs must be unique.") }
    return try ids.map(entry)
  }
}

private enum ShapeEntry {
  case mapPolygon(String, String, MapPolygonShape)
  case polygon(String, String, PolygonShape)
  case mapPolyline(String, String, MapPolylineShape)
  case polyline(String, String, PolylineShape)

  var nativeShape: any Shape {
    switch self {
    case let .mapPolygon(_, _, value): value
    case let .polygon(_, _, value): value
    case let .mapPolyline(_, _, value): value
    case let .polyline(_, _, value): value
    }
  }

  var layerID: String {
    switch self { case let .mapPolygon(id, _, _),
         let .polygon(id, _, _),
         let .mapPolyline(
           id,
           _,
           _
         ),
         let .polyline(id, _, _): id }
  }

  var geometryType: String {
    switch self { case let .mapPolygon(_, type, _),
         let .polygon(
           _,
           type,
           _
         ),
         let .mapPolyline(_, type, _),
         let .polyline(_, type, _): type }
  }

  var isVisible: Bool {
    switch self { case let .mapPolygon(_, _, value): value.isShow; case let .polygon(
      _,
      _,
      value
    ): value.isShow; case let .mapPolyline(_, _, value): value
      .isShow; case let .polyline(_, _, value): value.isShow }
  }

  var zOrder: Int {
    switch self {
    case let .mapPolygon(_, _, value): (value.userObject as? NSNumber)?
      .intValue ?? 0; case let .polygon(
      _,
      _,
      value
    ): (value.userObject as? NSNumber)?.intValue ?? 0; case let .mapPolyline(_, _, value): (value
        .userObject as? NSNumber)?.intValue ?? 0; case let .polyline(
      _,
      _,
      value
    ): (value.userObject as? NSNumber)?.intValue ?? 0
    }
  }

  var positionPayload: [String: Double]? {
    switch self {
    case let .polygon(_, _, value):
      [
        "latitude": value.position.wgsCoord.latitude,
        "longitude": value.position.wgsCoord.longitude
      ]
    case let .polyline(_, _, value):
      [
        "latitude": value.position.wgsCoord.latitude,
        "longitude": value.position.wgsCoord.longitude
      ]
    case .mapPolygon,
         .mapPolyline:
      nil
    }
  }

  var orientationDegrees: Double {
    let radians: Double = switch self {
    case let .mapPolygon(_, _, value): value.orientation
    case let .polygon(_, _, value): value.orientation
    case let .mapPolyline(_, _, value): value.orientation
    case let .polyline(_, _, value): value.orientation
    }
    return radians * 180 / .pi
  }

  func setVisible(_ visible: Bool) throws {
    switch self {
    case let .mapPolygon(_, _, value): visible ? value.show() : value.hide(); case let .polygon(
      _,
      _,
      value
    ): visible ? value.show() : value.hide(); case let .mapPolyline(_, _, value): visible ? value
      .show() : value.hide(); case let .polyline(
      _,
      _,
      value
    ): visible ? value.show() : value.hide()
    }
  }

  func setPosition(_ position: MapPoint) throws {
    switch self { case let .polygon(_, _, value): value.position = position; case let .polyline(
      _,
      _,
      value
    ): value
      .position =
      position; default: throw shapeUnsupported(
        "iOS Kakao Maps cannot reposition geographic shapes."
      )
    }
  }

  func setOrientation(_ degrees: Double) throws {
    guard degrees.isFinite
    else { throw shapeInvalid("orientation must be finite.") }; switch self { case let .mapPolygon(
      _,
      _,
      value
    ): value.orientation = degrees * .pi / 180; case let .polygon(_, _, value): value
      .orientation = degrees * .pi / 180; case let .mapPolyline(
      _,
      _,
      value
    ): value.orientation = degrees * .pi / 180; case let .polyline(_, _, value): value
      .orientation = degrees * .pi / 180 }
  }
}

func mapStyleNativeID(_ prefix: String, _ spec: [String: Any]) -> String {
  let data = (try? JSONSerialization.data(withJSONObject: spec, options: [.sortedKeys])) ?? Data()
  return "\(prefix)-\(data.count)-\(UInt(bitPattern: data.hashValue))"
}

func mapShapeMapPolygon(_ part: [String: Any]) throws -> MapPolygon {
  let value = try MapPolygon(
    exteriorRing: part.coordinateList("outer"),
    holes: part.optionalCoordinateLists("holes"),
    styleIndex: UInt(part.nonnegativeInt("styleIndex", default: 0))
  )
  value.mergeOverlappedHoles = try part.bool("mergeOverlappedHoles", default: false)
  return value
}

func mapShapeModelPolygon(_ part: [String: Any]) throws -> Polygon {
  let value = try Polygon(
    exteriorRing: part.pointList("outer"),
    holes: part.optionalPointLists("holes"),
    styleIndex: UInt(part.nonnegativeInt("styleIndex", default: 0))
  )
  value.mergeOverlappedHoles = try part.bool("mergeOverlappedHoles", default: false)
  return value
}

private func mapPolyline(_ part: [String: Any]) throws -> MapPolyline {
  try MapPolyline(
    line: part.coordinateList("points"),
    styleIndex: UInt(part.nonnegativeInt("styleIndex", default: 0))
  )
}

private func modelPolyline(_ part: [String: Any]) throws -> Polyline {
  try Polyline(
    line: part.pointList("points"),
    styleIndex: UInt(part.nonnegativeInt("styleIndex", default: 0))
  )
}

private func coordinatePayload(_ points: [MapPoint]) -> [[String: Double]] {
  points.map { [
    "latitude": $0.wgsCoord.latitude,
    "longitude": $0.wgsCoord.longitude
  ] }
}

private func pointPayload(_ points: [CGPoint]) -> [[String: Double]] {
  points.map { [
    "x": Double($0.x),
    "y": Double($0.y)
  ] }
}

private func shapeArcPoints(_ geometry: [String: Any]) throws -> [CGPoint] {
  let radius = try geometry.positiveDouble("radius")
  let count = try geometry.minimumInt("pointCount", default: 64, minimum: 2)
  let startDegrees = try geometry.double("startAngle")
  let endDegrees = try geometry.double("endAngle")
  let clockwise = try geometry.bool("clockwise", default: true)
  let angles = shapeArcAngles(
    start: startDegrees,
    end: endDegrees,
    clockwise: clockwise
  )
  return (0 ..< count).map { index in
    let angle = angles.start + angles.sweep * Double(index) / Double(count - 1)
    return CGPoint(x: radius * sin(angle), y: radius * cos(angle))
  }
}

private func shapeArcAngles(
  start: Double,
  end: Double,
  clockwise: Bool
) -> (start: Double, sweep: Double) {
  let normalizedStart = shapeNormalizedDegrees(start)
  let normalizedEnd = shapeNormalizedDegrees(end)
  let delta = normalizedEnd - normalizedStart
  let sweep: Double = if delta == 0 {
    start == end ? 0 : (clockwise ? 360 : -360)
  } else if clockwise {
    delta > 0 ? delta : delta + 360
  } else {
    delta < 0 ? delta : delta - 360
  }
  return (normalizedStart * .pi / 180, sweep * .pi / 180)
}

private func shapeNormalizedDegrees(_ value: Double) -> Double {
  let remainder = value.truncatingRemainder(dividingBy: 360)
  return remainder < 0 ? remainder + 360 : remainder
}

private func shapeOffset(_ center: MapPoint, east: Double, north: Double) -> MapPoint {
  let distance = sqrt(east * east + north * north)
  let bearing = atan2(east, north)
  let coordinate = center.wgsCoord
  let latitude = coordinate.latitude * .pi / 180
  let longitude = coordinate.longitude * .pi / 180
  let angular = distance / shapeEarthRadius
  let targetLatitude =
    asin(sin(latitude) * cos(angular) + cos(latitude) * sin(angular) * cos(bearing))
  let targetLongitude = longitude + atan2(
    sin(bearing) * sin(angular) * cos(latitude),
    cos(angular) - sin(latitude) * sin(targetLatitude)
  )
  return MapPoint(longitude: targetLongitude * 180 / .pi, latitude: targetLatitude * 180 / .pi)
}

private func validateShapeGeometry(_ geometry: [String: Any], styleCount: Int) throws {
  let type = try geometry.string("type")
  guard ["geographicPolygon", "modelPolygon", "geographicPolyline", "modelPolyline"].contains(type)
  else { return }
  let parts = try geometry.objectList("parts")
  guard !parts.isEmpty else { throw shapeInvalid("Shape geometry requires parts.") }
  for part in parts {
    let index = try part.nonnegativeInt("styleIndex", default: 0)
    guard index < styleCount else { throw shapeInvalid("Shape styleIndex is out of range.") }
    let count = try (type.contains("Polygon") ? part.anyList("outer") : part.anyList("points"))
      .count
    let minimum = type.contains("Polygon") ? 3 : 2
    guard count >= minimum
    else { throw shapeInvalid("Shape part requires at least \(minimum) points.") }
    if type == "geographicPolygon" {
      for hole in try part.optionalCoordinateLists("holes") ?? [] {
        guard hole.count >= 3
        else { throw shapeInvalid("Shape polygon holes require at least 3 points.") }
      }
    } else if type == "modelPolygon" {
      for hole in try part.optionalPointLists("holes") ?? [] {
        guard hole.count >= 3
        else { throw shapeInvalid("Shape polygon holes require at least 3 points.") }
      }
    }
  }
  switch type {
  case "geographicPolygon":
    _ = try parts.map(mapShapeMapPolygon)
  case "modelPolygon":
    _ = try geometry.coordinate("base")
    _ = try geometry.double("orientation", default: 0)
    _ = try parts.map(mapShapeModelPolygon)
  case "geographicPolyline":
    _ = try parts.map(mapPolyline)
  case "modelPolyline":
    _ = try geometry.coordinate("base")
    _ = try geometry.double("orientation", default: 0)
    _ = try parts.map(modelPolyline)
  default:
    break
  }
}

private func shapeLayerPass(_ value: String) throws
  -> ShapeLayerPassType
{
  switch value {
  case "default": .default; case "overlay": .overlay; case "route": .route; default: throw shapeInvalid(
      "Unknown shape layer pass \(value)."
    )
  }
}

private func polylineCap(_ value: String) throws
  -> PolylineCapType
{
  switch value {
  case "butt": .butt; case "round": .round; case "square": .square; default: throw shapeInvalid(
      "Unknown polyline cap \(value)."
    )
  }
}

private func shapeInterpolation(
  duration: Int,
  method value: String
) throws -> AnimationInterpolation {
  let method: InterpolationMethodType
  switch value {
  case "linear": method = .linear
  case "cubicIn": method = .cubicIn
  case "cubicOut": method = .cubicOut
  case "cubicInOut": method = .cubicInOut
  default: throw shapeInvalid("Unknown interpolation \(value).")
  }
  return AnimationInterpolation(duration: UInt32(duration), method: method)
}

func mapShapePolygonStyleSet(_ spec: [String: Any]) throws -> PolygonStyleSet {
  try PolygonStyleSet(
    styleSetID: spec.string("id"),
    styles: spec.objectList("styles").map { style in
      let levels = try style.objectList("levels")
      guard !levels.isEmpty else { throw shapeInvalid("Polygon styles require levels.") }
      return try PolygonStyle(styles: levels.map { level in
        try PerLevelPolygonStyle(
          color: level.color("fillColor"),
          strokeWidth: shapePixelUInt(level.nonnegativeInt("strokeWidth", default: 0)),
          strokeColor: level.color("strokeColor", default: .clear),
          level: level.int("level")
        )
      })
    }
  )
}

func mapShapeWaveEffect(_ animation: [String: Any]) throws -> WaveAnimationEffect {
  let frames = try animation.objectList("frames")
  guard !frames.isEmpty else { throw shapeInvalid("Shape wave animation requires frames.") }
  let effect = try WaveAnimationEffect(datas: frames.map { frame in
    try WaveAnimationData(
      startAlpha: Float(frame.unitDouble("startAlpha")),
      endAlpha: Float(frame.unitDouble("endAlpha")),
      startRadius: shapePixelFloat(frame.nonnegativeDouble("startRadius")),
      endRadius: shapePixelFloat(frame.nonnegativeDouble("endRadius")),
      level: frame.int("level")
    )
  })
  effect.interpolation = try shapeInterpolation(
    duration: animation.minimumInt("duration", minimum: 1),
    method: animation.optionalString("interpolation") ?? "linear"
  )
  effect.playCount = try UInt(animation.minimumInt("repeat", default: 1, minimum: 1))
  effect.hideAtStop = try animation.bool("hideAtStop", default: false)
  return effect
}

private func requireUniqueShape(_ values: [[String: Any]], noun: String) throws {
  let ids = try values.map { try $0.string("id") }; guard Set(ids).count == ids.count
  else { throw shapeInvalid("Duplicate \(noun) ID.") }
  guard !ids.contains(where: \.isEmpty)
  else { throw shapeInvalid("\(noun) ID must not be empty.") }
}

private let defaultShapeLayerZIndex = 10000

private func shapeInvalid(_ message: String) -> KakaoMapException {
  KakaoMapException(
    "ERR_KAKAO_MAP_SHAPE_INVALID_ARGUMENT",
    message
  )
}

private func shapeUnsupported(_ message: String) -> KakaoMapException {
  KakaoMapException(
    "ERR_KAKAO_MAP_SHAPE_UNSUPPORTED",
    message
  )
}

private func shapeNotFound(_ noun: String, id: String) -> KakaoMapException {
  KakaoMapException(
    "ERR_KAKAO_MAP_SHAPE_NOT_FOUND",
    "Unknown \(noun) \(id)."
  )
}

private extension [String: Any] {
  func object(_ key: String) throws
    -> [String: Any]
  {
    guard let value = self[key] as? [String: Any]
    else { throw shapeInvalid("\(key) must be an object.") }; return value
  }

  func objectList(_ key: String) throws -> [[String: Any]] {
    guard let raw = self[key]
    else { return [] }; guard let value = raw as? [[String: Any]]
    else { throw shapeInvalid("\(key) must be an array of objects.") }; return value
  }

  func anyList(_ key: String) throws -> [Any] {
    guard let value = self[key] as? [Any]
    else { throw shapeInvalid("\(key) must be an array.") }; return value
  }

  func string(_ key: String) throws -> String {
    guard let value = self[key] as? String
    else { throw shapeInvalid("\(key) must be a string.") }; return value
  }

  func optionalString(_ key: String) throws -> String? {
    guard let raw = self[key] else { return nil }
    guard let value = raw as? String
    else { throw shapeInvalid("\(key) must be a string.") }
    return value
  }

  func stringList(_ key: String) throws -> [String] {
    guard let value = self[key] as? [String]
    else { throw shapeInvalid("\(key) must be an array of strings.") }; return value
  }

  func bool(
    _ key: String,
    default fallback: Bool? = nil
  ) throws
    -> Bool
  {
    guard let raw = self[key] else {
      guard let fallback else { throw shapeInvalid("\(key) must be a boolean.") }
      return fallback
    }
    guard CFGetTypeID(raw as CFTypeRef) == CFBooleanGetTypeID(),
          let value = raw as? Bool
    else { throw shapeInvalid("\(key) must be a boolean.") }
    return value
  }

  func double(
    _ key: String,
    default fallback: Double? = nil
  ) throws -> Double {
    guard let raw = self[key] else {
      guard let fallback else { throw shapeInvalid("\(key) must be finite.") }
      return fallback
    }
    guard let value = raw as? NSNumber,
          CFGetTypeID(value) != CFBooleanGetTypeID(),
          value.doubleValue.isFinite
    else { throw shapeInvalid("\(key) must be finite.") }
    return value.doubleValue
  }

  func int(_ key: String, default fallback: Int? = nil) throws -> Int {
    let value = try double(
      key,
      default: fallback.map(Double.init)
    ); guard let integer = Int(exactly: value)
    else { throw shapeInvalid("\(key) must be an integer.") }; return integer
  }

  func nonnegativeInt(
    _ key: String,
    default fallback: Int? = nil
  ) throws -> Int {
    let value = try int(
      key,
      default: fallback
    ); guard value >= 0 else { throw shapeInvalid("\(key) must be non-negative.") }; return value
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
    else { throw shapeInvalid("\(key) must be at least \(minimum).") }; return value
  }

  func positiveDouble(_ key: String) throws -> Double {
    let value = try double(key); guard value >
      0 else { throw shapeInvalid("\(key) must be positive.") }; return value
  }

  func nonnegativeDouble(_ key: String) throws -> Double {
    let value = try double(
      key
    ); guard value >=
      0 else { throw shapeInvalid("\(key) must be non-negative.") }; return value
  }

  func unitDouble(_ key: String) throws -> Double {
    let value = try double(key); guard (0 ... 1)
      .contains(value) else { throw shapeInvalid("\(key) must be between 0 and 1.") }; return value
  }

  func color(
    _ key: String,
    default fallback: UIColor? = nil
  ) throws
    -> UIColor
  {
    guard let raw = self[key] else {
      guard let fallback else { throw shapeInvalid("\(key) must be a color.") }
      return fallback
    }
    guard let value = raw as? String
    else { throw shapeInvalid("\(key) must be a color.") }
    return try parseShapeColor(value)
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
    else { throw shapeInvalid("Invalid coordinate.") }; return MapPoint(
      longitude: longitude,
      latitude: latitude
    )
  }

  func coordinateList(_ key: String) throws -> [MapPoint] {
    try anyList(key)
      .map {
        guard let value = $0 as? [String: Any]
        else { throw shapeInvalid("Coordinate must be an object.") }; return try value
          .coordinateValue()
      }
  }

  func optionalCoordinateLists(_ key: String) throws -> [[MapPoint]]? {
    guard let raw = self[key]
    else { return nil }; guard let values = raw as? [[Any]]
    else { throw shapeInvalid("\(key) must be an array of arrays.") }; return try values
      .map {
        try $0
          .map {
            guard let value = $0 as? [String: Any]
            else { throw shapeInvalid("Coordinate must be an object.") }; return try value
              .coordinateValue()
          }
      }
  }

  func pointList(_ key: String) throws -> [CGPoint] {
    try anyList(key)
      .map {
        guard let value = $0 as? [String: Any]
        else { throw shapeInvalid("Point must be an object.") }
        return try shapeModelMetersToSDKPoint(
          x: value.double("x"),
          y: value.double("y")
        )
      }
  }

  func optionalPointLists(_ key: String) throws -> [[CGPoint]]? {
    guard let raw = self[key]
    else { return nil }; guard let values = raw as? [[Any]]
    else { throw shapeInvalid("\(key) must be an array of arrays.") }; return try values
      .map {
        try $0
          .map {
            guard let value = $0 as? [String: Any]
            else { throw shapeInvalid("Point must be an object.") }
            return try shapeModelMetersToSDKPoint(
              x: value.double("x"),
              y: value.double("y")
            )
          }
      }
  }
}

private let shapeEarthRadius = 6378137.0
private let shapeModelDegreesPerMeter = 180 / (.pi * shapeEarthRadius)
private let shapeModelPointConversionMessage = "Model point conversion must be finite."

private func shapeModelMetersToSDKPoint(x: Double, y: Double) throws -> CGPoint {
  let sdkX = x * shapeModelDegreesPerMeter
  let sdkY = y * shapeModelDegreesPerMeter
  guard sdkX.isFinite, sdkY.isFinite else {
    throw shapeInvalid(shapeModelPointConversionMessage)
  }
  return CGPoint(x: sdkX, y: sdkY)
}

private func shapeSDKModelPointToMeters(_ point: CGPoint) throws -> CGPoint {
  let x = Double(point.x) / shapeModelDegreesPerMeter
  let y = Double(point.y) / shapeModelDegreesPerMeter
  guard x.isFinite, y.isFinite else {
    throw shapeInvalid(shapeModelPointConversionMessage)
  }
  return CGPoint(x: x, y: y)
}

private func shapePixels(_ points: Double) throws -> Double {
  let pixels = MapUnits.pixels(points)
  guard pixels.isFinite else { throw shapeInvalid("Pixel dimensions must be finite.") }
  return pixels
}

private func shapePixelUInt(_ points: Int) throws -> UInt {
  let pixels = try shapePixels(Double(points)).rounded()
  guard let integer = UInt(exactly: pixels)
  else { throw shapeInvalid("Pixel dimensions are out of range.") }
  return integer
}

private func shapePixelFloat(_ points: Double) throws -> Float {
  let pixels = try shapePixels(points)
  guard abs(pixels) <= Double(Float.greatestFiniteMagnitude)
  else { throw shapeInvalid("Pixel dimensions are out of range.") }
  return Float(pixels)
}

private func parseShapeColor(_ value: String) throws -> UIColor {
  guard value.range(of: "^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$", options: .regularExpression) != nil
  else { throw shapeInvalid("Colors must be #RRGGBB or #RRGGBBAA.") }
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
