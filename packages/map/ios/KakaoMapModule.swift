import ExpoModulesCore
import KakaoMapsSDK

public class KakaoMapModule: Module {
  static var appKey: String?

  public func definition() -> ModuleDefinition {
    Name("RNCKakaoMap")
    AsyncFunction("initialize") { (key: String) in
      guard !key.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
        throw KakaoMapException(invalidCameraArgument, "App key must not be empty.")
      }
      if let existing = Self.appKey, existing != key {
        throw KakaoMapException(
          "ERR_KAKAO_MAP_ALREADY_INITIALIZED",
          "Kakao Maps is already initialized with another key."
        )
      }
      if Self.appKey == nil {
        SDKInitializer.InitSDK(appKey: key)
        Self.appKey = key
      }
    }.runOnQueue(.main)
    View(KakaoMapView.self) {
      Events(
        "onMapReady",
        "onError",
        "onCameraMoveStart",
        "onCameraIdle",
        "onMapClick",
        "onMapLongClick",
        "onPoiClick",
        "onCompassClick",
        "onMapTypeChanged",
        "onTerrainClick",
        "onViewportClick",
        "onVisibilityChanged",
        "onFocusChanged",
        "onPaddingChanged",
        "onViewportChanged",
        "onLabelClick",
        "onLabelAnimationStopped",
        "onLabelsChanged",
        "onCameraOperation"
      )
      Prop("initialCamera") { (view: KakaoMapView, camera: CameraOptions?) in
        view.pendingInitialCamera = camera
      }
      Prop("camera") { (view: KakaoMapView, camera: CameraOptions?) in view.camera = camera }
      Prop("options") { (view: KakaoMapView, options: KakaoMapViewOptions?) in
        view.queueOptions(options)
      }
      Prop("labels") { (view: KakaoMapView, scene: MapLabelSceneRecord?) in
        view.queueLabels(scene)
      }
      OnViewDidUpdateProps { (view: KakaoMapView) in view.updateProps() }
      AsyncFunction("moveCamera") { (view: KakaoMapView, camera: CameraOptions, duration: Double) in
        try view.moveCamera(
          camera,
          duration: duration
        )
      }
      AsyncFunction("getCamera") { (view: KakaoMapView) in try view.getCamera() }
      AsyncFunction("updateCamera") {
        (view: KakaoMapView, update: CameraUpdateOptions, duration: Double) in
        try view.updateCamera(update, duration: duration)
      }
      AsyncFunction("getMapInfo") { (view: KakaoMapView) in try view.getMapInfo() }
      AsyncFunction("screenToCoordinate") { (view: KakaoMapView, point: MapScreenPoint) in
        try view.screenToCoordinate(point)
      }
      AsyncFunction("coordinateToScreen") { (_: KakaoMapView, _: MapCoordinate) in
        throw KakaoMapException(
          "ERR_KAKAO_MAP_UNSUPPORTED_PLATFORM_FEATURE",
          "The Kakao Maps iOS SDK does not expose coordinate-to-screen projection."
        )
      }
      AsyncFunction("clearCache") { (view: KakaoMapView) in try view.clearCache() }
      AsyncFunction("runLabelCommand") { (view: KakaoMapView, command: MapLabelCommandRecord) in
        try view.runLabelCommand(command)
      }
      AsyncFunction("getLabelCapabilities") { (view: KakaoMapView) in
        try view.getLabelCapabilities()
      }
      AsyncFunction("getLabelState") { (view: KakaoMapView) in try view.getLabelState() }
      AsyncFunction("executeCameraCommand") { (view: KakaoMapView, command: [String: Any]) in
        try view.executeCameraCommand(command)
      }
    }
  }
}
