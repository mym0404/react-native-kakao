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
        Events(
          "onMapReady",
          "onError",
          "onCameraMoveStart",
          "onCameraIdle",
          "onMapClick",
          "onMapLongClick",
          "onTerrainClick",
          "onViewportClick",
          "onVisibilityChanged",
          "onFocusChanged",
          "onPoiClick",
          "onCompassClick",
          "onMapTypeChanged",
          "onPaddingChanged",
          "onViewportChanged",
          "onCameraOperation",
        )
        Prop("initialCamera") { view: KakaoMapView, camera: CameraOptions? -> view.pendingInitialCamera = camera }
        Prop("camera") { view: KakaoMapView, camera: CameraOptions? -> view.camera = camera }
        Prop("options") { view: KakaoMapView, options: MapOptionsRecord? -> view.pendingOptions = options }
        OnViewDidUpdateProps { view: KakaoMapView -> view.updateProps() }
        AsyncFunction("moveCamera") { view: KakaoMapView, camera: CameraOptions, duration: Double -> view.moveCamera(camera, duration) }
        AsyncFunction("getCamera") { view: KakaoMapView, promise: Promise -> view.getCamera(promise) }
        AsyncFunction("updateCamera") { view: KakaoMapView, update: CameraUpdateRecord, duration: Double, promise: Promise ->
          view.updateCamera(update, duration, promise)
        }
        AsyncFunction("getMapInfo") { view: KakaoMapView -> view.getMapInfo() }
        AsyncFunction("screenToCoordinate") { view: KakaoMapView, point: ScreenPointRecord -> view.screenToCoordinate(point) }
        AsyncFunction("coordinateToScreen") { view: KakaoMapView, coordinate: CoordinateRecord ->
          view.coordinateToScreen(coordinate)
        }
        AsyncFunction("clearCache") { view: KakaoMapView -> view.clearCache() }
        AsyncFunction(
          "executeCameraCommand",
        ) { view: KakaoMapView, command: Map<String, Any?>, promise: Promise -> view.executeCameraCommand(command, promise) }
        OnViewDestroys { view: KakaoMapView -> view.destroy() }
      }
    }

  companion object {
    var appKey: String? = null
      private set
  }
}
