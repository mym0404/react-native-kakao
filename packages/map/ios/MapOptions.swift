import ExpoModulesCore
import KakaoMapsSDK

struct MapCoordinate: Record {
  @Field(.required) var latitude: Double = .nan
  @Field(.required) var longitude: Double = .nan

  func mapPoint() throws -> MapPoint {
    guard latitude.isFinite, longitude.isFinite,
          (-90 ... 90).contains(latitude), (-180 ... 180).contains(longitude)
    else {
      throw KakaoMapException(invalidCameraArgument, "Invalid map coordinate.")
    }
    return MapPoint(longitude: longitude, latitude: latitude)
  }
}

struct MapScreenPoint: Record {
  @Field(.required) var x: Double = .nan
  @Field(.required) var y: Double = .nan
}

struct MapPaddingOptions: Record {
  @Field(.required) var top: Double = .nan
  @Field(.required) var right: Double = .nan
  @Field(.required) var bottom: Double = .nan
  @Field(.required) var left: Double = .nan
}

struct MapViewInfoOptions: Record {
  @Field(.required) var name: String = ""
  @Field var appName: String?
}

struct MapPoiOptions: Record {
  @Field var visible: Bool?
  @Field var clickable: Bool?
  @Field var scale: String?
}

struct MapZoomRangeOptions: Record {
  @Field(.required) var min: Double = .nan
  @Field(.required) var max: Double = .nan
}

struct MapWidgetPositionOptions: Record {
  @Field(.required) var x: Double = .nan
  @Field(.required) var y: Double = .nan
  @Field(.required) var gravity: String = ""

  func values() throws -> (GuiAlignment, CGPoint) {
    guard x.isFinite, y.isFinite else {
      throw KakaoMapException(invalidCameraArgument, "Widget offsets must be finite numbers.")
    }
    let vertical: VerticalAlign
    let horizontal: HorizontalAlign
    switch gravity {
    case "topLeft":
      vertical = .top
      horizontal = .left
    case "topCenter":
      vertical = .top
      horizontal = .center
    case "topRight":
      vertical = .top
      horizontal = .right
    case "centerLeft":
      vertical = .middle
      horizontal = .left
    case "center":
      vertical = .middle
      horizontal = .center
    case "centerRight":
      vertical = .middle
      horizontal = .right
    case "bottomLeft":
      vertical = .bottom
      horizontal = .left
    case "bottomCenter":
      vertical = .bottom
      horizontal = .center
    case "bottomRight":
      vertical = .bottom
      horizontal = .right
    default:
      throw KakaoMapException(invalidCameraArgument, "Invalid map widget gravity.")
    }
    return (
      GuiAlignment(vAlign: vertical, hAlign: horizontal),
      CGPoint(x: x, y: y)
    )
  }
}

struct MapCompassOptions: Record {
  @Field var visible: Bool?
  @Field var position: MapWidgetPositionOptions?
}

struct MapScaleBarOptions: Record {
  @Field var visible: Bool?
  @Field var position: MapWidgetPositionOptions?
  @Field var autoHide: Bool?
  @Field var fade: MapScaleBarFadeOptions?
}

struct MapScaleBarFadeOptions: Record {
  @Field(.required) var inDuration: Double = .nan
  @Field(.required) var outDuration: Double = .nan
  @Field(.required) var retentionDuration: Double = .nan
}

struct KakaoMapViewOptions: Record {
  @Field var mapType: String?
  @Field var viewInfo: MapViewInfoOptions?
  @Field var overlays: [String]?
  @Field var customOverlays: [String]?
  @Field var language: String?
  @Field var poi: MapPoiOptions?
  @Field var buildingScale: Double?
  @Field var padding: MapPaddingOptions?
  @Field var zoomRange: MapZoomRangeOptions?
  @Field var gestures: [String: Bool]?
  @Field var compass: MapCompassOptions?
  @Field var scaleBar: MapScaleBarOptions?
  @Field var logo: MapWidgetPositionOptions?

  func merge(_ update: KakaoMapViewOptions) {
    if let mapType = update.mapType {
      self.mapType = mapType
      viewInfo = nil
    }
    if let viewInfo = update.viewInfo {
      self.viewInfo = viewInfo
      mapType = nil
    }
    overlays = update.overlays ?? overlays
    customOverlays = update.customOverlays ?? customOverlays
    language = update.language ?? language
    if let updatePoi = update.poi {
      let value = MapPoiOptions()
      value.visible = updatePoi.visible ?? poi?.visible
      value.clickable = updatePoi.clickable ?? poi?.clickable
      value.scale = updatePoi.scale ?? poi?.scale
      poi = value
    }
    buildingScale = update.buildingScale ?? buildingScale
    padding = update.padding ?? padding
    zoomRange = update.zoomRange ?? zoomRange
    if let updateGestures = update.gestures {
      var value = gestures ?? [:]
      value.merge(updateGestures) { _, new in new }
      gestures = value
    }
    if let updateCompass = update.compass {
      let value = MapCompassOptions()
      value.visible = updateCompass.visible ?? compass?.visible
      value.position = updateCompass.position ?? compass?.position
      compass = value
    }
    if let updateScaleBar = update.scaleBar {
      let value = MapScaleBarOptions()
      value.visible = updateScaleBar.visible ?? scaleBar?.visible
      value.position = updateScaleBar.position ?? scaleBar?.position
      value.autoHide = updateScaleBar.autoHide ?? scaleBar?.autoHide
      value.fade = updateScaleBar.fade ?? scaleBar?.fade
      scaleBar = value
    }
    logo = update.logo ?? logo
  }

  func copy() -> KakaoMapViewOptions {
    let result = KakaoMapViewOptions()
    result.mapType = mapType
    result.viewInfo = viewInfo
    result.overlays = overlays
    result.customOverlays = customOverlays
    result.language = language
    if let poi {
      let value = MapPoiOptions()
      value.visible = poi.visible
      value.clickable = poi.clickable
      value.scale = poi.scale
      result.poi = value
    }
    result.buildingScale = buildingScale
    result.padding = padding
    result.zoomRange = zoomRange
    result.gestures = gestures
    if let compass {
      let value = MapCompassOptions()
      value.visible = compass.visible
      value.position = compass.position
      result.compass = value
    }
    if let scaleBar {
      let value = MapScaleBarOptions()
      value.visible = scaleBar.visible
      value.position = scaleBar.position
      value.autoHide = scaleBar.autoHide
      value.fade = scaleBar.fade
      result.scaleBar = value
    }
    result.logo = logo
    return result
  }

  func difference(from previous: KakaoMapViewOptions) -> KakaoMapViewOptions {
    let result = KakaoMapViewOptions()
    if mapType != previous.mapType {
      result.mapType = mapType
    }
    if !same(viewInfo, previous.viewInfo) {
      result.viewInfo = viewInfo
    }
    if overlays != previous.overlays {
      result.overlays = overlays
    }
    if customOverlays != previous.customOverlays {
      result.customOverlays = customOverlays
    }
    if language != previous.language {
      result.language = language
    }
    result.poi = poiDifference(from: previous.poi)
    if buildingScale != previous.buildingScale {
      result.buildingScale = buildingScale
    }
    if !same(padding, previous.padding) {
      result.padding = padding
    }
    if !same(zoomRange, previous.zoomRange) {
      result.zoomRange = zoomRange
    }
    if let gestures {
      let changed = gestures.filter { previous.gestures?[$0.key] != $0.value }
      if !changed.isEmpty {
        result.gestures = changed
      }
    }
    result.compass = compassDifference(from: previous.compass)
    result.scaleBar = scaleBarDifference(from: previous.scaleBar)
    if !same(logo, previous.logo) {
      result.logo = logo
    }
    return result
  }

  private func poiDifference(from previous: MapPoiOptions?) -> MapPoiOptions? {
    guard let poi else { return nil }
    let result = MapPoiOptions()
    if poi.visible != previous?.visible {
      result.visible = poi.visible
    }
    if poi.clickable != previous?.clickable {
      result.clickable = poi.clickable
    }
    if poi.scale != previous?.scale {
      result.scale = poi.scale
    }
    return result.visible == nil && result.clickable == nil && result.scale == nil ? nil : result
  }

  private func compassDifference(from previous: MapCompassOptions?) -> MapCompassOptions? {
    guard let compass else { return nil }
    let result = MapCompassOptions()
    if compass.visible != previous?.visible {
      result.visible = compass.visible
    }
    if !same(compass.position, previous?.position) {
      result.position = compass.position
    }
    return result.visible == nil && result.position == nil ? nil : result
  }

  private func scaleBarDifference(from previous: MapScaleBarOptions?) -> MapScaleBarOptions? {
    guard let scaleBar else { return nil }
    let result = MapScaleBarOptions()
    if scaleBar.visible != previous?.visible {
      result.visible = scaleBar.visible
    }
    if !same(scaleBar.position, previous?.position) {
      result.position = scaleBar.position
    }
    if scaleBar.autoHide != previous?.autoHide {
      result.autoHide = scaleBar.autoHide
    }
    if !same(scaleBar.fade, previous?.fade) {
      result.fade = scaleBar.fade
    }
    return result.visible == nil && result.position == nil && result.autoHide == nil &&
      result.fade == nil ? nil : result
  }

  private func same(_ lhs: MapViewInfoOptions?, _ rhs: MapViewInfoOptions?) -> Bool {
    lhs?.name == rhs?.name && lhs?.appName == rhs?.appName
  }

  private func same(_ lhs: MapPaddingOptions?, _ rhs: MapPaddingOptions?) -> Bool {
    lhs?.top == rhs?.top && lhs?.right == rhs?.right && lhs?.bottom == rhs?.bottom &&
      lhs?.left == rhs?.left
  }

  private func same(_ lhs: MapZoomRangeOptions?, _ rhs: MapZoomRangeOptions?) -> Bool {
    lhs?.min == rhs?.min && lhs?.max == rhs?.max
  }

  private func same(
    _ lhs: MapWidgetPositionOptions?,
    _ rhs: MapWidgetPositionOptions?
  ) -> Bool {
    lhs?.x == rhs?.x && lhs?.y == rhs?.y && lhs?.gravity == rhs?.gravity
  }

  private func same(_ lhs: MapScaleBarFadeOptions?, _ rhs: MapScaleBarFadeOptions?) -> Bool {
    lhs?.inDuration == rhs?.inDuration && lhs?.outDuration == rhs?.outDuration &&
      lhs?.retentionDuration == rhs?.retentionDuration
  }
}

struct CameraUpdateOptions: Record {
  @Field(.required) var type: String = ""
  @Field var position: MapCoordinate?
  @Field var zoomLevel: Double?
  @Field var rotation: Double?
  @Field var tilt: Double?
  @Field var coordinates: [MapCoordinate]?

  func update(for map: KakaoMap) throws -> CameraUpdate {
    switch type {
    case "position":
      guard let position else {
        throw KakaoMapException(
          invalidCameraArgument,
          "A position camera update requires position."
        )
      }
      return try CameraUpdate.make(target: position.mapPoint(), mapView: map)
    case "zoom":
      guard let zoomLevel, zoomLevel.isFinite, zoomLevel.rounded() == zoomLevel,
            zoomLevel >= Double(map.cameraMinLevel), zoomLevel <= Double(map.cameraMaxLevel)
      else {
        throw KakaoMapException(
          invalidCameraArgument,
          "A zoom camera update requires a valid zoom level."
        )
      }
      return CameraUpdate.make(zoomLevel: Int(zoomLevel), mapView: map)
    case "orientation":
      guard let rotation, let tilt, rotation.isFinite, tilt.isFinite, (0 ... 90).contains(tilt)
      else {
        throw KakaoMapException(
          invalidCameraArgument,
          "An orientation camera update requires valid rotation and tilt values."
        )
      }
      return CameraUpdate.make(
        rotation: rotation.truncatingRemainder(dividingBy: 360) * .pi / 180,
        tilt: tilt * .pi / 180,
        mapView: map
      )
    case "fit":
      guard let coordinates, !coordinates.isEmpty else {
        throw KakaoMapException(
          invalidCameraArgument,
          "A fit camera update requires at least one coordinate."
        )
      }
      return try CameraUpdate.make(area: AreaRect(points: coordinates.map { try $0.mapPoint() }))
    default:
      throw KakaoMapException(invalidCameraArgument, "Invalid camera update type.")
    }
  }
}
