package net.mjstudio.rnkakao.map

import com.kakao.vectormap.KakaoMapSdk
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class KakaoMapModule : Module() {
  override fun definition() =
    ModuleDefinition {
      Name("RNCKakaoMap")
      AsyncFunction("initialize") { key: String ->
        if (key.isBlank()) throw CodedException(INVALID_ARGUMENT, "App key must not be empty.", null)
        if (appKey != null &&
          appKey != key
        ) {
          throw CodedException("ERR_KAKAO_MAP_ALREADY_INITIALIZED", "Kakao Maps is already initialized with another key.", null)
        }
        if (appKey == null) {
          KakaoMapSdk.init(appContext.reactContext ?: throw CodedException("React context is unavailable."), key)
          appKey = key
        }
      }.runOnQueue(Queues.MAIN)
      View(KakaoMapView::class) {
        Events("onMapReady", "onError", "onCameraMoveStart", "onCameraIdle", "onMapClick")
        Prop("initialCamera") { view: KakaoMapView, camera: CameraOptions? -> view.pendingInitialCamera = camera }
        Prop("camera") { view: KakaoMapView, camera: CameraOptions? -> view.camera = camera }
        OnViewDidUpdateProps { view: KakaoMapView -> view.updateProps() }
        AsyncFunction("moveCamera") { view: KakaoMapView, camera: CameraOptions, duration: Double -> view.moveCamera(camera, duration) }
        AsyncFunction("getCamera") { view: KakaoMapView, promise: Promise -> view.getCamera(promise) }
        OnViewDestroys { view: KakaoMapView -> view.destroy() }
      }
    }

  companion object {
    var appKey: String? = null
      private set
  }
}
