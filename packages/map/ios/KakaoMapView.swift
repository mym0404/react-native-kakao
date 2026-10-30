import ExpoModulesCore
import KakaoMapsSDK

final class KakaoMapView: ExpoView, MapControllerDelegate, KakaoMapEventDelegate {
  let onMapReady = EventDispatcher()
  let onError = EventDispatcher()
  let onCameraMoveStart = EventDispatcher()
  let onCameraIdle = EventDispatcher()
  let onMapClick = EventDispatcher()
  var pendingInitialCamera: CameraOptions?
  var camera: CameraOptions?
  private var initialCamera: CameraOptions?
  private var lastCameraValues: [Double]?
  private var hasInitialProps = false
  private var container: KMViewContainer?
  private var controller: KMController?
  private var map: KakaoMap?
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
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    container?.frame = bounds
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
    onMapReady([:])
  }

  func addViewFailed(_ viewName: String, viewInfoName: String) {
    guard !isDestroyed else { return }
    onError(["code": viewCreationError, "message": "Could not create the map view."])
  }

  func authenticationFailed(_ errorCode: Int, desc: String) {
    guard !isDestroyed else { return }
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
    map?.viewRect = CGRect(origin: .zero, size: size)
  }

  func moveCamera(_ camera: CameraOptions, duration: Double) throws {
    let map = try requireMap()
    guard duration.isFinite, duration >= 0, duration <= Double(Int32.max),
          duration.rounded() == duration
    else {
      throw KakaoMapException(
        invalidCameraArgument,
        "Duration must be an integer between 0 and 2147483647 milliseconds."
      )
    }
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

  func getCamera() throws -> [String: Any] {
    try cameraPayload(requireMap())
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
    let point = map.getPosition(CGPoint(x: map.viewRect.width / 2, y: map.viewRect.height / 2))
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

  private func reason(_ by: MoveBy) -> String {
    by == .notUserAction ? "developer" : "gesture"
  }

  deinit {
    isDestroyed = true
    NotificationCenter.default.removeObserver(self)
    map?.eventDelegate = nil
    controller?.delegate = nil
    controller?.pauseEngine()
    controller?.resetEngine()
  }
}
