import ExpoModulesCore

public class KakaoMapRoadViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("RNCKakaoMapRoadView")

    View(KakaoMapRoadView.self) {
      Events(
        "onMapReady", "onRoadViewReady", "onError", "onRoadViewResult",
        "onRoadViewNoResult", "onRoadViewRequestFailed", "onRoadViewUpdated",
        "onRoadViewResized", "onRoadViewClick", "onRoadViewFocusChanged"
      )
      Prop("initialRequest") { (view: KakaoMapRoadView, request: RoadViewRequestRecord?) in
        view.pendingInitialRequest = request
      }
      Prop("visible") { (view: KakaoMapRoadView, visible: Bool?) in
        view.requestedVisibility = visible ?? true
      }
      Prop("logo") { (view: KakaoMapRoadView, logo: MapWidgetPositionOptions?) in view.logo = logo }
      Prop("layout") { (view: KakaoMapRoadView, layout: String?) in
        view.layout = layout ?? "vertical"
      }
      Prop("mapFraction") { (view: KakaoMapRoadView, fraction: Double?) in
        view.mapFraction = fraction ?? 0.5
      }
      Prop("linked") { (view: KakaoMapRoadView, linked: Bool?) in
        view.shouldLink = linked ?? true
      }
      Prop("initialCamera") { (view: KakaoMapRoadView, camera: CameraOptions?) in
        view.initialCamera = camera
      }
      OnViewDidUpdateProps { (view: KakaoMapRoadView) in
        view.updateVisibility()
        do {
          try view.updateLogo()
          try view.validateLayout()
        } catch {
          view.onError(["code": invalidCameraArgument, "message": error.localizedDescription])
        }
      }
      AsyncFunction("request") {
        (view: KakaoMapRoadView, request: RoadViewRequestRecord, promise: Promise) in
        view.requestRoadView(request) { result in promise.resolveOrReject(result) }
      }
      AsyncFunction("requestNext") { (view: KakaoMapRoadView, request: RoadViewRequestRecord) in
        try view.requestNext(request)
      }
      AsyncFunction("moveToCapture") { (view: KakaoMapRoadView, index: Int) in
        try view.moveToCapture(index)
      }
      AsyncFunction("getInfo") { (view: KakaoMapRoadView) in try view.getInfo() }
      AsyncFunction("refresh") { (view: KakaoMapRoadView) in try view.refresh() }
      AsyncFunction("linkMap") { (view: KakaoMapRoadView, linkId: String) in
        try view.linkMap(linkId)
      }
      AsyncFunction("unlinkMap") { (view: KakaoMapRoadView) in try view.unlinkMap() }
      AsyncFunction("setLinked") { (view: KakaoMapRoadView, linked: Bool) in
        try view.setLinked(linked)
      }
      AsyncFunction("moveMapCamera") {
        (view: KakaoMapRoadView, camera: CameraOptions, duration: Double) in
        try view.moveMapCamera(camera, duration: duration)
      }
      AsyncFunction("getMapCamera") { (view: KakaoMapRoadView) in try view.getMapCamera() }
    }
  }
}
