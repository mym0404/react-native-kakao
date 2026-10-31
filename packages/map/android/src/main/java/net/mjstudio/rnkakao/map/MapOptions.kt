package net.mjstudio.rnkakao.map

import com.kakao.vectormap.GestureType
import com.kakao.vectormap.MapGravity
import com.kakao.vectormap.MapOverlay
import com.kakao.vectormap.MapType
import com.kakao.vectormap.PoiScale
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Required

class CoordinateRecord : Record {
  @Field @Required
  var latitude: Double = Double.NaN

  @Field @Required
  var longitude: Double = Double.NaN

  fun validate(name: String = "Coordinate") {
    if (!latitude.isFinite() || !longitude.isFinite() || latitude !in -90.0..90.0 || longitude !in -180.0..180.0) {
      throw CodedException(INVALID_ARGUMENT, "$name must contain a valid latitude and longitude.", null)
    }
  }
}

class ScreenPointRecord : Record {
  @Field @Required
  var x: Double = Double.NaN

  @Field @Required
  var y: Double = Double.NaN

  fun validate(name: String = "Screen point") {
    if (!x.isFinite() || !y.isFinite()) {
      throw CodedException(INVALID_ARGUMENT, "$name must contain finite x and y values.", null)
    }
  }
}

class MapPaddingRecord : Record {
  @Field @Required
  var top: Double = Double.NaN

  @Field @Required
  var right: Double = Double.NaN

  @Field @Required
  var bottom: Double = Double.NaN

  @Field @Required
  var left: Double = Double.NaN

  fun validate() {
    if (!listOf(top, right, bottom, left).all { it.isFinite() && it >= 0.0 }) {
      throw CodedException(INVALID_ARGUMENT, "Map padding values must be finite and non-negative.", null)
    }
  }
}

class MapViewInfoRecord : Record {
  @Field @Required
  var name: String = ""

  @Field var appName: String? = null

  fun validate() {
    if (name.isBlank() || appName?.isBlank() == true) {
      throw CodedException(INVALID_ARGUMENT, "View info name and app name must not be blank.", null)
    }
  }
}

class PoiOptionsRecord : Record {
  @Field var visible: Boolean? = null

  @Field var clickable: Boolean? = null

  @Field var scale: String? = null
}

class ZoomRangeRecord : Record {
  @Field @Required
  var min: Double = Double.NaN

  @Field @Required
  var max: Double = Double.NaN
}

class MapWidgetPositionRecord : Record {
  @Field @Required
  var x: Double = Double.NaN

  @Field @Required
  var y: Double = Double.NaN

  @Field @Required
  var gravity: String = ""

  fun validate(name: String) {
    if (!x.isFinite() || !y.isFinite() || gravity !in gravityValues) {
      throw CodedException(INVALID_ARGUMENT, "$name must contain a supported gravity and finite x and y values.", null)
    }
  }

  fun nativeGravity() =
    when (gravity) {
      "topLeft" -> MapGravity.TOP or MapGravity.LEFT
      "topCenter" -> MapGravity.TOP or MapGravity.CENTER_HORIZONTAL
      "topRight" -> MapGravity.TOP or MapGravity.RIGHT
      "centerLeft" -> MapGravity.CENTER_VERTICAL or MapGravity.LEFT
      "center" -> MapGravity.CENTER
      "centerRight" -> MapGravity.CENTER_VERTICAL or MapGravity.RIGHT
      "bottomLeft" -> MapGravity.BOTTOM or MapGravity.LEFT
      "bottomCenter" -> MapGravity.BOTTOM or MapGravity.CENTER_HORIZONTAL
      "bottomRight" -> MapGravity.BOTTOM or MapGravity.RIGHT
      else -> error("Position must be validated before conversion.")
    }

  companion object {
    private val gravityValues =
      setOf(
        "topLeft",
        "topCenter",
        "topRight",
        "centerLeft",
        "center",
        "centerRight",
        "bottomLeft",
        "bottomCenter",
        "bottomRight",
      )
  }
}

class CompassOptionsRecord : Record {
  @Field var visible: Boolean? = null

  @Field var position: MapWidgetPositionRecord? = null
}

class ScaleBarOptionsRecord : Record {
  @Field var visible: Boolean? = null

  @Field var position: MapWidgetPositionRecord? = null

  @Field var autoHide: Boolean? = null

  @Field var fade: ScaleBarFadeRecord? = null
}

class ScaleBarFadeRecord : Record {
  @Field @Required
  var inDuration: Double = Double.NaN

  @Field @Required
  var outDuration: Double = Double.NaN

  @Field @Required
  var retentionDuration: Double = Double.NaN
}

class MapOptionsRecord : Record {
  @Field var mapType: String? = null

  @Field var viewInfo: MapViewInfoRecord? = null

  @Field var overlays: List<String>? = null

  @Field var customOverlays: List<String>? = null

  @Field var language: String? = null

  @Field var poi: PoiOptionsRecord? = null

  @Field var buildingScale: Double? = null

  @Field var padding: MapPaddingRecord? = null

  @Field var zoomRange: ZoomRangeRecord? = null

  @Field var gestures: Map<String, Boolean>? = null

  @Field var compass: CompassOptionsRecord? = null

  @Field var scaleBar: ScaleBarOptionsRecord? = null

  @Field var logo: MapWidgetPositionRecord? = null
}

class CameraUpdateRecord : Record {
  @Field @Required
  var type: String = ""

  @Field var position: CoordinateRecord? = null

  @Field var zoomLevel: Double? = null

  @Field var rotation: Double? = null

  @Field var tilt: Double? = null

  @Field var coordinates: List<CoordinateRecord>? = null
}

internal fun mergeMapOptions(
  base: MapOptionsRecord?,
  patch: MapOptionsRecord,
): MapOptionsRecord {
  val result = base ?: MapOptionsRecord()
  patch.mapType?.let {
    result.mapType = it
    result.viewInfo = null
  }
  patch.viewInfo?.let {
    result.viewInfo = it
    result.mapType = null
  }
  patch.overlays?.let { result.overlays = it }
  patch.customOverlays?.let { result.customOverlays = it }
  patch.language?.let { result.language = it }
  patch.poi?.let { poiPatch ->
    val poi = result.poi ?: PoiOptionsRecord()
    poiPatch.visible?.let { poi.visible = it }
    poiPatch.clickable?.let { poi.clickable = it }
    poiPatch.scale?.let { poi.scale = it }
    result.poi = poi
  }
  patch.buildingScale?.let { result.buildingScale = it }
  patch.padding?.let { result.padding = it }
  patch.zoomRange?.let { result.zoomRange = it }
  patch.gestures?.let { result.gestures = result.gestures.orEmpty() + it }
  patch.compass?.let { compassPatch ->
    val compass = result.compass ?: CompassOptionsRecord()
    compassPatch.visible?.let { compass.visible = it }
    compassPatch.position?.let { compass.position = it }
    result.compass = compass
  }
  patch.scaleBar?.let { scaleBarPatch ->
    val scaleBar = result.scaleBar ?: ScaleBarOptionsRecord()
    scaleBarPatch.visible?.let { scaleBar.visible = it }
    scaleBarPatch.position?.let { scaleBar.position = it }
    scaleBarPatch.autoHide?.let { scaleBar.autoHide = it }
    scaleBarPatch.fade?.let { scaleBar.fade = it }
    result.scaleBar = scaleBar
  }
  patch.logo?.let { result.logo = it }
  return result
}

internal fun changedMapOptions(
  applied: MapOptionsRecord,
  patch: MapOptionsRecord,
): MapOptionsRecord {
  val changed = MapOptionsRecord()
  patch.mapType?.takeIf { it != applied.mapType }?.let { changed.mapType = it }
  patch.viewInfo?.takeIf { !it.sameAs(applied.viewInfo) }?.let { changed.viewInfo = it }
  patch.overlays?.takeIf { it.toSet() != applied.overlays?.toSet() }?.let { changed.overlays = it }
  patch.customOverlays?.takeIf { it.toSet() != applied.customOverlays?.toSet() }?.let { changed.customOverlays = it }
  patch.language?.takeIf { it != applied.language }?.let { changed.language = it }
  patch.poi?.let { poiPatch ->
    val poi = PoiOptionsRecord()
    poiPatch.visible?.takeIf { it != applied.poi?.visible }?.let { poi.visible = it }
    poiPatch.clickable?.takeIf { it != applied.poi?.clickable }?.let { poi.clickable = it }
    poiPatch.scale?.takeIf { it != applied.poi?.scale }?.let { poi.scale = it }
    if (poi.visible != null || poi.clickable != null || poi.scale != null) changed.poi = poi
  }
  patch.buildingScale?.takeIf { it != applied.buildingScale }?.let { changed.buildingScale = it }
  patch.padding?.takeIf { !it.sameAs(applied.padding) }?.let { changed.padding = it }
  patch.zoomRange?.takeIf { !it.sameAs(applied.zoomRange) }?.let { changed.zoomRange = it }
  patch.gestures?.filter { (gesture, enabled) -> applied.gestures?.get(gesture) != enabled }?.takeIf { it.isNotEmpty() }?.let {
    changed.gestures = it
  }
  patch.compass?.let { compassPatch ->
    val compass = CompassOptionsRecord()
    compassPatch.visible?.takeIf { it != applied.compass?.visible }?.let { compass.visible = it }
    compassPatch.position?.takeIf { !it.sameAs(applied.compass?.position) }?.let { compass.position = it }
    if (compass.visible != null || compass.position != null) changed.compass = compass
  }
  patch.scaleBar?.let { scaleBarPatch ->
    val scaleBar = ScaleBarOptionsRecord()
    scaleBarPatch.visible?.takeIf { it != applied.scaleBar?.visible }?.let { scaleBar.visible = it }
    scaleBarPatch.position?.takeIf { !it.sameAs(applied.scaleBar?.position) }?.let { scaleBar.position = it }
    scaleBarPatch.autoHide?.takeIf { it != applied.scaleBar?.autoHide }?.let { scaleBar.autoHide = it }
    scaleBarPatch.fade?.takeIf { !it.sameAs(applied.scaleBar?.fade) }?.let { scaleBar.fade = it }
    if (scaleBar.visible != null || scaleBar.position != null || scaleBar.autoHide != null || scaleBar.fade != null) {
      changed.scaleBar = scaleBar
    }
  }
  patch.logo?.takeIf { !it.sameAs(applied.logo) }?.let { changed.logo = it }
  return changed
}

internal fun MapOptionsRecord.isEmpty() =
  mapType == null &&
    viewInfo == null &&
    overlays == null &&
    customOverlays == null &&
    language == null &&
    poi == null &&
    buildingScale == null &&
    padding == null &&
    zoomRange == null &&
    gestures == null &&
    compass == null &&
    scaleBar == null &&
    logo == null

private fun MapViewInfoRecord.sameAs(other: MapViewInfoRecord?) = name == other?.name && appName == other.appName

private fun MapPaddingRecord.sameAs(other: MapPaddingRecord?) =
  top == other?.top && right == other.right && bottom == other.bottom && left == other.left

private fun ZoomRangeRecord.sameAs(other: ZoomRangeRecord?) = min == other?.min && max == other.max

private fun MapWidgetPositionRecord.sameAs(other: MapWidgetPositionRecord?) = x == other?.x && y == other.y && gravity == other.gravity

private fun ScaleBarFadeRecord.sameAs(other: ScaleBarFadeRecord?) =
  inDuration == other?.inDuration && outDuration == other.outDuration && retentionDuration == other.retentionDuration

internal fun nativeMapType(value: String) =
  when (value) {
    "normal" -> MapType.NORMAL
    "skyview" -> MapType.SKYVIEW
    else -> throw CodedException(INVALID_ARGUMENT, "Unsupported map type: $value.", null)
  }

internal fun nativeMapOverlay(value: String) =
  when (value) {
    "roadviewLine" -> MapOverlay.ROADVIEW_LINE
    "hillShading" -> MapOverlay.HILLSHADING
    "bicycleRoad" -> MapOverlay.BICYCLE_ROAD
    "hybrid" -> MapOverlay.SKYVIEW_HYBRID
    else -> throw CodedException(INVALID_ARGUMENT, "Unsupported map overlay: $value.", null)
  }

internal fun nativeGesture(value: String) =
  when (value) {
    "doubleTapZoomIn" -> GestureType.OneFingerDoubleTap
    "twoFingerTapZoomOut" -> GestureType.TwoFingerSingleTap
    "pan" -> GestureType.Pan
    "rotate" -> GestureType.Rotate
    "zoom" -> GestureType.Zoom
    "tilt" -> GestureType.Tilt
    "longTapAndDrag" -> GestureType.LongTapAndDrag
    "rotateZoom" -> GestureType.RotateZoom
    "oneFingerZoom" -> GestureType.OneFingerZoom
    else -> throw CodedException(INVALID_ARGUMENT, "Unsupported map gesture: $value.", null)
  }

internal fun nativePoiScale(value: String) =
  when (value) {
    "small" -> PoiScale.SMALL
    "regular" -> PoiScale.REGULAR
    "large" -> PoiScale.LARGE
    "xLarge" -> PoiScale.XLARGE
    else -> throw CodedException(INVALID_ARGUMENT, "Unsupported POI scale: $value.", null)
  }

internal fun mapTypePayload(value: String) = if (value == MapType.SKYVIEW.value) "skyview" else "normal"
