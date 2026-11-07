package net.mjstudio.rnkakao.map

import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class KakaoRoadViewModule : Module() {
  override fun definition() =
    ModuleDefinition {
      Name("RNCKakaoRoadView")

      View(KakaoRoadView::class) {
        Events(
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
        Prop("initialRequest") { view: KakaoRoadView, request: RoadViewRequestRecord? ->
          view.pendingInitialRequest = request
        }
        Prop("visible") { view: KakaoRoadView, visible: Boolean? -> view.requestedVisibility = visible ?: true }
        Prop("logo") { view: KakaoRoadView, logo: MapWidgetPositionRecord? -> view.logo = logo }
        OnViewDidUpdateProps { view: KakaoRoadView -> view.applyProperties() }
        AsyncFunction("request") { view: KakaoRoadView, request: RoadViewRequestRecord, promise: Promise ->
          view.requestRoadView(request, promise)
        }
        AsyncFunction("requestNext") { view: KakaoRoadView, request: RoadViewRequestRecord, promise: Promise ->
          view.requestNext(request, promise)
        }
        AsyncFunction("moveToCapture") { view: KakaoRoadView, index: Int -> view.moveToCapture(index) }
        AsyncFunction("getInfo") { view: KakaoRoadView -> view.getInfo() }
        AsyncFunction("refresh") { view: KakaoRoadView -> view.refresh() }
        AsyncFunction("linkMap") { view: KakaoRoadView, linkId: String -> view.linkMap(linkId) }
        AsyncFunction("unlinkMap") { view: KakaoRoadView -> view.unlinkMap() }
        OnViewDestroys { view: KakaoRoadView -> view.destroy() }
      }
    }
}
