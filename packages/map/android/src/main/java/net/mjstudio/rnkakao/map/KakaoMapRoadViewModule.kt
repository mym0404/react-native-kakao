package net.mjstudio.rnkakao.map

import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class KakaoMapRoadViewModule : Module() {
  override fun definition() =
    ModuleDefinition {
      Name("RNCKakaoMapRoadView")

      View(KakaoMapRoadView::class) {
        Events(
          "onMapReady",
          "onRoadViewReady",
          "onError",
          "onRoadViewResult",
          "onRoadViewNoResult",
          "onRoadViewRequestFailed",
          "onRoadViewUpdated",
          "onRoadViewResized",
          "onRoadViewClick",
          "onRoadViewFocusChanged",
        )
        Prop("initialRequest") { view: KakaoMapRoadView, request: RoadViewRequestRecord? ->
          view.pendingInitialRequest = request
        }
        Prop("visible") { view: KakaoMapRoadView, visible: Boolean? -> view.requestedVisibility = visible ?: true }
        Prop("logo") { view: KakaoMapRoadView, logo: MapWidgetPositionRecord? -> view.logo = logo }
        Prop("layout") { view: KakaoMapRoadView, layout: String? -> view.layout = layout ?: "vertical" }
        Prop("mapFraction") { view: KakaoMapRoadView, fraction: Double? -> view.mapFraction = fraction ?: 0.5 }
        Prop("linked") { view: KakaoMapRoadView, linked: Boolean? -> view.shouldLink = linked ?: true }
        Prop("initialCamera") { view: KakaoMapRoadView, camera: CameraOptions? -> view.initialCamera = camera }
        OnViewDidUpdateProps { view: KakaoMapRoadView ->
          view.applyProperties()
          view.validateLayout()
        }
        AsyncFunction("request") { view: KakaoMapRoadView, request: RoadViewRequestRecord, promise: Promise ->
          view.requestRoadView(request, promise)
        }
        AsyncFunction("requestNext") { view: KakaoMapRoadView, request: RoadViewRequestRecord, promise: Promise ->
          view.requestNext(request, promise)
        }
        AsyncFunction("moveToCapture") { view: KakaoMapRoadView, index: Int -> view.moveToCapture(index) }
        AsyncFunction("getInfo") { view: KakaoMapRoadView -> view.getInfo() }
        AsyncFunction("refresh") { view: KakaoMapRoadView -> view.refresh() }
        AsyncFunction("linkMap") { view: KakaoMapRoadView, linkId: String -> view.linkMap(linkId) }
        AsyncFunction("unlinkMap") { view: KakaoMapRoadView -> view.unlinkMap() }
        AsyncFunction("setLinked") { view: KakaoMapRoadView, linked: Boolean -> view.setLinked(linked) }
        AsyncFunction("moveMapCamera") { view: KakaoMapRoadView, camera: CameraOptions, duration: Double ->
          view.moveMapCamera(camera, duration)
        }
        AsyncFunction("getMapCamera") { view: KakaoMapRoadView -> view.getMapCamera() }
        OnViewDestroys { view: KakaoMapRoadView -> view.destroy() }
      }
    }
}
