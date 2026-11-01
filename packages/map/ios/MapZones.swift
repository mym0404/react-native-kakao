import KakaoMapsSDK

final class MapZones {
  typealias EventEmitter = ([String: Any]) -> Void

  private weak var map: KakaoMap?
  private var handlers: [DisposableEventHandler] = []
  private let onEnter: EventEmitter
  private let onLeave: EventEmitter

  init(map: KakaoMap, onEnter: @escaping EventEmitter, onLeave: @escaping EventEmitter) {
    self.map = map
    self.onEnter = onEnter
    self.onLeave = onLeave
    handlers = [
      map.addEnterZoneEventHandler(target: self) { owner in
        { event in owner.onEnter(owner.payload(event)) }
      },
      map.addLeaveZoneEventHandler(target: self) { owner in
        { event in owner.onLeave(owner.payload(event)) }
      }
    ]
  }

  func setCheckRectScale(zoneType: String, level: Int, x: Double, y: Double) throws {
    guard !zoneType.isEmpty, (0 ... 21).contains(level), x.isFinite, y.isFinite,
          x > 0, y > 0
    else {
      throw KakaoMapException(invalidCameraArgument, "Invalid zone check rectangle scale.")
    }
    try manager().setZoneCheckRectScale(
      zoneType: zoneType,
      level: level,
      scale: Vector2(x: x, y: y)
    )
  }

  func showDetail(zoneType: String, zoneId: String, detailId: String) throws {
    guard !zoneType.isEmpty, !zoneId.isEmpty, !detailId.isEmpty else {
      throw KakaoMapException(
        invalidCameraArgument,
        "Zone type, zone ID, and detail ID are required."
      )
    }
    try manager().showZoneDetail(zoneType: zoneType, zoneId: zoneId, detailId: detailId)
  }

  func hideDetail(zoneType: String) throws {
    guard !zoneType.isEmpty else {
      throw KakaoMapException(invalidCameraArgument, "Zone type is required.")
    }
    try manager().hideZoneDetail(zoneType: zoneType)
  }

  func dispose() {
    handlers.forEach { $0.dispose() }
    handlers.removeAll()
    map = nil
  }

  private func manager() throws -> ZoneManager {
    guard let map else {
      throw KakaoMapException("ERR_KAKAO_MAP_VIEW_DESTROYED", "The map view was destroyed.")
    }
    return map.getZoneManager()
  }

  private func payload(_ event: ZoneEnterEventParam) -> [String: Any] {
    [
      "zoneType": event.zoneType,
      "zoneId": event.zoneId,
      "detailId": event.zoneDetailId,
      "details": event.zoneDetails,
      "links": event.zoneLinkInfos.mapValues { links in
        links.map { ["zoneId": $0.zoneId, "detailId": $0.detailId] }
      }
    ]
  }

  private func payload(_ event: ZoneLeaveEventParam) -> [String: Any] {
    [
      "zoneType": event.zoneType,
      "zoneId": event.zoneId,
      "detailId": event.zoneDetailId,
      "details": event.zoneDetails,
      "links": [String: [[String: String]]]()
    ]
  }
}
