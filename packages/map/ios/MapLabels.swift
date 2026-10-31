import ExpoModulesCore
import KakaoMapsSDK
import UIKit

let labelInvalidArgument = "ERR_KAKAO_MAP_LABEL_INVALID_ARGUMENT"
let labelNotFound = "ERR_KAKAO_MAP_LABEL_NOT_FOUND"
let labelUnsupported = "ERR_KAKAO_MAP_LABEL_UNSUPPORTED"
let labelApplyCancelled = "ERR_KAKAO_MAP_LABEL_APPLY_CANCELLED"
private let defaultLabelLayerZOrder = 1000

struct MapLabelPoint: Record {
  @Field var latitude: Double = .nan
  @Field var longitude: Double = .nan
}

struct MapLabelVector: Record {
  @Field var x: Double = .nan
  @Field var y: Double = .nan
}

struct MapLabelImage: Record {
  @Field var uri = ""
  @Field var width: Double?
  @Field var height: Double?
}

struct MapLabelTextStyleRecord: Record {
  @Field var fontFamily: String?
  @Field var fontSize: Double = .nan
  @Field var color = ""
  @Field var strokeColor: String?
  @Field var strokeWidth = 0.0
  @Field var characterSpacing = 0.0
  @Field var lineSpacing = 1.0
  @Field var aspectRatio = 1.0
}

struct MapLabelTransitionRecord: Record {
  @Field var entrance = "none"
  @Field var exit = "none"
  @Field var enableEntrance = true
  @Field var enableExit = true
}

struct MapLabelBadgeStyleRecord: Record {
  @Field var id = ""
  @Field var image = MapLabelImage()
  @Field var offset: MapLabelVector?
  @Field var zOrder = 0
}

struct MapLabelPerLevelStyleRecord: Record {
  @Field var level = 0
  @Field var image: MapLabelImage?
  @Field var anchor: MapLabelVector?
  @Field var padding = 0.0
  @Field var iconTransition: MapLabelTransitionRecord?
  @Field var textTransition: MapLabelTransitionRecord?
  @Field var textLayout = "center"
  @Field var textLines: [MapLabelTextStyleRecord] = []
  @Field var badges: [MapLabelBadgeStyleRecord] = []
}

struct MapLabelStyleRecord: Record {
  @Field var id = ""
  @Field var levels: [MapLabelPerLevelStyleRecord] = []
}

struct MapPathTextLevelStyleRecord: Record {
  @Field var level = 0
  @Field var text = MapLabelTextStyleRecord()
}

struct MapPathTextStyleRecord: Record {
  @Field var id = ""
  @Field var levels: [MapPathTextLevelStyleRecord] = []
}

struct MapLabelLayerRecord: Record {
  @Field var id = ""
  @Field var visible = true
  @Field var clickable = true
  @Field var zOrder = defaultLabelLayerZOrder
  @Field var competition = "none"
  @Field var competitionUnit = "iconAndText"
  @Field var ordering = "rank"
  @Field var competitionExceptions: [String] = []
}

struct MapLodLabelLayerRecord: Record {
  @Field var id = ""
  @Field var visible = true
  @Field var clickable = true
  @Field var zOrder = defaultLabelLayerZOrder
  @Field var competition = "none"
  @Field var competitionUnit = "iconAndText"
  @Field var ordering = "rank"
  @Field var competitionExceptions: [String] = []
  @Field var radius = 20.0
}

struct MapLabelTextRecord: Record {
  @Field var value = ""
  @Field var styleIndex = 0
}

struct MapLabelBadgeRecord: Record {
  @Field var id = ""
  @Field var image = MapLabelImage()
  @Field var offset: MapLabelVector?
  @Field var zOrder = 0
  @Field var visible = true
}

struct MapLabelRecord: Record {
  @Field var id = ""
  @Field var layerId = ""
  @Field var styleId = ""
  @Field var coordinate = MapLabelPoint()
  @Field var text: [MapLabelTextRecord] = []
  @Field var rank = 0.0
  @Field var clickable = false
  @Field var visible = true
  @Field var transform = "default"
  @Field var pixelOffset: MapLabelVector?
  @Field var orientation = 0.0
  @Field var scale: MapLabelVector?
  @Field var badges: [MapLabelBadgeRecord] = []
}

struct MapLodLabelRecord: Record {
  @Field var id = ""
  @Field var layerId = ""
  @Field var styleId = ""
  @Field var coordinate = MapLabelPoint()
  @Field var text: [MapLabelTextRecord] = []
  @Field var rank = 0.0
  @Field var clickable = false
  @Field var visible = true
  @Field var transform = "default"
  @Field var badges: [MapLabelBadgeRecord] = []
}

struct MapPathLabelRecord: Record {
  @Field var id = ""
  @Field var layerId = ""
  @Field var styleId = ""
  @Field var points: [MapLabelPoint] = []
  @Field var text = ""
  @Field var rank = 0.0
  @Field var visible = true
}

struct MapLabelAnimationKeyframeRecord: Record {
  @Field var duration = 0.0
  @Field var interpolation = "linear"
  @Field var alpha: Double?
  @Field var scale: MapLabelVector?
  @Field var translation: MapLabelVector?
  @Field var rotation: Double?
}

struct MapLabelAnimationRecord: Record {
  @Field var id = ""
  @Field var labelIds: [String] = []
  @Field var effect = ""
  @Field var keyframes: [MapLabelAnimationKeyframeRecord] = []
  @Field var repeatCount = 1
  @Field var hideAtStop = false
  @Field var removeAtStop = false
  @Field var resetToInitialState = false
}

struct MapLabelSceneRecord: Record {
  @Field var styles: [MapLabelStyleRecord] = []
  @Field var pathTextStyles: [MapPathTextStyleRecord] = []
  @Field var layers: [MapLabelLayerRecord] = []
  @Field var lodLayers: [MapLodLabelLayerRecord] = []
  @Field var labels: [MapLabelRecord] = []
  @Field var lodLabels: [MapLodLabelRecord] = []
  @Field var pathLabels: [MapPathLabelRecord] = []
  @Field var animations: [MapLabelAnimationRecord] = []
}

struct MapLabelCommandRecord: Record {
  @Field var type = ""
  @Field var id: String?
  @Field var sourceId: String?
  @Field var targetId: String?
  @Field var badgeId: String?
  @Field var style = false
  @Field var visible: Bool?
  @Field var enabled: Bool?
  @Field var coordinate: MapLabelPoint?
  @Field var points: [MapLabelPoint] = []
  @Field var duration: Double?
  @Field var cornerRadius = 0.0
  @Field var jumpThreshold = 0.0
  @Field var rotate = false
  @Field var autoMove = false
  @Field var baseRotation = 0.0
  @Field var rotation: Double?
  @Field var scale: MapLabelVector?
}

final class MapLabels {
  private struct ActiveAnimationRun {
    let nativeID: String
    let epoch: Int
    let definition: MapLabelAnimationRecord
  }

  private let map: KakaoMap
  private let nativeNamespace = UUID().uuidString
    .replacingOccurrences(of: "-", with: "").lowercased()
  private let manager: LabelManager
  private let trackingManager: TrackingManager
  private let imageLoader: MapImageLoader
  private let emitClick: ([String: Any]) -> Void
  private let emitAnimationStopped: ([String: Any]) -> Void
  private var labels: [String: Poi] = [:]
  private var labelsWithReleasedSharing: Set<String> = []
  private var lodLabels: [String: LodPoi] = [:]
  private var coordinates: [String: MapLabelPoint] = [:]
  private var pathLabels: [String: WaveText] = [:]
  private var labelLayers: [String: KakaoMapsSDK.LabelLayer] = [:]
  private var lodLabelLayers: [String: KakaoMapsSDK.LodLabelLayer] = [:]
  private var publicLayerIDsByNative: [String: String] = [:]
  private var eventHandlers: [DisposableEventHandler] = []
  private var styleIds: Set<String> = []
  private var waveTextStyleFingerprints: [String: String] = [:]
  private var nativeWaveTextStyleIDs: [String: String] = [:]
  private var nextNativeObjectID = 0
  private var animationDefinitions: [String: MapLabelAnimationRecord] = [:]
  private var activeAnimationRuns: [String: ActiveAnimationRun] = [:]
  private var nextAnimationEpoch = 0
  private var imageRequests: [MapImageLoadToken] = []
  private var pendingApplyCompletion: ((Result<Void, Error>) -> Void)?
  private var generation = 0
  private var isDisposed = false

  init(
    map: KakaoMap,
    imageLoader: MapImageLoader,
    emitClick: @escaping ([String: Any]) -> Void,
    emitAnimationStopped: @escaping ([String: Any]) -> Void
  ) {
    self.map = map
    manager = map.getLabelManager()
    trackingManager = map.getTrackingManager()
    self.imageLoader = imageLoader
    self.emitClick = emitClick
    self.emitAnimationStopped = emitAnimationStopped
  }

  func apply(
    _ scene: MapLabelSceneRecord,
    completion: @escaping (Result<Void, Error>) -> Void
  ) throws {
    try requireActive()
    try validate(scene)
    cancelPendingApply("A newer label scene replaced this apply operation.")
    pendingApplyCompletion = completion
    generation += 1
    let currentGeneration = generation
    cancelImageRequests()
    loadImages(scene.imageUris, generation: currentGeneration) { [weak self] result in
      guard let self, !isDisposed, currentGeneration == generation else { return }
      do {
        let images = try result.get()
        try rebuild(scene, images: images)
        finishApply(.success(()))
      } catch {
        finishApply(.failure(error))
      }
    }
  }

  func command(_ command: MapLabelCommandRecord) throws {
    try requireActive()
    let duration = try (command.duration ?? 0).duration()
    switch command.type {
    case "show":
      let visible = try command.visible.required("visible")
      guard duration == 0 else {
        throw labelError(labelUnsupported, "iOS label auto-move does not expose a duration.")
      }
      try show(command.requiredID(), visible: visible, autoMove: command.autoMove)
    case "move":
      let id = try command.requiredID()
      let poi = try label(id)
      let point = try command.coordinate.required("coordinate").mapPoint
      if duration == 0 {
        poi.position = point
      } else if labelsWithReleasedSharing.contains(id) {
        // Kakao Maps 2.12.19 ignores moveAt on former sharing followers.
        poi.moveOnPath(
          [poi.position, point],
          duration: UInt(duration),
          cornerRadius: 0,
          jumpThreshold: 0
        )
      } else {
        poi.moveAt(point, duration: UInt(duration))
      }
    case "movePath":
      _ = try command.duration.required("duration")
      guard command.points.count >= 2 else {
        throw labelError(labelInvalidArgument, "movePath requires at least two points.")
      }
      let points = try command.points.map { try $0.mapPoint }
      guard points.count >= 2 else { throw labelError(
        labelInvalidArgument,
        "A path needs at least two points."
      ) }
      guard command.cornerRadius >= 0, command.jumpThreshold >= 0 else {
        throw labelError(
          labelInvalidArgument,
          "cornerRadius and jumpThreshold must be non-negative."
        )
      }
      let poi = try label(command.requiredID())
      if command.rotate {
        try poi.moveAndRotateOnPath(
          points,
          baseRadian: command.baseRotation.finiteFloat("baseRotation") * .pi / 180,
          duration: UInt(duration),
          cornerRadius: command.cornerRadius.finiteFloat("cornerRadius"),
          jumpThreshold: command.jumpThreshold.finiteFloat("jumpThreshold")
        )
      } else {
        try poi.moveOnPath(
          points,
          duration: UInt(duration),
          cornerRadius: command.cornerRadius.finiteFloat("cornerRadius"),
          jumpThreshold: command.jumpThreshold.finiteFloat("jumpThreshold")
        )
      }
    case "rotate":
      let poi = try label(command.requiredID())
      let rotation = try Double(command.rotation.required("rotation").finiteFloat("rotation")) *
        .pi / 180
      if duration == 0 {
        poi.orientation = rotation
      } else {
        poi.rotateAt(rotation, duration: UInt(duration))
      }
    case "scale":
      let scale = try command.scale.required("scale")
      try scale.validateScale()
      throw labelError(
        labelUnsupported,
        "The iOS Kakao Maps SDK has no direct POI scale command; use a scale animation."
      )
    case "sharePosition":
      try share(command, transform: false)
    case "shareTransform":
      try share(command, transform: true)
    case "setBadgeVisibility":
      try setBadgeVisibility(command)
    case "startAnimation":
      let id = try command.requiredID()
      try startAnimation(id)
    case "stopAnimation":
      let id = try command.requiredID()
      guard animationDefinitions[id] != nil else {
        throw labelError(labelNotFound, "Animation not found: \(id)")
      }
      if let run = activeAnimationRuns[id] {
        finishAnimationRun(id: id, run: run, finished: false, stopNative: true)
      }
    case "startTracking":
      try trackingManager.startTrackingPoi(label(command.requiredID()))
      trackingManager.isTrackingRoll = command.rotate
    case "stopTracking":
      trackingManager.stopTracking()
    default:
      throw labelError(labelInvalidArgument, "Unknown label command: \(command.type)")
    }
  }

  func capabilities() -> [String: Any] {
    [
      "pathText": "waveText",
      "pathTextRank": true,
      "pathTextStyleAddition": true,
      "pathTextStyleDefinitionUpdate": false,
      "pathTextStyleRegistrationRemoval": false,
      "lodPositionMutation": false,
      "lodAutoMove": true,
      "autoMoveDuration": false,
      "labelScaleCommand": false,
      "competitionExceptions": false,
      "supportedTransforms": [
        "absoluteRotation", "default", "absoluteRotationKeepUpright",
        "absoluteRotationDecal", "decal"
      ],
      "keyframeRepeatCount": false,
      "trackingStateSource": "native",
      "remoteImages": true
    ]
  }

  func state() -> [String: Any] {
    guard !isDisposed else {
      return [
        "labels": [],
        "animationIds": [],
        "tracking": ["active": false, "source": "native"]
      ]
    }
    var entries: [[String: Any]] = []
    let liveLabelIDs = Set(labels.compactMap { id, cached -> String? in
      guard let native = labelLayers[cached.layerID]?.getPoi(poiID: id) else { return nil }
      let position = native.position.wgsCoord
      entries.append([
        "id": id,
        "kind": "label",
        "visible": native.isShow,
        "coordinate": [
          "latitude": position.latitude,
          "longitude": position.longitude
        ]
      ])
      return id
    })
    let liveLodLabelIDs = Set(lodLabels.compactMap { id, cached -> String? in
      guard let native = lodLabelLayers[cached.layerID]?.getLodPoi(poiID: id) else { return nil }
      entries.append(["id": id, "kind": "lodLabel", "visible": native.isShow])
      return id
    })
    let livePathLabelIDs = Set(pathLabels.compactMap { id, cached -> String? in
      guard let native = labelLayers[cached.layerID]?.getWaveText(waveTextID: id)
      else { return nil }
      entries.append(["id": id, "kind": "pathLabel", "visible": native.isShow])
      return id
    })
    labels = labels.filter { liveLabelIDs.contains($0.key) }
    lodLabels = lodLabels.filter { liveLodLabelIDs.contains($0.key) }
    pathLabels = pathLabels.filter { livePathLabelIDs.contains($0.key) }
    coordinates = coordinates
      .filter { liveLabelIDs.contains($0.key) || liveLodLabelIDs.contains($0.key) }
    return [
      "labels": entries.sorted { ($0["id"] as? String ?? "") < ($1["id"] as? String ?? "") },
      "animationIds": animationDefinitions.keys.sorted(),
      "tracking": ["active": trackingManager.isTracking, "source": "native"]
    ]
  }

  func handlesPoiTap(layerId: String, id: String) -> Bool {
    guard !isDisposed, let cached = labels[id], cached.layerID == layerId else { return false }
    return labelLayers[layerId]?.getPoi(poiID: id) != nil
  }

  func dispose() {
    guard !isDisposed else { return }
    isDisposed = true
    generation += 1
    clearAnimationRuns()
    cancelImageRequests()
    cancelPendingApply("The map view was destroyed.")
    trackingManager.stopTracking()
    clearHandlers()
    clearLayersAndStyles()
    labels.removeAll()
    lodLabels.removeAll()
    coordinates.removeAll()
    pathLabels.removeAll()
    labelLayers.removeAll()
    lodLabelLayers.removeAll()
    publicLayerIDsByNative.removeAll()
    animationDefinitions.removeAll()
    waveTextStyleFingerprints.removeAll()
    nativeWaveTextStyleIDs.removeAll()
  }

  private func rebuild(_ scene: MapLabelSceneRecord, images: [String: UIImage]) throws {
    let nativePoiStyles = try scene.styles.map { style in
      let nativeID = makeNativeID("poi_style")
      return try (publicID: style.id, native: style.native(images, styleID: nativeID))
    }
    var nextWaveTextStyleFingerprints = waveTextStyleFingerprints
    var nativeWaveTextStyles: [WaveTextStyle] = []
    for style in scene.pathTextStyles {
      let fingerprint = style.fingerprint
      if let registered = waveTextStyleFingerprints[style.id] {
        guard registered == fingerprint else {
          throw labelError(
            labelUnsupported,
            "iOS Kakao Maps SDK cannot replace the registered WaveText style: \(style.id)"
          )
        }
      } else {
        let nativeID = makeNativeID("wave_style")
        nativeWaveTextStyleIDs[style.id] = nativeID
        try nativeWaveTextStyles.append(style.native(styleID: nativeID))
        nextWaveTextStyleFingerprints[style.id] = fingerprint
      }
    }
    let labelLayerOptions = try scene.layers.map { layer in
      try layer.options(layerID: makeNativeID("layer"))
    }
    let lodLabelLayerOptions = try scene.lodLayers.map { layer in
      try layer.options(layerID: makeNativeID("lod_layer"))
    }
    clearAnimationRuns()
    trackingManager.stopTracking()
    clearHandlers()
    clearLayersAndStyles()
    labels.removeAll()
    lodLabels.removeAll()
    coordinates.removeAll()
    pathLabels.removeAll()
    labelLayers.removeAll()
    lodLabelLayers.removeAll()
    publicLayerIDsByNative.removeAll()
    animationDefinitions.removeAll()

    var poiStyleIDs: [String: String] = [:]
    for style in nativePoiStyles {
      manager.addPoiStyle(style.native)
      styleIds.insert(style.native.styleID)
      poiStyleIDs[style.publicID] = style.native.styleID
    }
    for style in nativeWaveTextStyles {
      manager.addWaveTextStyle(style)
    }
    waveTextStyleFingerprints = nextWaveTextStyleFingerprints

    var layers: [String: LabelLayer] = [:]
    for (layer, options) in zip(scene.layers, labelLayerOptions) {
      guard let native = manager.addLabelLayer(option: options) else {
        throw labelError(labelInvalidArgument, "Could not create label layer \(layer.id).")
      }
      native.visible = layer.visible
      native.setClickable(layer.clickable)
      layers[layer.id] = native
      labelLayers[native.layerID] = native
      publicLayerIDsByNative[native.layerID] = layer.id
    }
    var lodLayers: [String: LodLabelLayer] = [:]
    for (layer, options) in zip(scene.lodLayers, lodLabelLayerOptions) {
      guard let native = manager.addLodLabelLayer(option: options) else {
        throw labelError(labelInvalidArgument, "Could not create LOD label layer \(layer.id).")
      }
      native.visible = layer.visible
      native.setClickable(layer.clickable)
      lodLayers[layer.id] = native
      lodLabelLayers[native.layerID] = native
      publicLayerIDsByNative[native.layerID] = layer.id
    }

    for item in scene.labels {
      guard let layer = layers[item.layerId] else { throw notFound("layer", item.layerId) }
      guard let styleID = poiStyleIDs[item.styleId] else { throw notFound("style", item.styleId) }
      let option = try item.options(styleID: styleID)
      guard let poi = try layer.addPoi(option: option, at: item.coordinate.mapPoint) else {
        throw labelError(labelInvalidArgument, "Could not create label \(item.id).")
      }
      poi.pixelOffset = try item.pixelOffset?.pixelPoint ?? .zero
      poi.orientation = item.orientation * .pi / 180
      for badge in item.badges {
        let native = try badge.native(images)
        poi.addBadge(native)
        if !badge.visible {
          poi.hideBadge(badgeID: badge.id)
        }
      }
      item.visible ? poi.show() : poi.hide()
      eventHandlers.append(poi.addPoiTappedEventHandler(target: self) { target in
        { param in target.emit(param.poiItem, kind: "label") }
      })
      labels[item.id] = poi
      coordinates[item.id] = item.coordinate
    }
    for item in scene.lodLabels {
      guard let layer = lodLayers[item.layerId] else { throw notFound("LOD layer", item.layerId) }
      guard let styleID = poiStyleIDs[item.styleId] else { throw notFound("style", item.styleId) }
      let option = try item.options(styleID: styleID)
      guard let poi = try layer.addLodPoi(option: option, at: item.coordinate.mapPoint)
      else {
        throw labelError(labelInvalidArgument, "Could not create LOD label \(item.id).")
      }
      for badge in item.badges {
        let native = try badge.native(images)
        poi.addBadge(native)
        if !badge.visible {
          poi.hideBadge(badgeID: badge.id)
        }
      }
      item.visible ? poi.show() : poi.hide()
      eventHandlers.append(poi.addPoiTappedEventHandler(target: self) { target in
        { param in target.emit(param.poiItem, kind: "lodLabel") }
      })
      lodLabels[item.id] = poi
      coordinates[item.id] = item.coordinate
    }
    for item in scene.pathLabels {
      guard let layer = layers[item.layerId] else { throw notFound("layer", item.layerId) }
      guard let styleID = nativeWaveTextStyleIDs[item.styleId] else {
        throw notFound("path text style", item.styleId)
      }
      let option = WaveTextOptions(styleID: styleID, waveTextID: item.id)
      option.points = try item.points.map { try $0.mapPoint }
      option.text = item.text
      option.rank = try UInt(item.rank.nonnegativeInteger("rank"))
      guard let text = layer.addWaveText(option) else {
        throw labelError(labelInvalidArgument, "Could not create path label \(item.id).")
      }
      item.visible ? text.show() : text.hide()
      pathLabels[item.id] = text
    }
    for animation in scene.animations {
      try addAnimation(animation)
    }
  }

  private func addAnimation(_ animation: MapLabelAnimationRecord) throws {
    animationDefinitions[animation.id] = animation
  }

  private func startAnimation(_ id: String) throws {
    guard var definition = animationDefinitions[id] else {
      throw labelError(labelNotFound, "Animation not found: \(id)")
    }
    if let run = activeAnimationRuns[id] {
      finishAnimationRun(id: id, run: run, finished: false, stopNative: true)
      guard let currentDefinition = animationDefinitions[id] else {
        throw labelError(labelNotFound, "Animation not found: \(id)")
      }
      definition = currentDefinition
    }
    let targets = try definition.labelIds.map(label)
    nextAnimationEpoch += 1
    let epoch = nextAnimationEpoch
    let nativeID = makeNativeID("animation")
    let effect = try definition.effectObject()
    guard let animator = manager.addPoiAnimator(
      animatorID: nativeID,
      effect: effect
    ) else {
      throw labelError(labelInvalidArgument, "Could not create animation \(id).")
    }
    do {
      try animator.addPois(targets)
    } catch {
      manager.removePoiAnimator(animatorID: nativeID)
      throw error
    }
    let run = ActiveAnimationRun(nativeID: nativeID, epoch: epoch, definition: definition)
    activeAnimationRuns[id] = run
    animator.setStopCallback { [weak self] _ in
      guard let self, !isDisposed, let active = activeAnimationRuns[id],
            active.nativeID == nativeID, active.epoch == epoch
      else { return }
      finishAnimationRun(id: id, run: active, finished: true, stopNative: false)
    }
    animator.start()
  }

  private func finishAnimationRun(
    id: String,
    run: ActiveAnimationRun,
    finished: Bool,
    stopNative: Bool
  ) {
    guard let active = activeAnimationRuns[id], active.nativeID == run.nativeID,
          active.epoch == run.epoch
    else { return }
    activeAnimationRuns.removeValue(forKey: id)
    if stopNative {
      manager.getPoiAnimator(animatorID: run.nativeID)?.stop()
    }
    manager.removePoiAnimator(animatorID: run.nativeID)
    if run.definition.removeAtStop {
      removeAnimationTargets(run.definition.labelIds)
    }
    emitAnimationStopped(["id": id, "finished": finished])
  }

  private func clearAnimationRuns() {
    let runs = Array(activeAnimationRuns.values)
    activeAnimationRuns.removeAll()
    for run in runs {
      manager.getPoiAnimator(animatorID: run.nativeID)?.stop()
      manager.removePoiAnimator(animatorID: run.nativeID)
    }
  }

  private func removeAnimationTargets(_ ids: [String]) {
    var removedIDs = Set(ids)
    guard !removedIDs.isEmpty else { return }
    var canceledRuns: [(id: String, run: ActiveAnimationRun)] = []
    while true {
      let invalidDefinitionIDs = animationDefinitions.compactMap { id, definition in
        definition.labelIds.contains(where: removedIDs.contains) ? id : nil
      }
      guard !invalidDefinitionIDs.isEmpty else { break }
      var didAddRemovedID = false
      for id in invalidDefinitionIDs {
        animationDefinitions.removeValue(forKey: id)
        if let run = activeAnimationRuns.removeValue(forKey: id) {
          canceledRuns.append((id, run))
          if run.definition.removeAtStop {
            for targetID in run.definition.labelIds where removedIDs.insert(targetID).inserted {
              didAddRemovedID = true
            }
          }
        }
      }
      if !didAddRemovedID {
        break
      }
    }
    for canceled in canceledRuns {
      manager.getPoiAnimator(animatorID: canceled.run.nativeID)?.stop()
      manager.removePoiAnimator(animatorID: canceled.run.nativeID)
      emitAnimationStopped(["id": canceled.id, "finished": false])
    }
    for id in removedIDs {
      labels.removeValue(forKey: id)
      coordinates.removeValue(forKey: id)
    }
    trackingManager.stopTracking()
  }

  private func show(_ id: String, visible: Bool, autoMove: Bool) throws {
    if let poi = labels[id] {
      if visible, autoMove {
        poi.showWithAutoMove()
      } else {
        visible ? poi.show() : poi.hide()
      }
      return
    }
    if let poi = lodLabels[id] {
      if visible, autoMove {
        poi.showWithAutoMove()
      } else {
        visible ? poi.show() : poi.hide()
      }
      return
    }
    if let text = pathLabels[id] {
      if autoMove {
        throw labelError(labelUnsupported, "Path labels do not expose auto-move.")
      }
      visible ? text.show() : text.hide(); return
    }
    throw notFound("label", id)
  }

  private func share(_ command: MapLabelCommandRecord, transform: Bool) throws {
    let isEnabled = try command.enabled.required("enabled")
    let source = try label(command.sourceId.required("sourceId"))
    let targetID = try command.targetId.required("targetId")
    let target = try label(targetID)
    if transform {
      isEnabled ? source.shareTransformWithPoi(target) : source
        .removeShareTransformWithPoi(target)
    } else {
      isEnabled ? source.sharePositionWithPoi(target) : source
        .removeSharePositionWithPoi(target)
    }
    if !isEnabled {
      labelsWithReleasedSharing.insert(targetID)
    }
  }

  private func setBadgeVisibility(_ command: MapLabelCommandRecord) throws {
    let isVisible = try command.visible.required("visible")
    let id = try command.requiredID()
    let badgeID = try command.badgeId.required("badgeId")
    if let poi = labels[id] {
      if command.style {
        isVisible ? poi.showStyleBadge(badgeID: badgeID) : poi
          .hideStyleBadge(badgeID: badgeID)
      } else {
        isVisible ? poi.showBadge(badgeID: badgeID) : poi.hideBadge(badgeID: badgeID)
      }
      return
    }
    if let poi = lodLabels[id] {
      if command.style {
        isVisible ? poi.showStyleBadge(badgeID: badgeID) : poi
          .hideStyleBadge(badgeID: badgeID)
      } else {
        isVisible ? poi.showBadge(badgeID: badgeID) : poi.hideBadge(badgeID: badgeID)
      }
      return
    }
    throw notFound("label", id)
  }

  private func label(_ id: String) throws -> Poi {
    if let label = labels[id] {
      return label
    }
    if lodLabels[id] != nil {
      throw labelError(
        labelUnsupported,
        "LOD label \(id) cannot be moved, transformed, animated, or tracked."
      )
    }
    throw notFound("label", id)
  }

  private func emit(_ label: any KakaoMapsSDK.Label, kind: String) {
    guard !isDisposed, let coordinate = coordinates[label.itemID] else { return }
    if let poi = label as? Poi {
      guard let current = labels[label.itemID],
            let native = labelLayers[label.layerID]?.getPoi(poiID: label.itemID),
            current === poi, native === poi
      else { return }
    } else if let poi = label as? LodPoi {
      guard let current = lodLabels[label.itemID],
            let native = lodLabelLayers[label.layerID]?.getLodPoi(poiID: label.itemID),
            current === poi, native === poi
      else { return }
    } else {
      return
    }
    let latitude: Double
    let longitude: Double
    if let poi = label as? Poi {
      latitude = poi.position.wgsCoord.latitude
      longitude = poi.position.wgsCoord.longitude
    } else {
      latitude = coordinate.latitude
      longitude = coordinate.longitude
    }
    emitClick([
      "id": label.itemID,
      "layerId": publicLayerIDsByNative[label.layerID] ?? label.layerID,
      "kind": kind,
      "coordinate": [
        "latitude": latitude,
        "longitude": longitude
      ]
    ])
  }

  private func clearHandlers() {
    eventHandlers.forEach { $0.dispose() }
    eventHandlers.removeAll()
  }

  private func clearLayersAndStyles() {
    labelsWithReleasedSharing.removeAll()
    labelLayers.keys.forEach(manager.removeLabelLayer)
    lodLabelLayers.keys.forEach(manager.removeLodLabelLayer)
    styleIds.forEach(manager.removePoiStyle)
    styleIds.removeAll()
  }

  private func makeNativeID(_ kind: String) -> String {
    nextNativeObjectID += 1
    return "__rnk_\(nativeNamespace)_\(kind)_\(nextNativeObjectID)"
  }

  private func requireActive() throws {
    if isDisposed {
      throw labelError("ERR_KAKAO_MAP_VIEW_DESTROYED", "The map view was destroyed.")
    }
  }

  private func loadImages(
    _ uris: Set<String>,
    generation currentGeneration: Int,
    completion: @escaping (Result<[String: UIImage], Error>) -> Void
  ) {
    guard !uris.isEmpty else {
      completion(.success([:]))
      return
    }
    var images: [String: UIImage] = [:]
    var remaining = uris.count
    var didFinish = false
    for uri in uris {
      let token = imageLoader.load(uri) { [weak self] result in
        guard let self, !isDisposed, currentGeneration == generation, !didFinish else { return }
        switch result {
        case let .success(image):
          images[uri] = image
          remaining -= 1
          if remaining == 0 {
            didFinish = true
            imageRequests.removeAll()
            completion(.success(images))
          }
        case let .failure(error):
          didFinish = true
          cancelImageRequests()
          completion(.failure(error))
        }
      }
      imageRequests.append(token)
    }
  }

  private func cancelImageRequests() {
    imageRequests.forEach { $0.cancel() }
    imageRequests.removeAll()
  }

  private func finishApply(_ result: Result<Void, Error>) {
    guard let completion = pendingApplyCompletion else { return }
    pendingApplyCompletion = nil
    completion(result)
  }

  private func cancelPendingApply(_ message: String) {
    finishApply(.failure(labelError(labelApplyCancelled, message)))
  }
}

private func validate(_ scene: MapLabelSceneRecord) throws {
  try unique("style", scene.styles.map(\.id))
  try unique("path text style", scene.pathTextStyles.map(\.id))
  try unique("layer", scene.layers.map(\.id) + scene.lodLayers.map(\.id))
  try unique(
    "label",
    scene.labels.map(\.id) + scene.lodLabels.map(\.id) + scene.pathLabels.map(\.id)
  )
  try unique("animation", scene.animations.map(\.id))
  let styles = Dictionary(uniqueKeysWithValues: scene.styles.map { ($0.id, $0) })
  let layerIDs = Set(scene.layers.map(\.id))
  let lodLayerIDs = Set(scene.lodLayers.map(\.id))
  let regularLabelIDs = Set(scene.labels.map(\.id))
  let allIDs = scene.styles.map(\.id) + scene.pathTextStyles.map(\.id) + Array(layerIDs) +
    Array(lodLayerIDs) + Array(regularLabelIDs) + scene.lodLabels.map(\.id) +
    scene.pathLabels.map(\.id) + scene.animations.map(\.id)
  if allIDs.contains(where: \.isEmpty) {
    throw labelError(labelInvalidArgument, "IDs must not be empty.")
  }
  for style in scene.styles {
    guard !style.levels.isEmpty else { throw labelError(
      labelInvalidArgument,
      "Style \(style.id) needs at least one level."
    ) }
    try unique("style level", style.levels.map { String($0.level) })
    for level in style.levels {
      guard level.padding >= 0 else {
        throw labelError(labelInvalidArgument, "Style padding must be non-negative.")
      }
      try unique("style badge", level.badges.map(\.id))
      try level.image?.validate()
      try level.badges.forEach { try $0.image.validate() }
    }
  }
  for style in scene.pathTextStyles {
    guard !style.levels.isEmpty else {
      throw labelError(labelInvalidArgument, "Path style \(style.id) needs at least one level.")
    }
    try unique("path style level", style.levels.map { String($0.level) })
  }
  if scene.layers.contains(where: { !$0.competitionExceptions.isEmpty }) ||
    scene.lodLayers.contains(where: { !$0.competitionExceptions.isEmpty })
  {
    throw labelError(
      labelUnsupported,
      "iOS Kakao Maps SDK does not expose layer competition exceptions."
    )
  }
  for layer in scene.lodLayers where layer.radius < 0 {
    throw labelError(labelInvalidArgument, "LOD radius must be non-negative.")
  }
  for item in scene.labels {
    _ = try item.coordinate.mapPoint
    guard layerIDs.contains(item.layerId) else { throw notFound("layer", item.layerId) }
    guard let style = styles[item.styleId] else { throw notFound("style", item.styleId) }
    try validateTextIndices(item.text, style: style, labelID: item.id)
    _ = try item.rank.integer("rank")
    _ = try transformType(item.transform)
    _ = try item.pixelOffset?.point
    _ = try item.orientation.finiteFloat("orientation")
    try item.scale?.validateScale()
    try unique("label badge", item.badges.map(\.id))
    try item.badges.forEach {
      try $0.image.validate()
      _ = try $0.offset?.point
    }
  }
  for item in scene.lodLabels {
    _ = try item.coordinate.mapPoint
    guard lodLayerIDs.contains(item.layerId) else { throw notFound("LOD layer", item.layerId) }
    guard let style = styles[item.styleId] else { throw notFound("style", item.styleId) }
    try validateTextIndices(item.text, style: style, labelID: item.id)
    _ = try item.rank.integer("rank")
    _ = try transformType(item.transform)
    try unique("label badge", item.badges.map(\.id))
    try item.badges.forEach {
      try $0.image.validate()
      _ = try $0.offset?.point
    }
  }
  for item in scene.pathLabels {
    guard item.points.count >= 2 else {
      throw labelError(labelInvalidArgument, "Path label \(item.id) needs at least two points.")
    }
    _ = try item.points.map { try $0.mapPoint }
    guard layerIDs.contains(item.layerId) else { throw notFound("layer", item.layerId) }
    guard scene.pathTextStyles.contains(where: { $0.id == item.styleId }) else {
      throw notFound("path text style", item.styleId)
    }
    _ = try item.rank.nonnegativeInteger("rank")
  }
  for animation in scene.animations {
    guard !animation.labelIds.isEmpty, !animation.keyframes.isEmpty else {
      throw labelError(labelInvalidArgument, "Animation \(animation.id) cannot be empty.")
    }
    try unique("animation label", animation.labelIds)
    for id in animation.labelIds where !regularLabelIDs.contains(id) {
      throw notFound("animatable label", id)
    }
    guard animation.repeatCount >= 0 else {
      throw labelError(labelInvalidArgument, "Animation repeatCount must be non-negative.")
    }
    guard ["drop", "alpha", "scale", "scaleAlpha", "transform"].contains(animation.effect) else {
      throw labelError(labelInvalidArgument, "Unknown label animation effect: \(animation.effect)")
    }
    if animation.effect != "drop", animation.repeatCount != 1 {
      throw labelError(
        labelUnsupported,
        "Keyframe label animations do not expose repeatCount on iOS."
      )
    }
    if animation.effect == "drop", animation.keyframes.count != 1 {
      throw labelError(labelInvalidArgument, "Drop animation requires exactly one keyframe.")
    }
    for frame in animation.keyframes {
      _ = try frame.duration.duration()
      _ = try interpolation(frame.interpolation, duration: frame.duration)
      _ = try frame.alpha?.unitFloat("alpha")
      try frame.scale?.validateScale()
      _ = try frame.translation?.point
      _ = try frame.rotation?.finiteFloat("rotation")
      if ["scale", "scaleAlpha"].contains(animation.effect), frame.scale == nil {
        throw labelError(
          labelInvalidArgument,
          "\(animation.effect) animation requires scale in every keyframe."
        )
      }
    }
  }
}

private func validateTextIndices(
  _ texts: [MapLabelTextRecord],
  style: MapLabelStyleRecord,
  labelID: String
) throws {
  for text in texts where text.styleIndex < 0 || style.levels.contains(where: {
    text.styleIndex >= $0.textLines.count
  }) {
    throw labelError(
      labelInvalidArgument,
      "Label \(labelID) has a text style index that is unavailable at one or more levels."
    )
  }
}

private extension MapLabelSceneRecord {
  var imageUris: Set<String> {
    var result = Set<String>()
    for level in styles.flatMap(\.levels) {
      if let image = level.image {
        result.insert(image.uri)
      }
      level.badges.forEach { result.insert($0.image.uri) }
    }
    (labels.flatMap(\.badges) + lodLabels.flatMap(\.badges)).forEach { result.insert($0.image.uri) }
    return result
  }
}

private extension MapLabelStyleRecord {
  func native(_ images: [String: UIImage], styleID: String) throws -> PoiStyle {
    let styles = try levels.sorted { $0.level < $1.level }.map { level -> PerLevelPoiStyle in
      let icon: PoiIconStyle? = try level.image.map { image in
        guard let native = images[image.uri] else { throw labelError(
          labelInvalidArgument,
          "Image was not loaded: \(image.uri)"
        ) }
        let transition = level.iconTransition ?? MapLabelTransitionRecord()
        return try PoiIconStyle(
          symbol: image.resized(native),
          anchorPoint: level.anchor?.point ?? CGPoint(x: 0.5, y: 0.5),
          transition: transition.native(),
          enableEntranceTransition: transition.enableEntrance,
          enableExitTransition: transition.enableExit,
          badges: level.badges.map { try $0.native(images) }
        )
      }
      let text: PoiTextStyle? = try level.textLines.isEmpty ? nil : {
        let transition = level.textTransition ?? MapLabelTransitionRecord()
        let result = try PoiTextStyle(
          transition: transition.native(),
          enableEntranceTransition: transition.enableEntrance,
          enableExitTransition: transition.enableExit,
          textLineStyles: level.textLines.map { try PoiTextLineStyle(textStyle: $0.native()) }
        )
        result.textLayouts = try Array(
          repeating: textLayout(level.textLayout),
          count: level.textLines.count
        )
        return result
      }()
      if let icon, let text {
        return try PerLevelPoiStyle(
          iconStyle: icon,
          textStyle: text,
          padding: level.padding.pixelFloat("padding"),
          level: level.level
        )
      }
      if let icon {
        return try PerLevelPoiStyle(
          iconStyle: icon,
          padding: level.padding.pixelFloat("padding"),
          level: level.level
        )
      }
      if let text {
        return try PerLevelPoiStyle(
          textStyle: text,
          padding: level.padding.pixelFloat("padding"),
          level: level.level
        )
      }
      throw labelError(
        labelInvalidArgument,
        "Style \(id) level \(level.level) needs an image or text style."
      )
    }
    return PoiStyle(styleID: styleID, styles: styles)
  }
}

private extension MapPathTextStyleRecord {
  var fingerprint: String {
    levels.sorted { $0.level < $1.level }.map { level in
      let text = level.text
      return [
        String(level.level),
        fingerprintPart(text.fontFamily),
        String(text.fontSize.bitPattern),
        fingerprintPart(text.color),
        fingerprintPart(text.strokeColor),
        String(text.strokeWidth.bitPattern),
        String(text.characterSpacing.bitPattern),
        String(text.lineSpacing.bitPattern),
        String(text.aspectRatio.bitPattern)
      ].joined(separator: "|")
    }.joined(separator: ";")
  }

  func native(styleID: String) throws -> WaveTextStyle {
    try WaveTextStyle(styleID: styleID, styles: levels.sorted { $0.level < $1.level }.map {
      try PerLevelWaveTextStyle(textStyle: $0.text.native(), level: $0.level)
    })
  }
}

private func fingerprintPart(_ value: String?) -> String {
  guard let value else { return "-" }
  return "\(value.utf8.count):\(value)"
}

private extension MapLabelTextStyleRecord {
  func native() throws -> TextStyle {
    let nativeLineSpace = try lineSpacing.finiteFloat("lineSpacing")
    guard nativeLineSpace >= 1 else {
      throw labelError(labelInvalidArgument, "lineSpacing must be at least 1.")
    }
    return try TextStyle(
      fontSize: UInt(fontSize.positivePixelInteger("fontSize")),
      fontColor: UIColor(hex: color),
      strokeThickness: UInt(strokeWidth.nonnegativePixelInteger("strokeWidth")),
      strokeColor: UIColor(hex: strokeColor ?? "#00000000"),
      font: fontFamily ?? "",
      charSpace: characterSpacing.pixelInteger("characterSpacing"),
      lineSpace: nativeLineSpace,
      aspectRatio: aspectRatio.finiteFloat("aspectRatio")
    )
  }
}

private extension MapLabelTransitionRecord {
  func native() throws -> PoiTransition {
    try PoiTransition(
      entrance: transition(entrance),
      exit: transition(exit)
    )
  }
}

private extension MapLabelBadgeStyleRecord {
  func native(_ images: [String: UIImage]) throws -> PoiBadge {
    guard let native = images[image.uri] else { throw labelError(
      labelInvalidArgument,
      "Image was not loaded: \(image.uri)"
    ) }
    return try PoiBadge(
      badgeID: id,
      image: image.resized(native),
      offset: offset?.pixelPoint ?? .zero,
      zOrder: zOrder
    )
  }
}

private extension MapLabelBadgeRecord {
  func native(_ images: [String: UIImage]) throws -> PoiBadge {
    guard let native = images[image.uri] else { throw labelError(
      labelInvalidArgument,
      "Image was not loaded: \(image.uri)"
    ) }
    return try PoiBadge(
      badgeID: id,
      image: image.resized(native),
      offset: offset?.pixelPoint ?? .zero,
      zOrder: zOrder
    )
  }
}

private extension MapLabelLayerRecord {
  func options(layerID: String) throws -> LabelLayerOptions {
    if !competitionExceptions.isEmpty {
      throw labelError(
        labelUnsupported,
        "iOS Kakao Maps SDK does not expose layer competition exceptions."
      )
    }
    return try LabelLayerOptions(
      layerID: layerID,
      competitionType: competitionType(competition),
      competitionUnit: labelCompetitionUnit(competitionUnit),
      orderType: labelOrdering(ordering),
      zOrder: zOrder
    )
  }
}

private extension MapLodLabelLayerRecord {
  func options(layerID: String) throws -> LodLabelLayerOptions {
    if !competitionExceptions.isEmpty {
      throw labelError(
        labelUnsupported,
        "iOS Kakao Maps SDK does not expose layer competition exceptions."
      )
    }
    return try LodLabelLayerOptions(
      layerID: layerID,
      competitionType: competitionType(competition),
      competitionUnit: labelCompetitionUnit(competitionUnit),
      orderType: labelOrdering(ordering),
      zOrder: zOrder,
      radius: radius.pixelFloat("radius")
    )
  }
}

private extension MapLabelRecord {
  func options(styleID: String) throws -> PoiOptions {
    let option = PoiOptions(styleID: styleID, poiID: id)
    option.rank = try rank.integer("rank")
    option.clickable = clickable
    option.transformType = try transformType(transform)
    for line in text {
      try option.addText(PoiText(
        text: line.value,
        styleIndex: UInt(Double(line.styleIndex).nonnegativeInteger("styleIndex"))
      ))
    }
    return option
  }
}

private extension MapLodLabelRecord {
  func options(styleID: String) throws -> PoiOptions {
    let option = PoiOptions(styleID: styleID, poiID: id)
    option.rank = try rank.integer("rank")
    option.clickable = clickable
    option.transformType = try transformType(transform)
    for line in text {
      try option.addText(PoiText(
        text: line.value,
        styleIndex: UInt(Double(line.styleIndex).nonnegativeInteger("styleIndex"))
      ))
    }
    return option
  }
}

private extension MapLabelAnimationRecord {
  func effectObject() throws -> any PoiAnimationEffect {
    let effect: any PoiAnimationEffect
    switch self.effect {
    case "drop":
      let value = try DropAnimationEffect(pixelHeight: (keyframes.first?.translation?.y ?? 0)
        .pixelFloat("translation.y"))
      value.playCount = UInt(max(0, repeatCount))
      value.interpolation = try interpolation(
        keyframes.first?.interpolation ?? "linear",
        duration: keyframes.first?.duration ?? 0
      )
      effect = value
    case "alpha":
      let value = AlphaAnimationEffect()
      for frame in keyframes {
        try value.addKeyframe(AlphaAnimationKeyFrame(
          alpha: (frame.alpha ?? 1).unitFloat("alpha"),
          interpolation: interpolation(frame.interpolation, duration: frame.duration)
        ))
      }
      value.resetToInitialState = resetToInitialState
      effect = value
    case "scale":
      let value = ScaleAnimationEffect()
      for frame in keyframes {
        let scale = try frame.scale.required("scale")
        try value.addKeyframe(ScaleAnimationKeyFrame(
          scale: Vector2(x: scale.x.finiteDouble("scale.x"), y: scale.y.finiteDouble("scale.y")),
          interpolation: interpolation(frame.interpolation, duration: frame.duration)
        ))
      }
      value.resetToInitialState = resetToInitialState
      effect = value
    case "scaleAlpha":
      let value = ScaleAlphaAnimationEffect()
      for frame in keyframes {
        let scale = try frame.scale.required("scale")
        try value.addKeyframe(ScaleAlphaAnimationKeyFrame(
          scale: Vector2(x: scale.x.finiteDouble("scale.x"), y: scale.y.finiteDouble("scale.y")),
          alpha: (frame.alpha ?? 1).unitFloat("alpha"),
          interpolation: interpolation(frame.interpolation, duration: frame.duration)
        ))
      }
      value.resetToInitialState = resetToInitialState
      effect = value
    case "transform":
      let value = TransformAnimationEffect()
      for frame in keyframes {
        try value.addKeyframe(TransformAnimationKeyFrame(
          translation: Vector2(
            x: (frame.translation?.x ?? 0).pixelDouble("translation.x"),
            y: (frame.translation?.y ?? 0).pixelDouble("translation.y")
          ),
          rotation: ((frame.rotation ?? 0) * .pi / 180).finiteFloat("rotation"),
          scale: Vector2(
            x: (frame.scale?.x ?? 1).finiteDouble("scale.x"),
            y: (frame.scale?.y ?? 1).finiteDouble("scale.y")
          ),
          alpha: (frame.alpha ?? 1).unitFloat("alpha"),
          interpolation: interpolation(frame.interpolation, duration: frame.duration)
        ))
      }
      value.resetToInitialState = resetToInitialState
      effect = value
    default:
      throw labelError(labelInvalidArgument, "Unknown label animation effect: \(self.effect)")
    }
    effect.hideAtStop = hideAtStop
    effect.removeAtStop = removeAtStop
    return effect
  }
}

private extension MapLabelPoint {
  var mapPoint: MapPoint {
    get throws {
      guard latitude.isFinite, longitude.isFinite, (-90 ... 90).contains(latitude),
            (-180 ... 180).contains(longitude)
      else {
        throw labelError(labelInvalidArgument, "Invalid coordinate.")
      }
      return MapPoint(longitude: longitude, latitude: latitude)
    }
  }
}

private extension MapLabelVector {
  var point: CGPoint {
    get throws {
      _ = try x.finiteFloat("point.x")
      _ = try y.finiteFloat("point.y")
      return CGPoint(x: x, y: y)
    }
  }

  var pixelPoint: CGPoint {
    get throws {
      try CGPoint(
        x: x.pixelDouble("point.x"),
        y: y.pixelDouble("point.y")
      )
    }
  }

  func validateScale() throws {
    guard try x.finiteFloat("scale.x") >= 0, try y.finiteFloat("scale.y") >= 0 else {
      throw labelError(labelInvalidArgument, "Scale must be non-negative.")
    }
  }
}

private extension MapLabelImage {
  func validate() throws {
    guard !uri.isEmpty else {
      throw labelError(labelInvalidArgument, "Image URI must not be empty.")
    }
    _ = try width?.positiveSize("image.width")
    _ = try height?.positiveSize("image.height")
  }

  func resized(_ source: UIImage) throws -> UIImage {
    guard width != nil || height != nil else { return source }
    let requestedWidth = try width.map { try $0.positiveSize("image.width") }
    let requestedHeight = try height.map { try $0.positiveSize("image.height") }
    guard source.size.width > 0, source.size.height > 0 else {
      throw labelError(labelInvalidArgument, "The image has no dimensions: \(uri)")
    }
    let ratio = source.size.width / source.size.height
    let size = CGSize(
      width: requestedWidth ?? requestedHeight! * ratio,
      height: requestedHeight ?? requestedWidth! / ratio
    )
    return UIGraphicsImageRenderer(size: size, format: MapUnits.imageRendererFormat).image { _ in
      source.draw(in: CGRect(origin: .zero, size: size))
    }
  }
}

private func textLayout(_ value: String) throws -> PoiTextLayout {
  switch value {
  case "center": return .center
  case "top": return .top
  case "bottom": return .bottom
  case "left": return .left
  case "right": return .right
  default: throw labelError(labelInvalidArgument, "Unknown label text layout: \(value)")
  }
}

private func transition(_ value: String) throws -> TransitionType {
  switch value {
  case "none": return .none; case "alpha": return .alpha; case "scale": return .scale; default: throw labelError(
      labelInvalidArgument,
      "Unknown transition: \(value)"
    )
  }
}

private func competitionType(_ value: String) throws -> CompetitionType {
  switch value {
  case "none": return .none; case "all": return .all; case "upper": return .upper; case "upperLower": return .upperLower; case "upperSame": return .upperSame; case "same": return .same; case "sameLower": return .sameLower; case "lower": return .lower; default: throw labelError(
      labelInvalidArgument,
      "Unknown competition: \(value)"
    )
  }
}

private func labelCompetitionUnit(_ value: String) throws -> CompetitionUnit {
  switch value {
  case "iconAndText": return .poi; case "iconFirst": return .symbolFirst; default: throw labelError(
      labelInvalidArgument,
      "Unknown competition unit: \(value)"
    )
  }
}

private func labelOrdering(_ value: String) throws -> OrderingType {
  switch value {
  case "rank": return .rank; case "leftBottom": return .closerFromLeftBottom; default: throw labelError(
      labelInvalidArgument,
      "Unknown ordering: \(value)"
    )
  }
}

private func transformType(_ value: String) throws -> PoiTransformType {
  switch value {
  case "absoluteRotation": return .absoluteRotation; case "default": return .default; case "absoluteRotationKeepUpright": return .keepUpright; case "absoluteRotationDecal": return .absoluteRotationDecal; case "decal": return .decal; case "none": throw labelError(
      labelUnsupported,
      "iOS has no 'none' POI transform."
    ); default: throw labelError(labelInvalidArgument, "Unknown transform: \(value)")
  }
}

private func interpolation(_ value: String, duration: Double) throws -> AnimationInterpolation {
  let method: InterpolationMethodType
  switch value {
  case "linear": method = .linear; case "cubicIn": method = .cubicIn; case "cubicOut": method =
    .cubicOut; case "cubicInOut": method = .cubicInOut; default: throw labelError(
      labelInvalidArgument,
      "Unknown interpolation: \(value)"
    )
  }
  return try AnimationInterpolation(duration: UInt32(duration.duration()), method: method)
}

private func unique(_ kind: String, _ values: [String]) throws {
  var seen = Set<String>()
  if let duplicate = values.first(where: { !seen.insert($0).inserted }) {
    throw labelError(
      labelInvalidArgument,
      "Duplicate \(kind) id: \(duplicate)"
    )
  }
}

private func notFound(_ kind: String, _ id: String) -> KakaoMapException {
  labelError(
    labelNotFound,
    "\(kind) not found: \(id)"
  )
}

private func labelError(_ code: String, _ message: String) -> KakaoMapException {
  KakaoMapException(
    code,
    message
  )
}

private extension Optional {
  func required(_ name: String) throws -> Wrapped {
    guard let self
    else { throw labelError(
      labelInvalidArgument,
      "\(name) is required."
    ) }; return self
  }
}

private extension MapLabelCommandRecord {
  func requiredID() throws -> String {
    try id.required("id")
  }
}

private extension Double {
  func duration() throws -> Int {
    guard isFinite, self >= 0, self <= Double(UInt32.max),
          rounded() == self
    else { throw labelError(
      labelInvalidArgument,
      "Duration must be a non-negative 32-bit integer."
    ) }; return Int(self)
  }

  func finiteFloat(_ name: String) throws -> Float {
    guard isFinite,
          self <=
          Double(Float.greatestFiniteMagnitude),
          self >=
          -Double(Float.greatestFiniteMagnitude)
    else { throw labelError(
      labelInvalidArgument,
      "\(name) must be finite."
    ) }; return Float(self)
  }

  func finiteDouble(_ name: String) throws -> Double {
    guard isFinite else {
      throw labelError(labelInvalidArgument, "\(name) must be finite.")
    }
    return self
  }

  func pixelDouble(_ name: String) throws -> Double {
    try MapUnits.pixels(finiteDouble(name)).finiteDouble(name)
  }

  func pixelFloat(_ name: String) throws -> Float {
    try pixelDouble(name).finiteFloat(name)
  }

  func unitFloat(_ name: String) throws -> Float {
    let value = try finiteFloat(name)
    guard (0 ... 1).contains(value) else {
      throw labelError(labelInvalidArgument, "\(name) must be between 0 and 1.")
    }
    return value
  }

  func integer(_ name: String) throws -> Int {
    guard isFinite, rounded() == self,
          self <= Double(Int.max),
          self >= Double(Int.min)
    else { throw labelError(
      labelInvalidArgument,
      "\(name) must be an integer."
    ) }; return Int(self)
  }

  func pixelInteger(_ name: String) throws -> Int {
    _ = try finiteDouble(name)
    return try MapUnits.pixels(self).rounded().integer(name)
  }

  func nonnegativeInteger(_ name: String) throws
    -> Int
  {
    let value = try integer(name); guard value >= 0
    else { throw labelError(
      labelInvalidArgument,
      "\(name) must be non-negative."
    ) }; return value
  }

  func nonnegativePixelInteger(_ name: String) throws -> Int {
    guard try finiteDouble(name) >= 0 else {
      throw labelError(labelInvalidArgument, "\(name) must be non-negative.")
    }
    return try MapUnits.pixels(self).rounded().nonnegativeInteger(name)
  }

  func positiveInteger(_ name: String) throws -> Int {
    let value = try integer(name); guard value >
      0
    else { throw labelError(
      labelInvalidArgument,
      "\(name) must be positive."
    ) }; return value
  }

  func positivePixelInteger(_ name: String) throws -> Int {
    guard try finiteDouble(name) > 0 else {
      throw labelError(labelInvalidArgument, "\(name) must be positive.")
    }
    return try MapUnits.pixels(self).rounded().positiveInteger(name)
  }

  func positiveSize(_ name: String) throws -> CGFloat {
    guard isFinite, self > 0, self <= Double(CGFloat.greatestFiniteMagnitude) else {
      throw labelError(labelInvalidArgument, "\(name) must be positive.")
    }
    return CGFloat(self)
  }
}

private extension UIColor {
  convenience init(hex: String) throws {
    var value = hex
    if value.hasPrefix("#") {
      value.removeFirst()
    }
    guard value.count == 6 || value.count == 8,
          let number = UInt64(value, radix: 16)
    else { throw labelError(
      labelInvalidArgument,
      "Invalid color: \(hex)"
    ) }
    let hasAlpha = value.count == 8
    let red = CGFloat((number >> (hasAlpha ? 24 : 16)) & 0xFF) / 255
    let green = CGFloat((number >> (hasAlpha ? 16 : 8)) & 0xFF) / 255
    let blue = CGFloat((number >> (hasAlpha ? 8 : 0)) & 0xFF) / 255
    let alpha = hasAlpha ? CGFloat(number & 0xFF) / 255 : 1
    self.init(red: red, green: green, blue: blue, alpha: alpha)
  }
}
