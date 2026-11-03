package net.mjstudio.rnkakao.map

import com.kakao.vectormap.LatLng
import com.kakao.vectormap.camera.CameraPosition
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Required

internal const val INVALID_ARGUMENT = "ERR_KAKAO_MAP_INVALID_ARGUMENT"
internal const val NOT_INITIALIZED = "ERR_KAKAO_MAP_NOT_INITIALIZED"
internal const val NOT_READY = "ERR_KAKAO_MAP_NOT_READY"

class CameraOptions : Record {
  @Field @Required
  var latitude: Double = Double.NaN

  @Field @Required
  var longitude: Double = Double.NaN

  @Field @Required
  var zoomLevel: Double = Double.NaN

  @Field var tilt: Double = 0.0

  @Field var rotation: Double = 0.0

  fun values() = listOf(latitude, longitude, zoomLevel, tilt, rotation)

  fun position(
    minZoom: Int,
    maxZoom: Int,
  ): CameraPosition {
    if (!values().all { it.isFinite() } || latitude !in -90.0..90.0 || longitude !in -180.0..180.0 ||
      zoomLevel % 1.0 != 0.0 || zoomLevel < minZoom || zoomLevel > maxZoom || tilt !in 0.0..90.0
    ) {
      throw CodedException(INVALID_ARGUMENT, "Invalid camera coordinates, zoom level, tilt, or rotation.", null)
    }
    return CameraPosition.from(
      CameraPosition
        .Builder()
        .setPosition(LatLng.from(latitude, longitude))
        .setZoomLevel(zoomLevel.toInt())
        .setTiltAngle(Math.toRadians(tilt))
        .setRotationAngle(rotation.toNativeCameraRotation()),
    )
  }
}

internal fun CameraPosition.toPayload() =
  mapOf(
    "latitude" to position.latitude,
    "longitude" to position.longitude,
    "zoomLevel" to zoomLevel,
    "tilt" to Math.toDegrees(tiltAngle),
    "rotation" to Math.toDegrees(rotationAngle).normalizedCameraDegrees(),
  )

internal fun Double.toNativeCameraRotation() = Math.toRadians(normalizedCameraDegrees())

internal fun Double.normalizedCameraDegrees() = (this % 360.0 + 360.0) % 360.0
