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
        "onShapeAnimationStop",
        "onShapesChanged",
        "onRoutesChanged",
        "onRouteProgress",
        "onRouteAnimationStop",
        "onGuiEvent",
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
      Prop("shapes") { (view: KakaoMapView, scene: [String: Any]?) in
        view.queueShapes(scene)
      }
      Prop("routes") { (view: KakaoMapView, scene: [String: Any]?) in view.queueRoutes(scene) }
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
      AsyncFunction("applyShapes") { (view: KakaoMapView, scene: [String: Any]) in
        try view.applyShapes(scene)
      }
      AsyncFunction("executeShapeCommand") { (view: KakaoMapView, command: [String: Any]) in
        try view.executeShapeCommand(command)
      }
      AsyncFunction("applyRoutes") { (view: KakaoMapView, scene: [String: Any], promise: Promise) in
        try view.applyRoutes(scene, promise: promise)
      }
      AsyncFunction("executeRouteCommand") { (view: KakaoMapView, command: [String: Any]) in
        try view.executeRouteCommand(command)
      }
      AsyncFunction("applyGui") { (
        view: KakaoMapView,
        scene: MapGuiSceneRecord,
        promise: Promise
      ) in
        try view.requireGui().apply(scene) { error in
          if let error {
            promise.reject(error)
          } else {
            promise.resolve()
          }
        }
      }
      AsyncFunction("showInfoWindow") { (
        view: KakaoMapView,
        id: String,
        autoMove: Bool,
        duration: Double?
      ) in
        try view.requireGui().showInfoWindow(id: id, autoMove: autoMove, duration: duration)
      }
      AsyncFunction("hideInfoWindow") { (view: KakaoMapView, id: String) in
        try view.requireGui().hideInfoWindow(id: id)
      }
      AsyncFunction("moveInfoWindow") { (
        view: KakaoMapView,
        id: String,
        position: MapGuiCoordinateRecord,
        duration: Double
      ) in
        try view.requireGui().moveInfoWindow(id: id, position: position, duration: duration)
      }
      AsyncFunction("showWidget") { (view: KakaoMapView, id: String) in
        try view.requireGui().showWidget(id: id)
      }
      AsyncFunction("hideWidget") { (view: KakaoMapView, id: String) in
        try view.requireGui().hideWidget(id: id)
      }
      AsyncFunction("positionWidget") { (
        view: KakaoMapView,
        id: String,
        position: MapGuiWidgetPositionRecord
      ) in
        try view.requireGui().positionWidget(id: id, position: position)
      }
      AsyncFunction("rotateWidget") { (view: KakaoMapView, id: String, rotation: Double) in
        try view.requireGui().rotateWidget(id: id, rotation: rotation)
      }
      AsyncFunction("startGuiAnimation") { (view: KakaoMapView, id: String) in
        try view.requireGui().startAnimation(id: id)
      }
      AsyncFunction("stopGuiAnimation") { (view: KakaoMapView, id: String) in
        try view.requireGui().stopAnimation(id: id)
      }
      AsyncFunction("controlAnimatedImage") { (
        view: KakaoMapView,
        ownerType: String,
        ownerId: String,
        componentId: String,
        action: String
      ) in
        try view.requireGui().controlAnimatedImage(
          ownerType: ownerType,
          ownerId: ownerId,
          componentId: componentId,
          action: action
        )
      }
      AsyncFunction("getGuiStatus") { (view: KakaoMapView) in try view.requireGui().status() }
      AsyncFunction("executeCameraCommand") { (view: KakaoMapView, command: [String: Any]) in
        try view.executeCameraCommand(command)
      }
    }
  }
}
