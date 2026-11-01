import ExpoModulesCore
import KakaoMapsSDK
import UIKit

private let roadViewNotReady = "ERR_KAKAO_ROADVIEW_NOT_READY"
private let roadViewRequestCancelled = "ERR_KAKAO_ROADVIEW_REQUEST_CANCELLED"
private let unsupportedRoadViewFeature = "ERR_KAKAO_MAP_UNSUPPORTED_PLATFORM_FEATURE"
private let roadViewMapName = "roadview-map"
private let roadViewName = "roadview"
private let roadViewCreationTimeout = "ERR_KAKAO_ROADVIEW_CREATION_TIMEOUT"

struct RoadViewCoordinate: Record {
  @Field(.required) var latitude: Double = .nan
  @Field(.required) var longitude: Double = .nan

  func point() throws -> MapPoint {
    guard latitude.isFinite, longitude.isFinite,
          (-90 ... 90).contains(latitude), (-180 ... 180).contains(longitude)
    else {
      throw KakaoMapException(invalidCameraArgument, "Invalid roadview coordinate.")
    }
    return MapPoint(longitude: longitude, latitude: latitude)
  }
}

struct RoadViewSearchRange: Record {
  @Field(.required) var primary: Double = .nan
  @Field(.required) var extended: Double = .nan
}

struct RoadViewLookAtRecord: Record {
  @Field(.required) var type: String = ""
  @Field var coordinate: RoadViewCoordinate?
  @Field var pan: Double?
  @Field var tilt: Double?

  func native() throws -> RoadviewLookAt {
    switch type {
    case "coordinate":
      guard let coordinate else {
        throw KakaoMapException(invalidCameraArgument, "Coordinate look-at requires a coordinate.")
      }
      return try RoadviewLookAt(position: coordinate.point())
    case "orientation":
      guard let pan, let tilt, pan.isFinite, tilt.isFinite else {
        throw KakaoMapException(
          invalidCameraArgument,
          "Orientation look-at requires finite angles."
        )
      }
      return RoadviewLookAt(pan: pan * .pi / 180, tilt: tilt * .pi / 180)
    default:
      throw KakaoMapException(invalidCameraArgument, "Unsupported roadview look-at type.")
    }
  }
}

struct RoadViewImageRecord: Record {
  @Field(.required) var uri: String = ""
  @Field var width: Double?
  @Field var height: Double?

  func validate() throws {
    guard !uri.isEmpty else {
      throw KakaoMapException(invalidCameraArgument, "Roadview marker image URI must not be empty.")
    }
    _ = try width.map { try positiveImageSize($0, name: "image.width") }
    _ = try height.map { try positiveImageSize($0, name: "image.height") }
  }

  func resized(_ source: UIImage) throws -> UIImage {
    guard width != nil || height != nil else { return source }
    let requestedWidth = try width.map { try positiveImageSize($0, name: "image.width") }
    let requestedHeight = try height.map { try positiveImageSize($0, name: "image.height") }
    guard source.size.width > 0, source.size.height > 0 else {
      throw KakaoMapException(invalidCameraArgument, "The roadview marker image has no dimensions.")
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

struct RoadViewMarkerRecord: Record {
  @Field(.required) var type: String = ""
  @Field var coordinate: RoadViewCoordinate?
  @Field var directionAngle: Double?
  @Field var pan: Double?
  @Field var tilt: Double?
  @Field var image: RoadViewImageRecord?

  func validate() throws {
    switch type {
    case "coordinate":
      guard let coordinate else {
        throw KakaoMapException(invalidCameraArgument, "Coordinate marker requires a coordinate.")
      }
      _ = try coordinate.point()
      if directionAngle != nil {
        throw KakaoMapException(
          unsupportedRoadViewFeature,
          "Coordinate marker direction angles are available on Android only."
        )
      }
    case "orientation":
      guard let pan, let tilt, pan.isFinite, tilt.isFinite else {
        throw KakaoMapException(invalidCameraArgument, "Orientation marker requires finite angles.")
      }
    default:
      throw KakaoMapException(invalidCameraArgument, "Unsupported roadview marker type.")
    }
    try image?.validate()
  }

  func native(image: UIImage?) throws -> PanoramaMarker {
    try validate()
    let marker: PanoramaMarker
    switch type {
    case "coordinate":
      guard let coordinate else {
        throw KakaoMapException(invalidCameraArgument, "Coordinate marker requires a coordinate.")
      }
      if directionAngle != nil {
        throw KakaoMapException(
          unsupportedRoadViewFeature,
          "Coordinate marker direction angles are available on Android only."
        )
      }
      marker = try PanoramaMarker(position: coordinate.point())
    case "orientation":
      guard let pan, let tilt, pan.isFinite, tilt.isFinite else {
        throw KakaoMapException(invalidCameraArgument, "Orientation marker requires finite angles.")
      }
      marker = PanoramaMarker(pan: pan * .pi / 180, tilt: tilt * .pi / 180)
    default:
      throw KakaoMapException(invalidCameraArgument, "Unsupported roadview marker type.")
    }
    if let imageRecord = self.image {
      guard let image else {
        throw KakaoMapException(invalidCameraArgument, "The roadview marker image was not loaded.")
      }
      marker.symbol = try imageRecord.resized(image)
    } else {
      marker.symbol = image
    }
    return marker
  }
}

struct RoadViewRequestRecord: Record {
  @Field var coordinate: RoadViewCoordinate?
  @Field var panoramaId: String?
  @Field var searchRange: RoadViewSearchRange?
  @Field var lookAt: RoadViewLookAtRecord?
  @Field var markers: [RoadViewMarkerRecord]?

  func validate() throws {
    guard coordinate != nil else {
      throw KakaoMapException(
        invalidCameraArgument,
        "The iOS SDK requires a coordinate for every roadview request."
      )
    }
    _ = try coordinate?.point()
    if panoramaId?.isEmpty == true {
      throw KakaoMapException(invalidCameraArgument, "Panorama ID must not be empty.")
    }
    if let searchRange {
      guard searchRange.primary.isFinite, searchRange.extended.isFinite,
            searchRange.primary >= 0, searchRange.extended >= searchRange.primary
      else {
        throw KakaoMapException(invalidCameraArgument, "Invalid roadview search range.")
      }
      // iOS uses fixed server search ranges and does not expose custom ranges.
      throw KakaoMapException(
        unsupportedRoadViewFeature,
        "Custom roadview search ranges are available on Android only."
      )
    }
    _ = try lookAt?.native()
    for marker in markers ?? [] {
      try marker.validate()
    }
  }
}

class KakaoRoadViewBase: ExpoView, MapControllerDelegate, RoadviewEventDelegate {
  var roadViewReadyDispatcher: EventDispatcher {
    fatalError("Concrete RoadView event required.")
  }

  var errorDispatcher: EventDispatcher {
    fatalError("Concrete RoadView event required.")
  }

  var roadViewResultDispatcher: EventDispatcher {
    fatalError("Concrete RoadView event required.")
  }

  var roadViewNoResultDispatcher: EventDispatcher {
    fatalError("Concrete RoadView event required.")
  }

  var roadViewRequestFailedDispatcher: EventDispatcher {
    fatalError("Concrete RoadView event required.")
  }

  var roadViewUpdatedDispatcher: EventDispatcher {
    fatalError("Concrete RoadView event required.")
  }

  var roadViewResizedDispatcher: EventDispatcher {
    fatalError("Concrete RoadView event required.")
  }

  var roadViewClickDispatcher: EventDispatcher {
    fatalError("Concrete RoadView event required.")
  }

  var roadViewFocusChangedDispatcher: EventDispatcher {
    fatalError("Concrete RoadView event required.")
  }

  var pendingInitialRequest: RoadViewRequestRecord? {
    didSet { dispatchInitialRequestIfReady() }
  }

  var requestedVisibility = true
  var logo: MapWidgetPositionOptions?
  var includesMap: Bool {
    false
  }

  var controller: KMController?
  var roadview: Roadview?
  var map: KakaoMap?

  private var container: KMViewContainer?
  private var isStarted = false
  private var isDestroyed = false
  private var isReady = false
  private var didEmitRoadViewReady = false
  private var didUseInitialRequest = false
  private var lastEmittedRoadViewSize: CGSize?
  private var requestGeneration = 0
  private var pendingRequestCompletion: ((Result<Void, Error>) -> Void)?
  private var imageTokens: [MapImageLoadToken] = []
  private var creationTimeoutTask: DispatchWorkItem?
  private lazy var imageLoader = MapImageLoader(appContext: appContext)

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

  override func layoutSubviews() {
    super.layoutSubviews()
    if container?.frame != bounds {
      container?.frame = bounds
    }
    layoutNativeViews(bounds.size)
    startIfNeeded()
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil {
      creationTimeoutTask?.cancel()
      creationTimeoutTask = nil
      roadview?.eventDelegate = nil
      pause()
    } else {
      roadview?.eventDelegate = self
      startIfNeeded()
      if isStarted, roadview == nil, creationTimeoutTask == nil {
        scheduleRoadViewCreationTimeout()
      }
      notifyRoadViewReadyIfAttached()
      didAttachToWindow()
    }
  }

  func updateVisibility() {
    roadview?.isEnabled = requestedVisibility
  }

  func updateLogo() throws {
    guard let logo else { return }
    let (alignment, position) = try logo.values()
    roadview?.setLogoPosition(origin: alignment, position: position)
  }

  private func startIfNeeded() {
    guard !isDestroyed, window != nil, bounds.width > 0, bounds.height > 0 else { return }
    if isStarted {
      resume()
      return
    }
    isStarted = true
    guard KakaoMapModule.appKey != nil else {
      emitError(mapNotInitialized, "Call initializeKakaoMapSDK before mounting roadview.")
      return
    }
    let container = KMViewContainer(frame: bounds)
    self.container = container
    addSubview(container)
    let controller = KMController(viewContainer: container)
    self.controller = controller
    controller.delegate = self
    guard controller.prepareEngine() else {
      emitError("ERR_KAKAO_ROADVIEW_CREATION", "Could not prepare the roadview engine.")
      return
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
    if includesMap {
      controller?.addView(MapviewInfo(
        viewName: roadViewMapName,
        viewInfoName: "map",
        defaultPosition: MapPoint(longitude: 127.108678, latitude: 37.402001),
        defaultLevel: 15
      ))
    }
    scheduleRoadViewCreationTimeout()
    controller?.addView(RoadviewInfo(
      viewName: roadViewName,
      appName: roadViewName,
      viewInfoName: roadViewName,
      enabled: true
    ))
  }

  func addViewSucceeded(_ viewName: String, viewInfoName: String) {
    guard !isDestroyed else { return }
    if viewName == roadViewMapName {
      map = controller?.getView(viewName) as? KakaoMap
      mapDidBecomeReady()
    } else if viewName == roadViewName, let roadview = controller?.getView(viewName) as? Roadview {
      creationTimeoutTask?.cancel()
      creationTimeoutTask = nil
      self.roadview = roadview
      roadview.eventDelegate = window != nil ? self : nil
      roadview.isEnabled = requestedVisibility
      do { try updateLogo() } catch { emit(error) }
      isReady = true
      layoutNativeViews(bounds.size)
      notifyRoadViewReadyIfAttached()
    }
  }

  func addViewFailed(_ viewName: String, viewInfoName: String) {
    if viewName == roadViewName {
      creationTimeoutTask?.cancel()
      creationTimeoutTask = nil
    }
    emitError("ERR_KAKAO_ROADVIEW_CREATION", "Could not create SDK view: \(viewName).")
  }

  func authenticationSucceeded() {
    resume()
  }

  func authenticationFailed(_ errorCode: Int, desc: String) {
    creationTimeoutTask?.cancel()
    creationTimeoutTask = nil
    emitError(String(errorCode), desc)
  }

  func containerDidResized(_ size: CGSize) {
    layoutNativeViews(size)
  }

  func layoutNativeViews(_ size: CGSize) {
    guard let roadview, roadview.viewRect.size != size else { return }
    roadview.viewRect = CGRect(origin: .zero, size: size)
  }

  func mapDidBecomeReady() {}
  func roadViewDidBecomeReady() {}
  func didAttachToWindow() {}

  func requestRoadView(
    _ request: RoadViewRequestRecord,
    completion: @escaping (Result<Void, Error>) -> Void
  ) {
    do {
      let roadview = try requireRoadView()
      try request.validate()
      let generation = beginImageRequest()
      pendingRequestCompletion = completion
      loadMarkerImages(request.markers ?? [], generation: generation) { [
        weak self,
        weak roadview
      ] result in
        guard let self, let roadview, !self.isDestroyed,
              generation == requestGeneration else { return }
        switch result {
        case let .success(images):
          do {
            let markers = try zip(request.markers ?? [], images).map { try $0.native(image: $1) }
            let point = try request.coordinate!.point()
            try roadview.requestRoadview(
              position: point,
              panoID: request.panoramaId,
              markers: markers,
              lookAt: request.lookAt?.native()
            )
            finishRequest(generation: generation, result: .success(()))
          } catch {
            finishRequest(generation: generation, result: .failure(error))
          }
        case let .failure(error):
          finishRequest(generation: generation, result: .failure(error))
        }
      }
    } catch {
      completion(.failure(error))
    }
  }

  func requestNext(_: RoadViewRequestRecord) throws {
    throw KakaoMapException(
      unsupportedRoadViewFeature,
      "Requesting the next roadview is available on Android only."
    )
  }

  func moveToCapture(_: Int) throws {
    throw KakaoMapException(
      unsupportedRoadViewFeature,
      "Dated roadview captures are available on Android only."
    )
  }

  func getInfo() throws -> [String: Any] {
    let roadview = try requireRoadView()
    return [
      "pan": roadview.pan * 180 / .pi,
      "tilt": roadview.tilt * 180 / .pi,
      "capabilities": [
        "coordinateDirectionMarkers": false,
        "customSearchRange": false,
        "datedCaptures": false,
        "focusEvents": true,
        "nextRequest": false,
        "noResultEvents": true,
        "mapLink": includesMap,
        "refresh": true
      ]
    ]
  }

  func refresh() throws {
    try requireRoadView().refresh()
  }

  func linkMap(_: String) throws {
    throw KakaoMapException(
      unsupportedRoadViewFeature,
      "Use KakaoMapRoadView to link a map and roadview in one SDK engine."
    )
  }

  func unlinkMap() throws {
    throw KakaoMapException(
      unsupportedRoadViewFeature,
      "Use KakaoMapRoadView to link a map and roadview in one SDK engine."
    )
  }

  func roadviewResultDidReceived(
    roadview: Roadview,
    panoID: String,
    date: String,
    position: MapPoint
  ) {
    roadViewResultDispatcher([
      "panoramaId": panoID,
      "date": date,
      "coordinate": [
        "latitude": position.wgsCoord.latitude,
        "longitude": position.wgsCoord.longitude
      ]
    ])
  }

  func noRoadviewResult(_ roadview: Roadview) {
    roadViewNoResultDispatcher([:])
  }

  func roadviewRequestDidFailed(_ roadview: Roadview) {
    roadViewRequestFailedDispatcher([
      "code": "ERR_KAKAO_ROADVIEW_REQUEST_FAILED",
      "message": "The Kakao SDK rejected the roadview request. Check service entitlement and input."
    ])
  }

  func invalidRoadviewRequest(_ roadview: Roadview) {
    roadViewRequestFailedDispatcher([
      "code": invalidCameraArgument,
      "message": "The Kakao SDK reported an invalid roadview request."
    ])
  }

  func panoramaUpdated(_ panoId: String) {
    roadViewUpdatedDispatcher(["panoramaId": panoId])
  }

  func roadviewDidResized(_ roadview: Roadview) {
    let size = roadview.viewRect.size
    guard lastEmittedRoadViewSize != size else { return }
    lastEmittedRoadViewSize = size
    roadViewResizedDispatcher(["width": size.width, "height": size.height])
  }

  func roadviewDidTapped(roadview: Roadview, point: CGPoint) {
    roadViewClickDispatcher(["x": point.x, "y": point.y])
  }

  func roadviewFocusDidChanged(roadview: Roadview, focus: Bool) {
    roadViewFocusChangedDispatcher(["focused": focus])
  }

  func destroy() {
    guard !isDestroyed else { return }
    isDestroyed = true
    beginImageRequest()
    imageLoader.dispose()
    creationTimeoutTask?.cancel()
    creationTimeoutTask = nil
    NotificationCenter.default.removeObserver(self)
    roadview?.eventDelegate = nil
    roadview?.unlinkMapView()
    controller?.delegate = nil
    controller?.pauseEngine()
    controller?.resetEngine()
    roadview = nil
    map = nil
    controller = nil
    container?.removeFromSuperview()
    container = nil
  }

  deinit {
    destroy()
  }

  private func requireRoadView() throws -> Roadview {
    if isDestroyed {
      throw KakaoMapException("ERR_KAKAO_MAP_VIEW_DESTROYED", "The roadview was destroyed.")
    }
    guard isReady, let roadview else {
      throw KakaoMapException(
        roadViewNotReady,
        "Wait for onRoadViewReady before calling roadview methods."
      )
    }
    return roadview
  }

  private func notifyRoadViewReadyIfAttached() {
    guard !isDestroyed, window != nil, isReady, roadview != nil, !didEmitRoadViewReady else {
      return
    }
    didEmitRoadViewReady = true
    roadViewDidBecomeReady()
    roadViewReadyDispatcher([:])
    dispatchInitialRequestIfReady()
  }

  private func dispatchInitialRequestIfReady() {
    guard didEmitRoadViewReady, !didUseInitialRequest, let request = pendingInitialRequest else {
      return
    }
    didUseInitialRequest = true
    requestRoadView(request) { [weak self] result in
      if case let .failure(error) = result {
        self?.emit(error)
      }
    }
  }

  private func scheduleRoadViewCreationTimeout() {
    creationTimeoutTask?.cancel()
    let task = DispatchWorkItem { [weak self] in
      guard let self, !isDestroyed, window != nil, roadview == nil else { return }
      let state = controller?.getStateDescMessage() ?? "controller unavailable"
      emitError(
        roadViewCreationTimeout,
        "The SDK did not create Roadview or report failure within its timeout. " +
          "This does not determine service entitlement. Controller state: \(state)"
      )
    }
    creationTimeoutTask = task
    DispatchQueue.main.asyncAfter(deadline: .now() + 5.5, execute: task)
  }

  @discardableResult
  private func beginImageRequest() -> Int {
    pendingRequestCompletion?(.failure(KakaoMapException(
      roadViewRequestCancelled,
      "The roadview request was replaced by a newer request."
    )))
    pendingRequestCompletion = nil
    requestGeneration += 1
    imageTokens.forEach { $0.cancel() }
    imageTokens.removeAll()
    return requestGeneration
  }

  private func finishRequest(generation: Int, result: Result<Void, Error>) {
    guard generation == requestGeneration, let completion = pendingRequestCompletion else { return }
    pendingRequestCompletion = nil
    imageTokens.removeAll()
    completion(result)
  }

  private func loadMarkerImages(
    _ markers: [RoadViewMarkerRecord],
    generation: Int,
    completion: @escaping (Result<[UIImage?], Error>) -> Void
  ) {
    guard !markers.isEmpty else {
      completion(.success([]))
      return
    }
    var images = [UIImage?](repeating: nil, count: markers.count)
    var remaining = markers.count
    var didFail = false
    for (index, marker) in markers.enumerated() {
      guard let uri = marker.image?.uri else {
        remaining -= 1
        if remaining == 0 {
          completion(.success(images))
        }
        continue
      }
      let token = imageLoader.load(uri) { [weak self] result in
        guard let self, !self.isDestroyed, generation == requestGeneration, !didFail else { return }
        switch result {
        case let .success(image):
          images[index] = image
          remaining -= 1
          if remaining == 0 {
            completion(.success(images))
          }
        case let .failure(error):
          didFail = true
          imageTokens.forEach { $0.cancel() }
          imageTokens.removeAll()
          completion(.failure(error))
        }
      }
      imageTokens.append(token)
    }
  }

  private func emit(_ error: Error) {
    if let error = error as? Exception {
      emitError(error.code, error.reason)
    } else {
      emitError("ERR_KAKAO_ROADVIEW", error.localizedDescription)
    }
  }

  private func emitError(_ code: String, _ message: String) {
    if !isDestroyed {
      errorDispatcher(["code": code, "message": message])
    }
  }
}

private func positiveImageSize(_ value: Double, name: String) throws -> CGFloat {
  guard value.isFinite, value > 0, value <= Double(Int32.max) else {
    throw KakaoMapException(invalidCameraArgument, "\(name) must be positive.")
  }
  return CGFloat(value)
}

/// Expo's iOS event installer only scans stored properties declared on each concrete view.
final class KakaoRoadView: KakaoRoadViewBase {
  let onRoadViewReady = EventDispatcher()
  let onError = EventDispatcher()
  let onRoadViewResult = EventDispatcher()
  let onRoadViewNoResult = EventDispatcher()
  let onRoadViewRequestFailed = EventDispatcher()
  let onRoadViewUpdated = EventDispatcher()
  let onRoadViewResized = EventDispatcher()
  let onRoadViewClick = EventDispatcher()
  let onRoadViewFocusChanged = EventDispatcher()

  override var roadViewReadyDispatcher: EventDispatcher {
    onRoadViewReady
  }

  override var errorDispatcher: EventDispatcher {
    onError
  }

  override var roadViewResultDispatcher: EventDispatcher {
    onRoadViewResult
  }

  override var roadViewNoResultDispatcher: EventDispatcher {
    onRoadViewNoResult
  }

  override var roadViewRequestFailedDispatcher: EventDispatcher {
    onRoadViewRequestFailed
  }

  override var roadViewUpdatedDispatcher: EventDispatcher {
    onRoadViewUpdated
  }

  override var roadViewResizedDispatcher: EventDispatcher {
    onRoadViewResized
  }

  override var roadViewClickDispatcher: EventDispatcher {
    onRoadViewClick
  }

  override var roadViewFocusChangedDispatcher: EventDispatcher {
    onRoadViewFocusChanged
  }
}

final class KakaoMapRoadView: KakaoRoadViewBase {
  let onMapReady = EventDispatcher()
  let onRoadViewReady = EventDispatcher()
  let onError = EventDispatcher()
  let onRoadViewResult = EventDispatcher()
  let onRoadViewNoResult = EventDispatcher()
  let onRoadViewRequestFailed = EventDispatcher()
  let onRoadViewUpdated = EventDispatcher()
  let onRoadViewResized = EventDispatcher()
  let onRoadViewClick = EventDispatcher()
  let onRoadViewFocusChanged = EventDispatcher()
  var layout = "vertical"
  var mapFraction = 0.5
  var shouldLink = true
  var initialCamera: CameraOptions?
  private var isMapCreated = false
  private var isMapReady = false

  override var includesMap: Bool {
    true
  }

  override var roadViewReadyDispatcher: EventDispatcher {
    onRoadViewReady
  }

  override var errorDispatcher: EventDispatcher {
    onError
  }

  override var roadViewResultDispatcher: EventDispatcher {
    onRoadViewResult
  }

  override var roadViewNoResultDispatcher: EventDispatcher {
    onRoadViewNoResult
  }

  override var roadViewRequestFailedDispatcher: EventDispatcher {
    onRoadViewRequestFailed
  }

  override var roadViewUpdatedDispatcher: EventDispatcher {
    onRoadViewUpdated
  }

  override var roadViewResizedDispatcher: EventDispatcher {
    onRoadViewResized
  }

  override var roadViewClickDispatcher: EventDispatcher {
    onRoadViewClick
  }

  override var roadViewFocusChangedDispatcher: EventDispatcher {
    onRoadViewFocusChanged
  }

  override func mapDidBecomeReady() {
    guard let map else { return }
    if let initialCamera {
      do { try map.moveCamera(initialCamera.update(for: map)) } catch { errorDispatcher([
        "code": invalidCameraArgument, "message": error.localizedDescription
      ]) }
    }
    isMapCreated = true
    notifyMapReadyIfAttached()
  }

  override func roadViewDidBecomeReady() {
    applyLinkState()
  }

  override func didAttachToWindow() {
    notifyMapReadyIfAttached()
  }

  override func layoutNativeViews(_ size: CGSize) {
    let fraction = CGFloat(mapFraction)
    if layout == "horizontal" {
      let mapWidth = size.width * fraction
      let mapRect = CGRect(x: 0, y: 0, width: mapWidth, height: size.height)
      let roadViewRect = CGRect(
        x: mapWidth,
        y: 0,
        width: size.width - mapWidth,
        height: size.height
      )
      if map?.viewRect != mapRect {
        map?.viewRect = mapRect
      }
      if roadview?.viewRect != roadViewRect {
        roadview?.viewRect = roadViewRect
      }
    } else {
      let mapHeight = size.height * fraction
      let mapRect = CGRect(x: 0, y: 0, width: size.width, height: mapHeight)
      let roadViewRect = CGRect(
        x: 0,
        y: mapHeight,
        width: size.width,
        height: size.height - mapHeight
      )
      if map?.viewRect != mapRect {
        map?.viewRect = mapRect
      }
      if roadview?.viewRect != roadViewRect {
        roadview?.viewRect = roadViewRect
      }
    }
  }

  func validateLayout() throws {
    guard ["horizontal", "vertical"].contains(layout), mapFraction > 0, mapFraction < 1 else {
      throw KakaoMapException(invalidCameraArgument, "Invalid linked map/roadview layout.")
    }
    layoutNativeViews(bounds.size)
  }

  func setLinked(_ linked: Bool) throws {
    shouldLink = linked
    try requireLinkedViews()
    applyLinkState()
  }

  override func linkMap(_ linkId: String) throws {
    guard linkId == "map" || linkId == roadViewMapName else {
      throw KakaoMapException(invalidCameraArgument, "The linked host exposes only its owned map.")
    }
    try setLinked(true)
  }

  override func unlinkMap() throws {
    try setLinked(false)
  }

  func moveMapCamera(_ camera: CameraOptions, duration: Double) throws {
    guard duration.isFinite, duration >= 0, duration <= Double(Int32.max),
          duration.rounded() == duration
    else {
      throw KakaoMapException(invalidCameraArgument, "Invalid camera duration.")
    }
    let map = try requireMap()
    let update = try camera.update(for: map)
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

  func getMapCamera() throws -> [String: Any] {
    let map = try requireMap()
    let center = map.getPosition(CGPoint(x: map.viewRect.midX, y: map.viewRect.midY)).wgsCoord
    let rotation = map.rotationAngle * 180 / .pi
    return [
      "latitude": center.latitude,
      "longitude": center.longitude,
      "zoomLevel": map.zoomLevel,
      "tilt": map.tiltAngle * 180 / .pi,
      "rotation": (rotation.truncatingRemainder(dividingBy: 360) + 360)
        .truncatingRemainder(dividingBy: 360)
    ]
  }

  private func applyLinkState() {
    guard isMapReady, roadview != nil else { return }
    if shouldLink {
      roadview?.linkMapView(roadViewMapName)
    } else {
      roadview?.unlinkMapView()
    }
  }

  private func notifyMapReadyIfAttached() {
    guard isMapCreated, !isMapReady, window != nil, map != nil else { return }
    isMapReady = true
    onMapReady([:])
    applyLinkState()
  }

  private func requireLinkedViews() throws {
    _ = try requireMap()
    guard roadview != nil else {
      throw KakaoMapException(roadViewNotReady, "Wait for onRoadViewReady before changing linkage.")
    }
  }

  private func requireMap() throws -> KakaoMap {
    guard isMapReady, let map else {
      throw KakaoMapException(
        "ERR_KAKAO_MAP_NOT_READY",
        "Wait for onMapReady before calling map methods."
      )
    }
    return map
  }
}
