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
      Events("onMapReady", "onError", "onCameraMoveStart", "onCameraIdle", "onMapClick")
      Prop("initialCamera") { (view: KakaoMapView, camera: CameraOptions?) in
        view.pendingInitialCamera = camera
      }
      Prop("camera") { (view: KakaoMapView, camera: CameraOptions?) in view.camera = camera }
      OnViewDidUpdateProps { (view: KakaoMapView) in view.updateProps() }
      AsyncFunction("moveCamera") { (view: KakaoMapView, camera: CameraOptions, duration: Double) in
        try view.moveCamera(
          camera,
          duration: duration
        )
      }
      AsyncFunction("getCamera") { (view: KakaoMapView) in try view.getCamera() }
    }
  }
}
