import ExpoModulesCore

public class KakaoRoadViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("RNCKakaoRoadView")

    View(KakaoRoadView.self) {
      Events(
        "onRoadViewReady", "onError", "onRoadViewResult", "onRoadViewNoResult",
        "onRoadViewRequestFailed", "onRoadViewUpdated", "onRoadViewResized",
        "onRoadViewClick", "onRoadViewFocusChanged"
      )
      Prop("initialRequest") { (view: KakaoRoadView, request: RoadViewRequestRecord?) in
        view.pendingInitialRequest = request
      }
      Prop("visible") { (view: KakaoRoadView, visible: Bool?) in
        view.requestedVisibility = visible ?? true
      }
      Prop("logo") { (view: KakaoRoadView, logo: MapWidgetPositionOptions?) in view.logo = logo }
      OnViewDidUpdateProps { (view: KakaoRoadView) in
        view.updateVisibility()
        do { try view.updateLogo() } catch {
          view.onError(["code": invalidCameraArgument, "message": error.localizedDescription])
        }
      }
      AsyncFunction("request") {
        (view: KakaoRoadView, request: RoadViewRequestRecord, promise: Promise) in
        view.requestRoadView(request) { result in promise.resolveOrReject(result) }
      }
      AsyncFunction("requestNext") { (view: KakaoRoadView, request: RoadViewRequestRecord) in
        try view.requestNext(request)
      }
      AsyncFunction("moveToCapture") { (view: KakaoRoadView, index: Int) in
        try view.moveToCapture(index)
      }
      AsyncFunction("getInfo") { (view: KakaoRoadView) in try view.getInfo() }
      AsyncFunction("refresh") { (view: KakaoRoadView) in try view.refresh() }
      AsyncFunction("linkMap") { (view: KakaoRoadView, linkId: String) in try view.linkMap(linkId) }
      AsyncFunction("unlinkMap") { (view: KakaoRoadView) in try view.unlinkMap() }
    }
  }
}

extension Promise {
  func resolveOrReject(_ result: Result<Void, Error>) {
    switch result {
    case .success:
      resolve(nil)
    case let .failure(error as Exception):
      reject(error)
    case let .failure(error):
      reject(KakaoMapException("ERR_KAKAO_ROADVIEW", error.localizedDescription))
    }
  }
}
