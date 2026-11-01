import ExpoModulesCore
import KakaoMapsSDK

final class KakaoMapView: ExpoView, MapControllerDelegate, KakaoMapEventDelegate {
  let onMapReady = EventDispatcher()
  let onError = EventDispatcher()
  let onCameraMoveStart = EventDispatcher()
  let onCameraIdle = EventDispatcher()
  let onMapClick = EventDispatcher()
  let onMapLongClick = EventDispatcher()
  let onTerrainClick = EventDispatcher()
  let onViewportClick = EventDispatcher()
  let onVisibilityChanged = EventDispatcher()
  let onFocusChanged = EventDispatcher()
  let onPoiClick = EventDispatcher()
  let onCompassClick = EventDispatcher()
  let onMapTypeChanged = EventDispatcher()
  let onPaddingChanged = EventDispatcher()
  let onViewportChanged = EventDispatcher()
  let onLabelClick = EventDispatcher()
  let onLabelAnimationStopped = EventDispatcher()
  let onLabelsChanged = EventDispatcher()
  let onShapeAnimationStop = EventDispatcher()
  let onShapesChanged = EventDispatcher()
  let onRoutesChanged = EventDispatcher()
  let onRouteProgress = EventDispatcher()
  let onRouteAnimationStop = EventDispatcher()
  let onCameraOperation = EventDispatcher()
  private var labels: MapLabels?
  private var shapes: MapShapes?
  private var routes: MapRoutes?
  private var cameraCommands: MapCameraCommands?
  private var imageLoader: MapImageLoader?
  private var pendingLabels: MapLabelSceneRecord?
  private var pendingShapes: [String: Any]?
  private var hasUsedShapes = false
  private var pendingRoutes: [String: Any]?
  private var hasUsedRoutes = false
  private var routeGeneration = 0
  private var labelGeneration = 0
  var pendingInitialCamera: CameraOptions?
  var camera: CameraOptions?
  private var initialCamera: CameraOptions?
  private var lastCameraValues: [Double]?
  private var pendingOptions: KakaoMapViewOptions?
  private var appliedOptions = KakaoMapViewOptions()
  private var semanticOverlays: Set<String> = []
  private var customOverlays: Set<String> = []
  private var currentViewInfoName = "map"
  private var currentLanguage = "ko"
  private var hasInitialProps = false
  private var container: KMViewContainer?
  private var controller: KMController?
  private var map: KakaoMap?
  private var lastEmittedViewportSize: CGSize?
  private var isStarted = false
  private var isDestroyed = false
  private var isAuthenticated = false
  private var isReady = false
  private let viewCreationError = "ERR_KAKAO_MAP_VIEW_CREATION"

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(pause),
      name: UIApplication.willResignActiveNotification,
      object: nil
    )
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(resume),
      name: UIApplication.didBecomeActiveNotification,
      object: nil
    )
  }

  func updateProps() {
    if !hasInitialProps {
      hasInitialProps = true
      initialCamera = pendingInitialCamera
    }
    if isReady, camera?.values != lastCameraValues {
      if let camera {
        applyCameraProp(camera)
      }
      lastCameraValues = camera?.values
    }
    applyPendingOptionsIfReady()
    applyPendingShapesIfReady()
    applyPendingRoutesIfReady()
    applyPendingLabelsIfReady()
  }

  func queueShapes(_ scene: [String: Any]?) {
    if scene == nil, !hasUsedShapes {
      return
    }
    hasUsedShapes = true
    pendingShapes = scene ?? [:]
  }

  func queueLabels(_ scene: MapLabelSceneRecord?) {
    if scene == nil, labels == nil {
      pendingLabels = nil
      return
    }
    pendingLabels = scene ?? MapLabelSceneRecord()
  }

  func queueRoutes(_ scene: [String: Any]?) {
    if scene == nil, !hasUsedRoutes {
      return
    }
    hasUsedRoutes = true
    pendingRoutes = scene ?? [:]
  }

  func queueOptions(_ options: KakaoMapViewOptions?) {
    guard let options else { return }
    guard options.mapType == nil || options.viewInfo == nil else {
      onError([
        "code": invalidCameraArgument,
        "message": "mapType and viewInfo are mutually exclusive."
      ])
      return
    }
    let value = pendingOptions ?? KakaoMapViewOptions()
    value.merge(options)
    pendingOptions = value
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    if container?.frame != bounds {
      container?.frame = bounds
    }
    startIfNeeded()
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    guard window != nil else {
      // The SDK retains its event delegate; detach it so an unmounted view can deinitialize.
      map?.eventDelegate = nil
      pause()
      return
    }
    map?.eventDelegate = self
    startIfNeeded()
  }

  private func startIfNeeded() {
    guard !isDestroyed, window != nil, bounds.width > 0, bounds.height > 0 else { return }
    if !isStarted {
      isStarted = true
      guard KakaoMapModule.appKey != nil else {
        onError([
          "code": mapNotInitialized,
          "message": "Call initializeKakaoMapSDK before mounting the map."
        ])
        return
      }
      // Creating a zero-sized container prevents the SDK engine from preparing.
      let container = KMViewContainer(frame: bounds)
      self.container = container
      addSubview(container)
      let controller = KMController(viewContainer: container)
      self.controller = controller
      controller.delegate = self
      guard controller.prepareEngine() else {
        onError([
          "code": viewCreationError,
          "message": "Could not prepare the map engine."
        ])
        return
      }
    }
    resume()
  }

  @objc private func pause() {
    controller?.pauseEngine()
  }

  @objc private func resume() {
    if !isDestroyed, window != nil, UIApplication.shared.applicationState == .active,
       controller?.isEnginePrepared == true, controller?.isEngineActive == false
    {
      controller?.activateEngine()
    }
  }

  func addViews() {
    guard !isDestroyed else { return }
    controller?.addView(MapviewInfo(
      viewName: "kakao-map",
      viewInfoName: "map",
      defaultPosition: MapPoint(longitude: 127.108678, latitude: 37.402001),
      defaultLevel: 15
    ))
  }

  func addViewSucceeded(_ viewName: String, viewInfoName: String) {
    guard !isDestroyed, let map = controller?.getView(viewName) as? KakaoMap else { return }
    self.map = map
    currentViewInfoName = viewInfoName
    let supportedLanguages = map.getSupportedLanguages()
    if !supportedLanguages.contains(currentLanguage) {
      currentLanguage = supportedLanguages.contains("ko") ? "ko" : supportedLanguages.first ?? ""
    }
    if !currentLanguage.isEmpty {
      map.setLanguage(currentLanguage)
    }
    map.eventDelegate = window != nil ? self : nil
    containerDidResized(bounds.size)
    notifyReady()
  }

  private func notifyReady() {
    guard !isDestroyed, !isReady, isAuthenticated, map != nil else { return }
    isReady = true
    if let camera = camera ?? initialCamera {
      applyCameraProp(camera)
    }
    lastCameraValues = camera?.values
    applyPendingOptionsIfReady()
    applyPendingShapesIfReady()
    applyPendingRoutesIfReady()
    applyPendingLabelsIfReady()
    onMapReady([:])
  }

  func addViewFailed(_ viewName: String, viewInfoName: String) {
    guard !isDestroyed else { return }
    onError(["code": viewCreationError, "message": "Could not create the map view."])
  }

  func authenticationFailed(_ errorCode: Int, desc: String) {
    guard !isDestroyed else { return }
    releaseMapObjects()
    map?.eventDelegate = nil
    map = nil
    isReady = false
    isAuthenticated = false
    onError(["code": String(errorCode), "message": desc])
  }

  func authenticationSucceeded() {
    isAuthenticated = true
    resume()
    notifyReady()
  }

  func containerDidResized(_ size: CGSize) {
    guard let map, map.viewRect.size != size else { return }
    map.viewRect = CGRect(origin: .zero, size: size)
  }

  func moveCamera(_ camera: CameraOptions, duration: Double) throws {
    let map = try requireMap()
    try dispatchCameraUpdate(camera.update(for: map), on: map, duration: duration)
  }

  private func dispatchCameraUpdate(
    _ update: CameraUpdate,
    on map: KakaoMap,
    duration: Double
  ) throws {
    guard duration.isFinite, duration >= 0, duration <= Double(Int32.max),
          duration.rounded() == duration
    else {
      throw KakaoMapException(
        invalidCameraArgument,
        "Duration must be an integer between 0 and 2147483647 milliseconds."
      )
    }
    cameraCommands?.supersedePendingOperations()
    if duration == 0 {
      map.moveCamera(update)
    } else {
      map.animateCamera(
        cameraUpdate: update,
        options: CameraAnimationOptions(
          autoElevation: false,
          consecutive: false,
          durationInMillis: UInt(duration)
        )
      )
    }
  }

  func getCamera() throws -> [String: Any] {
    try cameraPayload(requireMap())
  }

  func updateCamera(_ options: CameraUpdateOptions, duration: Double) throws {
    let map = try requireMap()
    try dispatchCameraUpdate(options.update(for: map), on: map, duration: duration)
  }

  func getMapInfo() throws -> [String: Any] {
    let map = try requireMap()
    return [
      "mapType": currentViewInfoName == "skyview" ? "skyview" : "normal",
      "viewInfoName": currentViewInfoName,
      "zoomRange": ["min": map.cameraMinLevel, "max": map.cameraMaxLevel],
      "padding": [
        "top": map.margins.top,
        "right": map.margins.right,
        "bottom": map.margins.bottom,
        "left": map.margins.left
      ],
      "size": ["width": map.viewRect.width, "height": map.viewRect.height],
      "viewport": [
        "x": map.viewRect.origin.x,
        "y": map.viewRect.origin.y,
        "width": map.viewRect.width,
        "height": map.viewRect.height
      ],
      "language": currentLanguage,
      "supportedLanguages": map.getSupportedLanguages(),
      "capabilities": ["coordinateToScreen": false]
    ]
  }

  func screenToCoordinate(_ point: MapScreenPoint) throws -> [String: Double] {
    let map = try requireMap()
    guard point.x.isFinite, point.y.isFinite,
          point.x >= 0, point.y >= 0,
          point.x <= map.viewRect.width, point.y <= map.viewRect.height
    else {
      throw KakaoMapException(
        invalidCameraArgument,
        "Screen point must be finite and inside the map view."
      )
    }
    let coordinate = map.getPosition(CGPoint(x: point.x, y: point.y)).wgsCoord
    return ["latitude": coordinate.latitude, "longitude": coordinate.longitude]
  }

  func clearCache() throws {
    _ = try requireMap()
    guard let controller else {
      throw KakaoMapException("ERR_KAKAO_MAP_NOT_READY", "The map controller is unavailable.")
    }
    controller.clearMemoryCache("kakao-map")
    controller.clearDiskCache()
    controller.clearViewInfoCaches()
  }

  func executeCameraCommand(_ command: [String: Any]) throws -> [String: Any] {
    let map = try requireMap()
    if let cameraCommands {
      return try cameraCommands.command(command)
    }
    let manager = MapCameraCommands(map: map) { [weak self] payload in
      guard let self, !isDestroyed else { return }
      onCameraOperation(payload)
    }
    cameraCommands = manager
    return try manager.command(command)
  }

  func runLabelCommand(_ command: MapLabelCommandRecord) throws {
    try requireLabels().command(command)
  }

  func getLabelCapabilities() throws -> [String: Any] {
    try requireLabels().capabilities()
  }

  func getLabelState() throws -> [String: Any] {
    try requireLabels().state()
  }

  func applyShapes(_ scene: [String: Any]) throws -> [String: Any] {
    pendingShapes = nil
    let counts = try requireShapes().apply(scene)
    hasUsedShapes = true
    if !isDestroyed {
      onShapesChanged(counts)
    }
    return counts
  }

  func executeShapeCommand(_ command: [String: Any]) throws -> [String: Any] {
    try requireShapes().command(command)
  }

  private func requireShapes() throws -> MapShapes {
    let map = try requireMap()
    if let shapes {
      return shapes
    }
    let shapes = MapShapes(map: map) { [weak self] event, payload in
      guard let self, !isDestroyed else { return }
      if event == "onShapeAnimationStop" {
        onShapeAnimationStop(payload)
      }
    }
    self.shapes = shapes
    return shapes
  }

  private func requireLabels() throws -> MapLabels {
    let map = try requireMap()
    if let labels {
      return labels
    }
    let loader = requireImageLoader()
    let labels = MapLabels(
      map: map,
      imageLoader: loader,
      emitClick: { [weak self] event in
        guard let self, !isDestroyed else { return }
        onLabelClick(event)
      },
      emitAnimationStopped: { [weak self] event in
        guard let self, !isDestroyed else { return }
        onLabelAnimationStopped(event)
      },
      resolveShape: { [weak self] id in
        self?.shapes?.resolveShape(id)
      }
    )
    self.labels = labels
    return labels
  }

  func applyRoutes(_ scene: [String: Any], promise: Promise) throws {
    pendingRoutes = nil
    hasUsedRoutes = true
    routeGeneration += 1
    let generation = routeGeneration
    try requireRoutes().apply(scene) { [weak self] result in
      switch result {
      case let .success(counts):
        if let self, !isDestroyed, generation == routeGeneration {
          onRoutesChanged(counts)
        }
        promise.resolve(counts)
      case let .failure(error):
        promise.reject(error)
      }
    }
  }

  func executeRouteCommand(_ command: [String: Any]) throws -> [String: Any] {
    try requireRoutes().command(command)
  }

  private func requireRoutes() throws -> MapRoutes {
    let map = try requireMap()
    if let routes {
      return routes
    }
    let manager = MapRoutes(
      map: map,
      imageLoader: requireImageLoader()
    ) { [weak self] event, payload in
      guard let self, !isDestroyed else { return }
      switch event {
      case "onRouteProgress": onRouteProgress(payload)
      case "onRouteAnimationStop": onRouteAnimationStop(payload)
      default: break
      }
    }
    routes = manager
    return manager
  }

  private func requireImageLoader() -> MapImageLoader {
    if let imageLoader {
      return imageLoader
    }
    let loader = MapImageLoader(appContext: appContext)
    imageLoader = loader
    return loader
  }

  private func applyPendingRoutesIfReady() {
    guard isReady, let scene = pendingRoutes else { return }
    pendingRoutes = nil
    routeGeneration += 1
    let generation = routeGeneration
    do {
      try requireRoutes().apply(scene) { [weak self] result in
        guard let self, !isDestroyed, generation == routeGeneration else { return }
        switch result {
        case let .success(counts): onRoutesChanged(counts)
        case let .failure(error): reportObjectError(error, fallbackCode: "ERR_KAKAO_MAP_ROUTE")
        }
      }
    } catch {
      reportObjectError(error, fallbackCode: "ERR_KAKAO_MAP_ROUTE")
    }
  }

  private func reportObjectError(_ error: Error, fallbackCode: String) {
    if let error = error as? Exception {
      onError(["code": error.code, "message": error.reason])
    } else {
      onError(["code": fallbackCode, "message": error.localizedDescription])
    }
  }

  private func applyPendingLabelsIfReady() {
    guard isReady, let scene = pendingLabels else { return }
    pendingLabels = nil
    let previousGeneration = labelGeneration
    labelGeneration += 1
    let generation = labelGeneration
    do {
      try requireLabels().apply(scene) { [weak self] result in
        guard let self, !isDestroyed, generation == labelGeneration else { return }
        switch result {
        case .success:
          if let labels {
            onLabelsChanged(labels.state())
          }
        case let .failure(error):
          reportLabelError(error)
        }
      }
    } catch {
      if labelGeneration == generation {
        labelGeneration = previousGeneration
      }
      reportLabelError(error)
    }
  }

  private func reportLabelError(_ error: Error) {
    if let error = error as? Exception {
      onError(["code": error.code, "message": error.reason])
    } else {
      onError(["code": "ERR_KAKAO_MAP_LABEL", "message": error.localizedDescription])
    }
  }

  private func applyPendingShapesIfReady() {
    guard isReady, let scene = pendingShapes else { return }
    pendingShapes = nil
    do {
      _ = try applyShapes(scene)
    } catch {
      reportShapeError(error)
    }
  }

  private func reportShapeError(_ error: Error) {
    if let error = error as? Exception {
      onError(["code": error.code, "message": error.reason])
    } else {
      onError(["code": "ERR_KAKAO_MAP_SHAPE", "message": error.localizedDescription])
    }
  }

  private func releaseMapObjects() {
    labelGeneration += 1
    routeGeneration += 1
    cameraCommands?.dispose()
    cameraCommands = nil
    labels?.dispose()
    labels = nil
    routes?.dispose()
    routes = nil
    shapes?.dispose()
    shapes = nil
    imageLoader?.dispose()
    imageLoader = nil
  }

  private func applyPendingOptionsIfReady() {
    guard isReady, let map, let pendingOptions else { return }
    self.pendingOptions = nil
    let target = appliedOptions.copy()
    target.merge(pendingOptions)
    do {
      try validate(target, for: map)
      apply(target.difference(from: appliedOptions), to: map)
      appliedOptions = target
    } catch let error as Exception {
      onError(["code": error.code, "message": error.reason])
    } catch {
      onError(["code": invalidCameraArgument, "message": error.localizedDescription])
    }
  }

  private func validate(_ options: KakaoMapViewOptions, for map: KakaoMap) throws {
    if options.mapType != nil, options.viewInfo != nil {
      throw KakaoMapException(
        invalidCameraArgument,
        "mapType and viewInfo are mutually exclusive."
      )
    }
    if let mapType = options.mapType, mapType != "normal", mapType != "skyview" {
      throw KakaoMapException(invalidCameraArgument, "Invalid map type.")
    }
    if let viewInfo = options.viewInfo {
      guard !viewInfo.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
            viewInfo.appName?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty != true
      else {
        throw KakaoMapException(invalidCameraArgument, "View info names must not be empty.")
      }
    }
    if let overlays = options.overlays {
      for overlay in overlays {
        _ = try overlayID(overlay)
      }
    }
    if let overlays = options.customOverlays,
       overlays.contains(where: { $0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty })
    {
      throw KakaoMapException(invalidCameraArgument, "Custom overlay IDs must not be empty.")
    }
    if let language = options.language, !map.getSupportedLanguages().contains(language) {
      throw KakaoMapException(
        invalidCameraArgument,
        "The map does not support language '\(language)'."
      )
    }
    if let scale = options.poi?.scale {
      _ = try poiScale(scale)
    }
    if let scale = options.buildingScale,
       !scale.isFinite || !(0 ... 1).contains(scale)
    {
      throw KakaoMapException(invalidCameraArgument, "Building scale must be between 0 and 1.")
    }
    if let padding = options.padding {
      let values = [padding.top, padding.right, padding.bottom, padding.left]
      guard values.allSatisfy({ $0.isFinite && $0 >= 0 }) else {
        throw KakaoMapException(
          invalidCameraArgument,
          "Map padding must contain non-negative values."
        )
      }
    }
    if let range = options.zoomRange {
      guard range.min.isFinite, range.max.isFinite,
            range.min.rounded() == range.min, range.max.rounded() == range.max,
            range.min >= Double(map.minLevel), range.max <= Double(map.maxLevel),
            range.min <= range.max
      else {
        throw KakaoMapException(invalidCameraArgument, "Invalid map zoom range.")
      }
    }
    if let gestures = options.gestures {
      for gesture in gestures.keys {
        _ = try gestureType(gesture)
      }
    }
    _ = try options.compass?.position?.values()
    _ = try options.scaleBar?.position?.values()
    _ = try options.logo?.values()
    if let fade = options.scaleBar?.fade {
      _ = try duration(fade.inDuration)
      _ = try duration(fade.outDuration)
      _ = try duration(fade.retentionDuration)
    }
  }

  private func apply(_ options: KakaoMapViewOptions, to map: KakaoMap) {
    if let viewInfo = options.viewInfo {
      map.changeViewInfo(appName: viewInfo.appName ?? "openmap", viewInfoName: viewInfo.name)
    } else if let mapType = options.mapType {
      map.changeViewInfo(
        appName: "openmap",
        viewInfoName: mapType == "skyview" ? "skyview" : "map"
      )
    }

    let previousOverlays = semanticOverlays.union(customOverlays)
    if let overlays = options.overlays {
      semanticOverlays = Set(overlays.compactMap { try? overlayID($0) })
    }
    if let overlays = options.customOverlays {
      customOverlays = Set(overlays)
    }
    let nextOverlays = semanticOverlays.union(customOverlays)
    for overlay in previousOverlays.subtracting(nextOverlays) {
      map.hideOverlay(overlay)
    }
    for overlay in nextOverlays.subtracting(previousOverlays) {
      map.showOverlay(overlay)
    }

    if let language = options.language {
      map.setLanguage(language)
      currentLanguage = language
    }
    if let visible = options.poi?.visible {
      map.setPoiEnabled(visible)
    }
    if let clickable = options.poi?.clickable {
      map.poiClickable = clickable
    }
    if let scale = options.poi?.scale, let value = try? poiScale(scale) {
      map.poiScale = value
    }
    if let scale = options.buildingScale {
      map.buildingScale = Float(scale)
    }
    if let padding = options.padding {
      map.setMargins(UIEdgeInsets(
        top: padding.top,
        left: padding.left,
        bottom: padding.bottom,
        right: padding.right
      ))
    }
    if let range = options.zoomRange {
      let minLevel = Int(range.min)
      let maxLevel = Int(range.max)
      if minLevel > map.cameraMaxLevel {
        map.cameraMaxLevel = maxLevel
      } else if maxLevel < map.cameraMinLevel {
        map.cameraMinLevel = minLevel
      }
      map.cameraMinLevel = minLevel
      map.cameraMaxLevel = maxLevel
    }
    if let gestures = options.gestures {
      for (gesture, isEnabled) in gestures {
        if let value = try? gestureType(gesture) {
          map.setGestureEnable(type: value, enable: isEnabled)
        }
      }
    }
    if let compass = options.compass {
      if let visible = compass.visible {
        visible ? map.showCompass() : map.hideCompass()
      }
      if let position = compass.position, let (origin, offset) = try? position.values() {
        map.setCompassPosition(origin: origin, position: offset)
      }
    }
    if let scaleBar = options.scaleBar {
      if let visible = scaleBar.visible {
        visible ? map.showScaleBar() : map.hideScaleBar()
      }
      if let position = scaleBar.position, let (origin, offset) = try? position.values() {
        map.setScaleBarPosition(origin: origin, position: offset)
      }
      if let autoHide = scaleBar.autoHide {
        map.setScaleBarAutoDisappear(autoHide)
      }
      if let fade = scaleBar.fade,
         let fadeIn = try? duration(fade.inDuration),
         let fadeOut = try? duration(fade.outDuration),
         let retention = try? duration(fade.retentionDuration)
      {
        map.setScaleBarFadeInOutOption(FadeInOutOptions(
          fadeInTime: fadeIn,
          fadeOutTime: fadeOut,
          retentionTime: retention
        ))
      }
    }
    if let logo = options.logo, let (origin, offset) = try? logo.values() {
      map.setLogoPosition(origin: origin, position: offset)
    }
  }

  private func overlayID(_ overlay: String) throws -> String {
    switch overlay {
    case "roadviewLine": "roadview_line"
    case "hillShading": "hill_shading"
    case "bicycleRoad": "bicycle_road"
    case "hybrid": "hybrid"
    default: throw KakaoMapException(invalidCameraArgument, "Invalid map overlay.")
    }
  }

  private func poiScale(_ scale: String) throws -> PoiScaleType {
    switch scale {
    case "small": .small
    case "regular": .regular
    case "large": .large
    case "xLarge": .xLarge
    default: throw KakaoMapException(invalidCameraArgument, "Invalid map POI scale.")
    }
  }

  private func gestureType(_ gesture: String) throws -> GestureType {
    switch gesture {
    case "doubleTapZoomIn": .doubleTapZoomIn
    case "twoFingerTapZoomOut": .twoFingerTapZoomOut
    case "pan": .pan
    case "rotate": .rotate
    case "zoom": .zoom
    case "tilt": .tilt
    case "longTapAndDrag": .longTapAndDrag
    case "rotateZoom": .rotateZoom
    case "oneFingerZoom": .oneFingerZoom
    default: throw KakaoMapException(invalidCameraArgument, "Invalid map gesture.")
    }
  }

  private func duration(_ value: Double) throws -> UInt32 {
    guard value.isFinite, value >= 0, value <= Double(UInt32.max), value.rounded() == value else {
      throw KakaoMapException(
        invalidCameraArgument,
        "Widget durations must be integer milliseconds between 0 and \(UInt32.max)."
      )
    }
    return UInt32(value)
  }

  private func requireMap() throws -> KakaoMap {
    if isDestroyed {
      throw KakaoMapException(
        "ERR_KAKAO_MAP_VIEW_DESTROYED",
        "The map view was destroyed."
      )
    }
    if KakaoMapModule.appKey == nil {
      throw KakaoMapException(
        mapNotInitialized,
        "Initialize the map SDK first."
      )
    }
    guard isReady, let map else { throw KakaoMapException(
      "ERR_KAKAO_MAP_NOT_READY",
      "Wait for onMapReady before calling map methods."
    ) }
    return map
  }

  private func applyCameraProp(_ camera: CameraOptions) {
    do {
      try moveCamera(camera, duration: 0)
    } catch let error as Exception {
      onError(["code": error.code, "message": error.reason])
    } catch {
      onError(["code": "ERR_KAKAO_MAP_CAMERA", "message": error.localizedDescription])
    }
  }

  private func cameraPayload(_ map: KakaoMap) -> [String: Any] {
    let margins = map.margins
    let point = map.getPosition(CGPoint(
      x: (margins.left + map.viewRect.width - margins.right) / 2,
      y: (margins.top + map.viewRect.height - margins.bottom) / 2
    ))
    let rotation = map.rotationAngle * 180 / .pi
    return [
      "latitude": point.wgsCoord.latitude,
      "longitude": point.wgsCoord.longitude,
      "zoomLevel": map.zoomLevel,
      "tilt": map.tiltAngle * 180 / .pi,
      "rotation": (rotation.truncatingRemainder(dividingBy: 360) + 360)
        .truncatingRemainder(dividingBy: 360)
    ]
  }

  func cameraWillMove(kakaoMap: KakaoMap, by: MoveBy) {
    if !isDestroyed {
      if by != .notUserAction {
        cameraCommands?.supersedePendingOperations()
      }
      onCameraMoveStart(["reason": reason(by)])
    }
  }

  func cameraDidStopped(kakaoMap: KakaoMap, by: MoveBy) {
    if !isDestroyed {
      onCameraIdle(["reason": reason(by), "camera": cameraPayload(kakaoMap)])
    }
  }

  func kakaoMapDidTapped(kakaoMap: KakaoMap, point: CGPoint) {
    guard !isDestroyed else { return }
    let coordinate = kakaoMap.getPosition(point).wgsCoord
    onMapClick([
      "latitude": coordinate.latitude,
      "longitude": coordinate.longitude,
      "x": point.x,
      "y": point.y
    ])
  }

  func terrainDidTapped(kakaoMap: KakaoMap, position: MapPoint) {
    guard !isDestroyed else { return }
    let point = position.wgsCoord
    onTerrainClick(["latitude": point.latitude, "longitude": point.longitude])
  }

  func kakaoMapFocusDidChanged(kakaoMap: KakaoMap, focus: Bool) {
    guard !isDestroyed else { return }
    onFocusChanged(["focused": focus])
  }

  func terrainDidLongPressed(kakaoMap: KakaoMap, position: MapPoint) {
    guard !isDestroyed else { return }
    onMapLongClick([
      "latitude": position.wgsCoord.latitude,
      "longitude": position.wgsCoord.longitude
    ])
  }

  func poiDidTapped(kakaoMap: KakaoMap, layerID: String, poiID: String, position: MapPoint) {
    guard !isDestroyed else { return }
    if labels?.handlesPoiTap(layerId: layerID, id: poiID) == true {
      return
    }
    onPoiClick([
      "latitude": position.wgsCoord.latitude,
      "longitude": position.wgsCoord.longitude,
      "id": poiID,
      "layerId": layerID
    ])
  }

  func kakaoMapMarginDidUpdated(_ kakaoMap: KakaoMap) {
    guard !isDestroyed else { return }
    onPaddingChanged([
      "top": kakaoMap.margins.top,
      "right": kakaoMap.margins.right,
      "bottom": kakaoMap.margins.bottom,
      "left": kakaoMap.margins.left
    ])
  }

  func kakaoMapDidResized(_ kakaoMap: KakaoMap) {
    guard !isDestroyed else { return }
    let size = kakaoMap.viewRect.size
    guard lastEmittedViewportSize != size else { return }
    lastEmittedViewportSize = size
    onViewportChanged([
      "x": kakaoMap.viewRect.origin.x,
      "y": kakaoMap.viewRect.origin.y,
      "width": size.width,
      "height": size.height
    ])
  }

  func compassDidTapped(kakaoMap: KakaoMap) {
    if !isDestroyed {
      onCompassClick([:])
    }
  }

  func onViewInfoChanged(kakaoMap: KakaoMap, viewInfoName: String) {
    guard !isDestroyed else { return }
    currentViewInfoName = viewInfoName
    onMapTypeChanged(["viewInfoName": viewInfoName])
  }

  func onViewInfoChangeFailure(kakaoMap: KakaoMap, viewInfoName: String) {
    if !isDestroyed {
      onError([
        "code": "ERR_KAKAO_MAP_VIEW_INFO_CHANGE",
        "message": "Could not change the map view info to '\(viewInfoName)'."
      ])
    }
  }

  private func reason(_ by: MoveBy) -> String {
    by == .notUserAction ? "developer" : "gesture"
  }

  deinit {
    isDestroyed = true
    releaseMapObjects()
    NotificationCenter.default.removeObserver(self)
    map?.eventDelegate = nil
    controller?.delegate = nil
    controller?.pauseEngine()
    controller?.resetEngine()
  }
}
