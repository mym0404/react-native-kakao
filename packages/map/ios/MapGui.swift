import ExpoModulesCore
import KakaoMapsSDK
import UIKit

private let mapGuiInvalidArgument = "ERR_KAKAO_MAP_GUI_INVALID_ARGUMENT"
private let mapGuiNotFound = "ERR_KAKAO_MAP_GUI_NOT_FOUND"
private let mapGuiUnsupported = "ERR_KAKAO_MAP_UNSUPPORTED_PLATFORM_FEATURE"
private let mapGuiApplyCancelled = "ERR_KAKAO_MAP_GUI_APPLY_CANCELLED"

struct MapGuiImageSourceRecord: Record {
  @Field(.required) var uri = ""
  @Field var width: Double?
  @Field var height: Double?
}

struct MapGuiPointRecord: Record {
  @Field(.required) var x = Double.nan
  @Field(.required) var y = Double.nan
}

struct MapGuiSizeRecord: Record {
  @Field(.required) var width = Double.nan
  @Field(.required) var height = Double.nan
}

struct MapGuiStrokeRecord: Record {
  @Field(.required) var color = ""
  @Field(.required) var width = Double.nan
}

struct MapGuiSplitLineRecord: Record {
  @Field(.required) var color = ""
  @Field(.required) var width = Double.nan
}

struct MapGuiIosLayoutRecord: Record {
  @Field var backgroundColor: String?
  @Field var splitLine: MapGuiSplitLineRecord?
}

struct MapGuiAndroidLayoutRecord: Record {
  @Field var background: MapGuiNodeRecord?
}

struct MapGuiPaddingRecord: Record {
  @Field(.required) var top = Double.nan
  @Field(.required) var right = Double.nan
  @Field(.required) var bottom = Double.nan
  @Field(.required) var left = Double.nan
}

struct MapGuiCoordinateRecord: Record {
  @Field(.required) var latitude = Double.nan
  @Field(.required) var longitude = Double.nan
}

final class MapGuiNodeRecord: Record {
  @Field(.required) var id = ""
  @Field(.required) var type = ""
  @Field var platform: String?
  @Field var clickable = false
  @Field var padding: MapGuiPaddingRecord?
  @Field var origin: String?
  @Field var align: String?
  @Field var orientation: String?
  @Field var children: [MapGuiNodeRecord] = []
  @Field var child: MapGuiNodeRecord?
  @Field var source: MapGuiImageSourceRecord?
  @Field var pressedSource: MapGuiImageSourceRecord?
  @Field var sources: [MapGuiImageSourceRecord] = []
  @Field var size: MapGuiSizeRecord?
  @Field var pressedSize: MapGuiSizeRecord?
  @Field var stretch: MapGuiPaddingRecord?
  @Field var text: String?
  @Field var textSize: Double?
  @Field var color: String?
  @Field var stroke: MapGuiStrokeRecord?
  @Field var duration: Double?
  @Field var `repeat`: Double?
  @Field var autoStart = false
  @Field var ios: MapGuiIosLayoutRecord?
  @Field var android: MapGuiAndroidLayoutRecord?
}

struct MapGuiAutoMoveRecord: Record {
  @Field(.required) var enabled = false
  @Field var duration: Double?
}

struct MapGuiInfoWindowRecord: Record {
  @Field(.required) var id = ""
  @Field(.required) var position = MapGuiCoordinateRecord()
  @Field(.required) var body = MapGuiNodeRecord()
  @Field var tail: MapGuiNodeRecord?
  @Field var bodyOffset: MapGuiPointRecord?
  @Field var tailOffset: MapGuiPointRecord?
  @Field var visible = true
  @Field var zIndex = 0
  @Field var autoMove: MapGuiAutoMoveRecord?
}

struct MapGuiWidgetPositionRecord: Record {
  @Field(.required) var gravity = "topLeft"
  @Field(.required) var x = Double.nan
  @Field(.required) var y = Double.nan
}

struct MapGuiWidgetRecord: Record {
  @Field(.required) var id = ""
  @Field(.required) var position = MapGuiWidgetPositionRecord()
  @Field(.required) var root = MapGuiNodeRecord()
  @Field var visible = true
  @Field var zIndex = 0
  @Field var rotation = 0.0
  @Field var ios: MapGuiIosLayoutRecord?
}

struct MapGuiDropAnimationRecord: Record {
  @Field(.required) var id = ""
  @Field(.required) var platform = "ios"
  @Field(.required) var infoWindowIds: [String] = []
  @Field(.required) var duration = Double.nan
  @Field(.required) var pixelHeight = Double.nan
  @Field var interpolation = "linear"
  @Field var `repeat` = 1.0
  @Field var hideAtStop = false
  @Field var removeAtStop = false
}

struct MapGuiSceneRecord: Record {
  @Field var infoWindows: [MapGuiInfoWindowRecord] = []
  @Field var widgets: [MapGuiWidgetRecord] = []
  @Field var animations: [MapGuiDropAnimationRecord] = []
}

final class MapGui {
  typealias EventEmitter = ([String: Any]) -> Void

  private static let transparentInfoWindowImage = UIGraphicsImageRenderer(
    size: CGSize(width: 1, height: 1),
    format: MapUnits.imageRendererFormat
  ).image { _ in }

  private weak var map: KakaoMap?
  private var imageLoader: MapImageLoader?
  private let emit: EventEmitter
  private var infoWindows: [String: InfoWindow] = [:]
  private var widgets: [String: SpriteGui] = [:]
  private var animations: [String: InfoWindowAnimator] = [:]
  private var eventHandlers: [DisposableEventHandler] = []
  private var imageTasks: [MapImageLoadToken] = []
  private var applyGeneration = 0
  private var pendingApply: ((Error?) -> Void)?
  private var isDisposed = false

  init(map: KakaoMap, imageLoader: MapImageLoader, emit: @escaping EventEmitter) {
    self.map = map
    self.imageLoader = imageLoader
    self.emit = emit
  }

  func apply(_ scene: MapGuiSceneRecord, completion: @escaping (Error?) -> Void) {
    guard !isDisposed else {
      completion(KakaoMapException(mapGuiNotFound, "The GUI manager was disposed."))
      return
    }
    do {
      try validate(scene)
    } catch {
      completion(error)
      return
    }

    applyGeneration += 1
    pendingApply?(KakaoMapException(
      mapGuiApplyCancelled,
      "A newer GUI scene replaced this apply request."
    ))
    pendingApply = completion
    let generation = applyGeneration
    imageTasks.forEach { $0.cancel() }
    imageTasks.removeAll()
    loadImages(scene, generation: generation) { [weak self] result in
      guard let self, !self.isDisposed, generation == applyGeneration else { return }
      switch result {
      case let .success(images):
        do {
          try replaceScene(scene, images: images)
          pendingApply = nil
          completion(nil)
        } catch {
          clearScene()
          pendingApply = nil
          completion(error)
        }
      case let .failure(error):
        pendingApply = nil
        completion(error)
      }
    }
  }

  func showInfoWindow(id: String, autoMove: Bool, duration: Double?) throws {
    if let duration, duration != 0 {
      throw KakaoMapException(
        mapGuiUnsupported,
        "iOS SDK 2.12.19 does not expose an auto-move duration for info windows."
      )
    }
    let infoWindow = try requireInfoWindow(id)
    if autoMove {
      infoWindow.showWithAutoMove()
    } else {
      infoWindow.show()
    }
  }

  func hideInfoWindow(id: String) throws {
    try requireInfoWindow(id).hide()
  }

  func moveInfoWindow(id: String, position: MapGuiCoordinateRecord, duration: Double) throws {
    try validateDuration(duration)
    try requireInfoWindow(id).moveAt(mapPoint(position), duration: UInt(duration))
  }

  func showWidget(id: String) throws {
    try requireWidget(id).show()
  }

  func hideWidget(id: String) throws {
    try requireWidget(id).hide()
  }

  func positionWidget(id: String, position: MapGuiWidgetPositionRecord) throws {
    try validatePoint(position.x, position.y, name: "widget position")
    let widget = try requireWidget(id)
    widget.origin = try alignment(position.gravity)
    widget.position = try CGPoint(
      x: pixelDouble(position.x, name: "widget position x"),
      y: pixelDouble(position.y, name: "widget position y")
    )
    widget.updateGui()
  }

  func rotateWidget(id: String, rotation: Double) throws {
    guard rotation.isFinite else { throw exception("Rotation must be finite.") }
    let widget = try requireWidget(id)
    widget.orientation = rotation * .pi / 180
    widget.updateGui()
  }

  func startAnimation(id: String) throws {
    try requireAnimation(id).start()
  }

  func stopAnimation(id: String) throws {
    try requireAnimation(id).stop()
  }

  func controlAnimatedImage(
    ownerType: String,
    ownerId: String,
    componentId: String,
    action: String
  ) throws {
    let owner: GuiBase
    switch ownerType {
    case "infoWindow": owner = try requireInfoWindow(ownerId)
    case "widget": owner = try requireWidget(ownerId)
    default: throw exception("Unknown GUI owner type: \(ownerType).")
    }
    guard let image = owner.getChild(componentId) as? GuiAnimatedImage else {
      throw KakaoMapException(mapGuiNotFound, "Animated image \(componentId) was not found.")
    }
    switch action {
    case "start": image.start()
    case "pause": image.pause()
    case "resume": image.resume()
    case "stop": image.stop()
    default: throw exception("Unknown animated-image action: \(action).")
    }
  }

  func status() throws -> [String: Any] {
    guard !isDisposed, let manager = map?.getGuiManager() else {
      throw KakaoMapException(mapGuiNotFound, "The GUI manager was disposed.")
    }
    let infoWindowStatus = (manager.infoWindowLayer.getAllInfoWindows() ?? [])
      .sorted { $0.name < $1.name }.compactMap { infoWindow -> [String: Any]? in
        guard let coordinate = infoWindow.rawPosition()?.wgsCoord else { return nil }
        return [
          "id": infoWindow.name,
          "visible": infoWindow.isShow,
          "position": [
            "latitude": coordinate.latitude,
            "longitude": coordinate.longitude
          ],
          "zIndex": infoWindow.zOrder
        ] as [String: Any]
      }
    let widgetStatus = (manager.spriteGuiLayer.getAllSpriteGuis() ?? [])
      .sorted { $0.name < $1.name }.map { widget in
        [
          "id": widget.name,
          "visible": widget.isShow,
          "position": [
            "gravity": alignmentName(widget.origin),
            "x": widget.position.x / MapUnits.pixelsPerPoint,
            "y": widget.position.y / MapUnits.pixelsPerPoint
          ],
          "rotation": widget.orientation * 180 / .pi,
          "zIndex": widget.zOrder
        ] as [String: Any]
      }
    let animationStatus = animations.keys.sorted().compactMap { id -> [String: Any]? in
      guard let animation = manager.getInfoWindowAnimator(animatorID: id) else { return nil }
      return ["id": animation.animatorID, "running": animation.isStart]
    }
    return [
      "infoWindows": infoWindowStatus,
      "widgets": widgetStatus,
      "animations": animationStatus,
      "counts": [
        "infoWindows": infoWindowStatus.count,
        "widgets": widgetStatus.count,
        "animations": animationStatus.count
      ],
      "capabilities": [
        "button": true,
        "animatedImage": true,
        "infoWindowAnimation": true,
        "arbitraryComponentClicks": false,
        "componentAnimationEvents": true,
        "guiMoveEvents": true,
        "autoMoveDuration": false
      ]
    ]
  }

  func dispose() {
    guard !isDisposed else { return }
    isDisposed = true
    applyGeneration += 1
    pendingApply?(KakaoMapException(mapGuiApplyCancelled, "The GUI manager was disposed."))
    pendingApply = nil
    imageTasks.forEach { $0.cancel() }
    imageTasks.removeAll()
    clearScene()
    map = nil
    imageLoader = nil
  }

  private func replaceScene(_ scene: MapGuiSceneRecord, images: [String: UIImage]) throws {
    guard let map
    else { throw KakaoMapException(mapGuiNotFound, "The map is no longer available.") }
    clearScene()
    let manager = map.getGuiManager()
    for record in scene.infoWindows {
      let infoWindow = InfoWindow(record.id)
      infoWindow.body = try bodyImage(record.body, images: images, ownerId: record.id)
      if let tail = record.tail {
        infoWindow.tail = try image(tail, images: images, ownerId: record.id)
      }
      infoWindow.position = try mapPoint(record.position)
      infoWindow.bodyOffset = try pixelPoint(record.bodyOffset)
      infoWindow.positionOffset = try pixelPoint(record.tailOffset)
      infoWindow.zOrder = record.zIndex
      installHandlers(infoWindow, ownerType: "infoWindow", ownerId: record.id)
      manager.infoWindowLayer.addInfoWindow(infoWindow)
      if record.visible {
        record.autoMove?.enabled == true ? infoWindow.showWithAutoMove() : infoWindow.show()
      } else {
        infoWindow.hide()
      }
      infoWindows[record.id] = infoWindow
      startAutoImages(record.body, owner: infoWindow)
    }
    for record in scene.widgets {
      let widget = SpriteGui(record.id)
      try widget.addChild(component(record.root, images: images, ownerId: record.id))
      widget.origin = try alignment(record.position.gravity)
      widget.position = try CGPoint(
        x: pixelDouble(record.position.x, name: "widget position x"),
        y: pixelDouble(record.position.y, name: "widget position y")
      )
      widget.orientation = record.rotation * .pi / 180
      widget.zOrder = record.zIndex
      if let backgroundColor = record.ios?.backgroundColor {
        widget.bgColor = try color(backgroundColor)
      }
      if let splitLine = record.ios?.splitLine {
        widget.showSplitLine = true
        widget.splitLineColor = try color(splitLine.color)
        widget.splitLineWidth = try nonnegativePixelInt(splitLine.width, name: "split-line width")
      }
      installHandlers(widget, ownerType: "widget", ownerId: record.id)
      manager.spriteGuiLayer.addSpriteGui(widget)
      record.visible ? widget.show() : widget.hide()
      widgets[record.id] = widget
      startAutoImages(record.root, owner: widget)
    }
    for record in scene.animations {
      let effect = try DropAnimationEffect(pixelHeight: pixelFloat(
        record.pixelHeight,
        name: "drop height"
      ))
      effect.interpolation = try interpolation(record.interpolation, duration: record.duration)
      effect.playCount = UInt(record.repeat)
      effect.hideAtStop = record.hideAtStop
      effect.removeAtStop = record.removeAtStop
      guard let animator = manager.addInfoWindowAnimator(animatorID: record.id, effect: effect)
      else {
        throw exception("Could not create info-window animator \(record.id).")
      }
      try animator.addInfoWindows(record.infoWindowIds.map(requireInfoWindow))
      let animatorIdentity = ObjectIdentifier(animator)
      animator.setStopCallback { [weak self] _ in
        guard let self, !self.isDisposed,
              let active = animations[record.id],
              ObjectIdentifier(active) == animatorIdentity
        else { return }
        emit(["type": "animatorStopped", "id": record.id])
      }
      animations[record.id] = animator
    }
  }

  private func clearScene() {
    eventHandlers.forEach { $0.dispose() }
    eventHandlers.removeAll()
    let removedAnimations = Array(animations.values)
    animations.removeAll()
    removedAnimations.forEach { $0.stop() }
    map?.getGuiManager().clearAllInfoWindowAnimators()
    map?.getGuiManager().infoWindowLayer.clear()
    map?.getGuiManager().spriteGuiLayer.clear()
    infoWindows.removeAll()
    widgets.removeAll()
  }

  private func installHandlers(_ gui: GuiBase, ownerType: String, ownerId: String) {
    eventHandlers.append(gui.addTapEventHandler(target: self) { owner in { event in
      owner.emit([
        "type": "tap",
        "ownerType": ownerType,
        "ownerId": ownerId,
        "componentId": event.guiComponentName ?? ""
      ])
    } })
    eventHandlers.append(gui.addAnimationEventHandler(target: self) { owner in { event in
      owner.emit([
        "type": "componentAnimationState",
        "ownerType": ownerType,
        "ownerId": ownerId,
        "componentId": event.guiComponentName ?? "",
        "state": owner.animationStateName(event.state)
      ])
    } })
    eventHandlers.append(gui.addMoveEndEventHandler(target: self) { owner in { event in
      let coordinate = event.position.wgsCoord
      owner.emit([
        "type": "guiMoveEnd",
        "ownerType": ownerType,
        "ownerId": ownerId,
        "position": ["latitude": coordinate.latitude, "longitude": coordinate.longitude]
      ])
    } })
  }

  private func bodyImage(
    _ record: MapGuiNodeRecord,
    images: [String: UIImage],
    ownerId: String
  ) throws -> GuiImage {
    let child = try component(record, images: images, ownerId: ownerId)
    if let image = child as? GuiImage {
      return image
    }
    let wrapper = GuiImage("\(record.id)-body")
    wrapper.image = Self.transparentInfoWindowImage
    wrapper.child = child
    return wrapper
  }

  private func component(
    _ record: MapGuiNodeRecord,
    images: [String: UIImage],
    ownerId: String
  ) throws -> GuiComponentBase {
    let result: GuiComponentBase
    switch record.type {
    case "layout":
      let layout = GuiLayout(
        record.id,
        arrangement: record.orientation == "horizontal" ? .horizontal : .vertical
      )
      for child in record.children {
        try layout.addChild(component(child, images: images, ownerId: ownerId))
      }
      if let backgroundColor = record.ios?.backgroundColor {
        layout.bgColor = try color(backgroundColor)
      }
      if let splitLine = record.ios?.splitLine {
        layout.showSplitLine = true
        layout.splitLineColor = try color(splitLine.color)
        layout.splitLineWidth = try nonnegativePixelInt(splitLine.width, name: "split-line width")
      }
      result = layout
    case "image":
      result = try image(record, images: images, ownerId: ownerId)
    case "text":
      guard let textValue = record.text else { throw exception("GUI text is required.") }
      let text = GuiText(record.id)
      try text.addText(
        text: textValue,
        style: TextStyle(
          fontSize: UInt(positivePixelInt(record.textSize ?? 0, name: "text size")),
          fontColor: color(record.color ?? ""),
          strokeThickness: UInt(nonnegativePixelInt(
            record.stroke?.width ?? 0,
            name: "stroke width"
          )),
          strokeColor: color(record.stroke?.color ?? "#00000000")
        )
      )
      result = text
    case "button":
      guard record.platform == "ios"
      else { throw exception("GUI buttons must specify platform: ios.") }
      let button = GuiButton(record.id)
      let normalImage = try preparedImage(
        requiredImage(record.source, images: images),
        explicitSize: record.size,
        source: record.source
      )
      let pressedImage = try preparedImage(
        requiredImage(record.pressedSource, images: images),
        explicitSize: record.pressedSize,
        source: record.pressedSource
      )
      button.image = normalImage.image
      button.pressedImage = pressedImage.image
      if let size = normalImage.size {
        button.imageSize = size
      }
      if let size = pressedImage.size {
        button.pressedImageSize = size
      }
      if let child = record.child {
        button.child = try component(child, images: images, ownerId: ownerId)
      }
      result = button
    case "animatedImage":
      guard record.platform == "ios" else {
        throw exception("Animated GUI images must specify platform: ios.")
      }
      let animated = GuiAnimatedImage(record.id)
      let nativeImages = try record.sources.map { source in
        try preparedImage(
          requiredImage(source, images: images),
          explicitSize: record.size,
          source: source
        )
      }
      animated.addImages(nativeImages.map(\.image))
      animated.duration = try UInt(positiveInt(
        record.duration ?? 0,
        name: "animated-image duration"
      ))
      animated.playCount = try UInt(nonnegativeInt(
        record.repeat ?? 1,
        name: "animated-image repeat"
      ))
      if let size = nativeImages.first?.size {
        animated.imageSize = size
      }
      if let child = record.child {
        animated.child = try component(child, images: images, ownerId: ownerId)
      }
      result = animated
    default:
      throw exception("Unknown GUI component type: \(record.type).")
    }
    result.padding = try padding(record.padding)
    result.origin = try alignment(record.origin ?? "topLeft")
    result.align = try alignment(record.align ?? "topLeft")
    return result
  }

  private func image(
    _ record: MapGuiNodeRecord,
    images: [String: UIImage],
    ownerId: String
  ) throws -> GuiImage {
    let image = GuiImage(record.id)
    let nativeImage = try preparedImage(
      requiredImage(record.source, images: images),
      explicitSize: record.size,
      source: record.source
    )
    image.image = nativeImage.image
    if let size = nativeImage.size {
      image.imageSize = size
    }
    if let stretch = record.stretch {
      image.imageStretch = try GuiEdgeInsets(
        top: UInt(nonnegativePixelInt(stretch.top, name: "image stretch")),
        left: UInt(nonnegativePixelInt(stretch.left, name: "image stretch")),
        bottom: UInt(nonnegativePixelInt(stretch.bottom, name: "image stretch")),
        right: UInt(nonnegativePixelInt(stretch.right, name: "image stretch"))
      )
    }
    if let child = record.child {
      image.child = try component(child, images: images, ownerId: ownerId)
    }
    image.padding = try padding(record.padding)
    image.origin = try alignment(record.origin ?? "topLeft")
    image.align = try alignment(record.align ?? "topLeft")
    return image
  }

  private func loadImages(
    _ scene: MapGuiSceneRecord,
    generation: Int,
    completion: @escaping (Result<[String: UIImage], Error>) -> Void
  ) {
    var sources: [String: MapGuiImageSourceRecord] = [:]
    for infoWindow in scene.infoWindows {
      collectImages(infoWindow.body, into: &sources)
      if let tail = infoWindow.tail {
        collectImages(tail, into: &sources)
      }
    }
    scene.widgets.forEach { collectImages($0.root, into: &sources) }
    guard !sources.isEmpty else {
      completion(.success([:]))
      return
    }
    guard let imageLoader else {
      completion(.failure(exception("The map image loader is unavailable.")))
      return
    }
    var loaded: [String: UIImage] = [:]
    var remaining = sources.count
    var firstError: Error?
    for source in sources.values {
      let task = imageLoader.load(source.uri) { [weak self] result in
        guard let self, !self.isDisposed, generation == applyGeneration else { return }
        if case let .success(image) = result {
          loaded[source.uri] = image
        }
        if case let .failure(error) = result, firstError == nil {
          firstError = error
        }
        remaining -= 1
        if remaining == 0 {
          imageTasks.removeAll()
          if let firstError {
            completion(.failure(firstError))
          } else {
            completion(.success(loaded))
          }
        }
      }
      imageTasks.append(task)
    }
  }

  private func collectImages(
    _ node: MapGuiNodeRecord,
    into sources: inout [String: MapGuiImageSourceRecord]
  ) {
    [node.source, node.pressedSource].compactMap { $0 }.forEach { sources[$0.uri] = $0 }
    node.sources.forEach { sources[$0.uri] = $0 }
    node.children.forEach { collectImages($0, into: &sources) }
    if let child = node.child {
      collectImages(child, into: &sources)
    }
  }

  private func validate(_ scene: MapGuiSceneRecord) throws {
    try unique(scene.infoWindows.map(\.id), name: "info-window")
    try unique(scene.widgets.map(\.id), name: "widget")
    try unique(scene.animations.map(\.id), name: "GUI animation")
    let infoWindowIds = Set(scene.infoWindows.map(\.id))
    for infoWindow in scene.infoWindows {
      try nonempty(infoWindow.id, name: "info-window ID")
      _ = try mapPoint(infoWindow.position)
      _ = try pixelPoint(infoWindow.bodyOffset)
      _ = try pixelPoint(infoWindow.tailOffset)
      var componentIds = Set<String>()
      try validate(infoWindow.body, ids: &componentIds)
      if let tail = infoWindow.tail {
        guard tail.type == "image" else { throw exception("Info-window tails must be images.") }
        try validate(tail, ids: &componentIds)
      }
      if let duration = infoWindow.autoMove?.duration, duration != 0 {
        throw KakaoMapException(
          mapGuiUnsupported,
          "iOS does not expose an auto-move duration for info windows."
        )
      }
    }
    for widget in scene.widgets {
      try nonempty(widget.id, name: "widget ID")
      guard widget.root.type == "layout" else { throw exception("Widget roots must be layouts.") }
      try validatePoint(widget.position.x, widget.position.y, name: "widget position")
      _ = try alignment(widget.position.gravity)
      guard widget.rotation.isFinite else { throw exception("Widget rotation must be finite.") }
      try validateIosLayout(widget.ios)
      var componentIds = Set<String>()
      try validate(widget.root, ids: &componentIds)
    }
    for animation in scene.animations {
      guard animation.platform == "ios"
      else { throw exception("Info-window animations require platform: ios.") }
      try nonempty(animation.id, name: "GUI animation ID")
      _ = try pixelFloat(animation.pixelHeight, name: "drop height")
      _ = try nonnegativeInt(animation.repeat, name: "animation repeat")
      _ = try positiveInt(animation.duration, name: "animation duration")
      guard !animation.infoWindowIds.isEmpty else {
        throw exception("Animation \(animation.id) requires an info window.")
      }
      try unique(animation.infoWindowIds, name: "animation target")
      _ = try interpolation(animation.interpolation, duration: animation.duration)
      for id in animation.infoWindowIds where !infoWindowIds.contains(id) {
        throw exception("Animation \(animation.id) references unknown info window \(id).")
      }
    }
  }

  private func validate(_ node: MapGuiNodeRecord, ids: inout Set<String>) throws {
    try nonempty(node.id, name: "GUI component ID")
    guard ids.insert(node.id).inserted
    else { throw exception("Duplicate GUI component ID: \(node.id).") }
    if let padding = node.padding {
      try [padding.top, padding.right, padding.bottom, padding.left].forEach {
        _ = try nonnegativePixelInt($0, name: "GUI padding")
      }
    }
    if let size = node.size {
      _ = try guiSize(size)
    }
    if let size = node.pressedSize {
      _ = try guiSize(size)
    }
    if let stretch = node.stretch {
      try [stretch.top, stretch.right, stretch.bottom, stretch.left].forEach {
        _ = try nonnegativePixelInt($0, name: "image stretch")
      }
    }
    _ = try alignment(node.origin ?? "topLeft")
    _ = try alignment(node.align ?? "topLeft")
    if node.clickable, node.type != "button" {
      throw KakaoMapException(
        mapGuiUnsupported,
        "iOS SDK 2.12.19 only emits component taps from button nodes."
      )
    }
    switch node.type {
    case "layout":
      guard ["horizontal", "vertical"].contains(node.orientation ?? "") else {
        throw exception("GUI layout orientation must be horizontal or vertical.")
      }
      try validateIosLayout(node.ios)
      try node.children.forEach { try validate($0, ids: &ids) }
    case "image":
      try validateSource(node.source)
      if let child = node.child {
        try validate(child, ids: &ids)
      }
    case "text":
      guard node.text != nil else { throw exception("GUI text is required.") }
      _ = try positivePixelInt(node.textSize ?? 0, name: "text size")
      _ = try color(node.color ?? "")
      if let stroke = node.stroke {
        _ = try color(stroke.color)
        _ = try nonnegativePixelInt(stroke.width, name: "stroke width")
      }
    case "button":
      guard node.platform == "ios" else { throw exception("GUI buttons require platform: ios.") }
      try validateSource(node.source)
      try validateSource(node.pressedSource)
      if let child = node.child {
        try validate(child, ids: &ids)
      }
    case "animatedImage":
      guard node.platform == "ios", !node.sources.isEmpty else {
        throw exception("Animated GUI images require platform: ios and at least one image.")
      }
      try node.sources.forEach(validateSource)
      _ = try positiveInt(node.duration ?? 0, name: "animated-image duration")
      _ = try nonnegativeInt(node.repeat ?? 1, name: "animated-image repeat")
      if let child = node.child {
        try validate(child, ids: &ids)
      }
    default: throw exception("Unknown GUI component type: \(node.type).")
    }
  }

  private func validateIosLayout(_ value: MapGuiIosLayoutRecord?) throws {
    guard let value else { return }
    if let backgroundColor = value.backgroundColor {
      _ = try color(backgroundColor)
    }
    if let splitLine = value.splitLine {
      _ = try color(splitLine.color)
      _ = try nonnegativePixelInt(splitLine.width, name: "split-line width")
    }
  }

  private func validateSource(_ source: MapGuiImageSourceRecord?) throws {
    guard let source, !source.uri.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
      throw exception("GUI image URI must not be empty.")
    }
    if let width = source.width {
      _ = try positivePixelInt(width, name: "image source width")
    }
    if let height = source.height {
      _ = try positivePixelInt(height, name: "image source height")
    }
  }

  private func requiredImage(
    _ source: MapGuiImageSourceRecord?,
    images: [String: UIImage]
  ) throws -> UIImage {
    try validateSource(source)
    guard let source, let image = images[source.uri] else {
      throw exception("GUI image was not loaded.")
    }
    return image
  }

  private func requireInfoWindow(_ id: String) throws -> InfoWindow {
    guard !isDisposed, map != nil else {
      throw KakaoMapException(mapGuiNotFound, "The GUI manager was disposed.")
    }
    guard let infoWindow = infoWindows[id] else {
      throw KakaoMapException(mapGuiNotFound, "Info window \(id) was not found.")
    }
    return infoWindow
  }

  private func startAutoImages(_ node: MapGuiNodeRecord, owner: GuiBase) {
    if node.type == "animatedImage", node.autoStart {
      (owner.getChild(node.id) as? GuiAnimatedImage)?.start()
    }
    node.children.forEach { startAutoImages($0, owner: owner) }
    if let child = node.child {
      startAutoImages(child, owner: owner)
    }
  }

  private func requireWidget(_ id: String) throws -> SpriteGui {
    guard !isDisposed, map != nil else {
      throw KakaoMapException(mapGuiNotFound, "The GUI manager was disposed.")
    }
    guard let widget = widgets[id] else {
      throw KakaoMapException(mapGuiNotFound, "Widget \(id) was not found.")
    }
    return widget
  }

  private func requireAnimation(_ id: String) throws -> InfoWindowAnimator {
    guard !isDisposed, map != nil else {
      throw KakaoMapException(mapGuiNotFound, "The GUI manager was disposed.")
    }
    guard let animation = animations[id] else {
      throw KakaoMapException(mapGuiNotFound, "GUI animation \(id) was not found.")
    }
    return animation
  }

  private func mapPoint(_ value: MapGuiCoordinateRecord) throws -> MapPoint {
    guard value.latitude.isFinite, value.longitude.isFinite,
          (-90 ... 90).contains(value.latitude), (-180 ... 180).contains(value.longitude)
    else { throw exception("Invalid map coordinate.") }
    return MapPoint(longitude: value.longitude, latitude: value.latitude)
  }

  private func pixelPoint(_ value: MapGuiPointRecord?) throws -> CGPoint {
    guard let value else { return .zero }
    return try CGPoint(
      x: pixelDouble(value.x, name: "offset x"),
      y: pixelDouble(value.y, name: "offset y")
    )
  }

  private func guiSize(_ value: MapGuiSizeRecord) throws -> GuiSize {
    try GuiSize(
      width: UInt(positivePixelInt(value.width, name: "image width")),
      height: UInt(positivePixelInt(value.height, name: "image height"))
    )
  }

  private func preparedImage(
    _ image: UIImage,
    explicitSize explicit: MapGuiSizeRecord?,
    source: MapGuiImageSourceRecord?
  ) throws -> (image: UIImage, size: GuiSize?) {
    guard let logicalSize = try logicalImageSize(explicit, source: source, image: image) else {
      return (image, nil)
    }
    let rendered = UIGraphicsImageRenderer(
      size: logicalSize,
      format: MapUnits.imageRendererFormat
    ).image { _ in
      image.draw(in: CGRect(origin: .zero, size: logicalSize))
    }
    return try (
      rendered,
      GuiSize(
        width: UInt(positivePixelInt(Double(logicalSize.width), name: "image width")),
        height: UInt(positivePixelInt(Double(logicalSize.height), name: "image height"))
      )
    )
  }

  private func logicalImageSize(
    _ explicit: MapGuiSizeRecord?,
    source: MapGuiImageSourceRecord?,
    image: UIImage
  ) throws -> CGSize? {
    if let explicit {
      return try CGSize(
        width: CGFloat(positiveInt(explicit.width, name: "image width")),
        height: CGFloat(positiveInt(explicit.height, name: "image height"))
      )
    }
    guard source?.width != nil || source?.height != nil else { return nil }
    let aspectRatio = image.size.width / image.size.height
    let width = source?.width ?? ((source?.height ?? 0) * aspectRatio)
    let height = source?.height ?? ((source?.width ?? 0) / aspectRatio)
    return try CGSize(
      width: CGFloat(positiveInt(width, name: "image source width")),
      height: CGFloat(positiveInt(height, name: "image source height"))
    )
  }

  private func padding(_ value: MapGuiPaddingRecord?) throws -> GuiPadding {
    guard let value else { return GuiPadding(left: 0, right: 0, top: 0, bottom: 0) }
    return try GuiPadding(
      left: Int32(nonnegativePixelInt(value.left, name: "GUI padding left")),
      right: Int32(nonnegativePixelInt(value.right, name: "GUI padding right")),
      top: Int32(nonnegativePixelInt(value.top, name: "GUI padding top")),
      bottom: Int32(nonnegativePixelInt(value.bottom, name: "GUI padding bottom"))
    )
  }

  private func alignment(_ value: String) throws -> GuiAlignment {
    let vertical: VerticalAlign
    let horizontal: HorizontalAlign
    switch value {
    case "topLeft": (vertical, horizontal) = (.top, .left)
    case "topCenter": (vertical, horizontal) = (.top, .center)
    case "topRight": (vertical, horizontal) = (.top, .right)
    case "centerLeft": (vertical, horizontal) = (.middle, .left)
    case "center": (vertical, horizontal) = (.middle, .center)
    case "centerRight": (vertical, horizontal) = (.middle, .right)
    case "bottomLeft": (vertical, horizontal) = (.bottom, .left)
    case "bottomCenter": (vertical, horizontal) = (.bottom, .center)
    case "bottomRight": (vertical, horizontal) = (.bottom, .right)
    default: throw exception("Unknown GUI alignment: \(value).")
    }
    return GuiAlignment(vAlign: vertical, hAlign: horizontal)
  }

  private func alignmentName(_ value: GuiAlignment) -> String {
    switch (value.vAlign, value.hAlign) {
    case (.top, .left): "topLeft"
    case (.top, .center): "topCenter"
    case (.top, .right): "topRight"
    case (.middle, .left): "centerLeft"
    case (.middle, .center): "center"
    case (.middle, .right): "centerRight"
    case (.bottom, .left): "bottomLeft"
    case (.bottom, .center): "bottomCenter"
    case (.bottom, .right): "bottomRight"
    default: "topLeft"
    }
  }

  private func interpolation(_ value: String, duration: Double) throws -> AnimationInterpolation {
    let method: InterpolationMethodType
    switch value {
    case "linear": method = .linear
    case "cubicIn": method = .cubicIn
    case "cubicOut": method = .cubicOut
    case "cubicInOut": method = .cubicInOut
    default: throw exception("Unknown animation interpolation: \(value).")
    }
    return try AnimationInterpolation(
      duration: UInt32(positiveInt(duration, name: "animation duration")),
      method: method
    )
  }

  private func animationStateName(_ value: KakaoMapsSDK.AnimationState) -> String {
    switch value {
    case .start: "started"
    case .pause: "paused"
    case .resume: "resumed"
    case .stop: "stopped"
    default: "unknown"
    }
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

  private func validateDuration(_ value: Double) throws {
    guard value.isFinite, value >= 0, value <= Double(UInt32.max), value.rounded() == value else {
      throw exception("Duration must be a nonnegative integer in milliseconds.")
    }
  }

  private func validatePoint(_ x: Double, _ y: Double, name: String) throws {
    guard x.isFinite, y.isFinite else { throw exception("\(name) must be finite.") }
  }

  private func positiveInt(_ value: Double, name: String) throws -> Int {
    guard value.isFinite, value > 0, value <= Double(Int32.max), value.rounded() == value else {
      throw exception("\(name) must be a positive integer.")
    }
    return Int(value)
  }

  private func nonnegativeInt(_ value: Double, name: String) throws -> Int {
    guard value.isFinite, value >= 0, value <= Double(Int32.max), value.rounded() == value else {
      throw exception("\(name) must be a nonnegative integer.")
    }
    return Int(value)
  }

  private func pixelFloat(_ value: Double, name: String) throws -> Float {
    let pixels = try pixelDouble(value, name: name)
    guard abs(pixels) <= Double(Float.greatestFiniteMagnitude) else {
      throw exception("\(name) must fit a 32-bit floating-point pixel value.")
    }
    return Float(pixels)
  }

  private func pixelDouble(_ value: Double, name: String) throws -> Double {
    let pixels = MapUnits.pixels(value)
    guard pixels.isFinite else { throw exception("\(name) must be finite after pixel conversion.") }
    return pixels
  }

  private func positivePixelInt(_ value: Double, name: String) throws -> Int {
    _ = try positiveInt(value, name: name)
    let result = try pixelInteger(value, name: name)
    guard result > 0 else { throw exception("\(name) is too small after pixel conversion.") }
    return result
  }

  private func nonnegativePixelInt(_ value: Double, name: String) throws -> Int {
    _ = try nonnegativeInt(value, name: name)
    return try pixelInteger(value, name: name)
  }

  private func pixelInteger(_ value: Double, name: String = "pixel value") throws -> Int {
    let pixels = MapUnits.pixels(value).rounded()
    guard pixels.isFinite, pixels >= 0, pixels <= Double(Int32.max) else {
      throw exception("\(name) is out of range after pixel conversion.")
    }
    return Int(pixels)
  }

  private func unique(_ values: [String], name: String) throws {
    guard Set(values).count == values.count else { throw exception("Duplicate \(name) ID.") }
  }

  private func nonempty(_ value: String, name: String) throws {
    guard !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
      throw exception("\(name) must not be empty.")
    }
  }

  private func exception(_ message: String) -> KakaoMapException {
    KakaoMapException(mapGuiInvalidArgument, message)
  }
}
