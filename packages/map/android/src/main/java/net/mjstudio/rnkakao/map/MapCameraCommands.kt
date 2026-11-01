package net.mjstudio.rnkakao.map

import android.os.Looper
import com.kakao.vectormap.GestureType
import com.kakao.vectormap.KakaoMap
import com.kakao.vectormap.LatLng
import com.kakao.vectormap.camera.CameraAnimation
import com.kakao.vectormap.camera.CameraPosition
import com.kakao.vectormap.camera.CameraUpdate
import com.kakao.vectormap.camera.CameraUpdateFactory
import expo.modules.kotlin.exception.CodedException
import kotlin.math.roundToInt

private const val CAMERA_UNSUPPORTED = "ERR_KAKAO_MAP_UNSUPPORTED_PLATFORM_FEATURE"
private const val CAMERA_DESTROYED = "ERR_KAKAO_MAP_VIEW_DESTROYED"

internal class MapCameraCommands(
  map: KakaoMap,
  private val density: Float,
) {
  private var map: KakaoMap? = map

  fun command(command: Map<String, Any?>): Map<String, Any?> {
    requireMainThread()
    val type = command.string("type")
    return when (type) {
      "getCapabilities" -> {
        capabilities()
      }

      "getState" -> {
        throw CodedException(
          "ERR_KAKAO_MAP_CAMERA_ASYNC_REQUIRED",
          "Android camera state must be read through KakaoMap.getCameraPosition(listener).",
          null,
        )
      }

      "moveToHeight" -> {
        moveToHeight(command)
      }

      "transform" -> {
        unsupported("Camera transforms are not exposed by Kakao Maps Android SDK 2.15.2.")
      }

      "fit" -> {
        fit(command)
      }

      "canShow" -> {
        canShow(command)
      }

      "heightAtLevel" -> {
        unsupported("Height conversion by zoom level is not exposed by Kakao Maps Android SDK 2.15.2.")
      }

      "resetOrientation" -> {
        unsupported("Orientation reset is not exposed by Kakao Maps Android SDK 2.15.2.")
      }

      "setBackToNorthDuringAutoElevation" -> {
        unsupported(
          "Back-to-north during auto elevation is not exposed by Kakao Maps Android SDK 2.15.2.",
        )
      }

      "setReferencePointLock" -> {
        setReferencePointLock(command)
      }

      else -> {
        invalid("Unsupported advanced camera command: $type.")
      }
    }
  }

  fun dispose() {
    requireMainThread()
    map = null
  }

  fun stateResult(position: CameraPosition): Map<String, Any?> {
    requireMainThread()
    requireMap()
    return mapOf("type" to "state", "camera" to position.advancedPayload())
  }

  private fun moveToHeight(command: Map<String, Any?>): Map<String, Any?> {
    rejectOperationId(command)
    val camera = command.objectValue("camera")
    val latitude = camera.finiteNumber("latitude")
    val longitude = camera.finiteNumber("longitude")
    val height = camera.finiteNumber("height")
    val tilt = camera.finiteNumber("tilt")
    val rotation = camera.finiteNumber("rotation")
    requireCoordinate(latitude, longitude)
    if (height <= 0.0 || tilt !in 0.0..90.0) {
      invalid("Camera height must be positive and tilt must be between 0 and 90 degrees.")
    }
    val position =
      CameraPosition.from(
        latitude,
        longitude,
        -1,
        Math.toRadians(tilt),
        rotation.toNativeCameraRotation(),
        height,
      )
    dispatch(CameraUpdateFactory.newCameraPosition(position), command.animation())
    return dispatched()
  }

  private fun fit(command: Map<String, Any?>): Map<String, Any?> {
    rejectOperationId(command)
    val points = command.coordinates("coordinates")
    val paddingDp = command.optionalFiniteNumber("padding") ?: 0.0
    if (paddingDp < 0.0) invalid("Camera fit padding must be non-negative.")
    val paddingPx = checkedPixel(paddingDp)
    val levelLimit = command.optionalInteger("levelLimit")
    val map = requireMap()
    if (levelLimit != null && levelLimit !in map.cameraMinLevel..map.cameraMaxLevel) {
      invalid("Camera fit levelLimit is outside the configured camera range.")
    }
    val update =
      if (levelLimit == null) {
        CameraUpdateFactory.fitMapPoints(points, paddingPx)
      } else {
        CameraUpdateFactory.fitMapPoints(points, paddingPx, levelLimit)
      }
    dispatch(update, command.animation())
    return dispatched()
  }

  private fun canShow(command: Map<String, Any?>): Map<String, Any?> {
    val rotation = command.optionalFiniteNumber("rotation") ?: 0.0
    val weight = command.optionalFiniteNumber("weight") ?: 1.0
    if (rotation != 0.0 || weight != 1.0 || command["rect"] != null) {
      unsupported("Android canShow supports only coordinates and zoomLevel.")
    }
    val map = requireMap()
    val zoomLevel = command.integer("zoomLevel")
    if (zoomLevel !in map.cameraMinLevel..map.cameraMaxLevel) {
      invalid("canShow zoomLevel is outside the configured camera range.")
    }
    return mapOf("type" to "canShow", "value" to map.canShowMapPoints(zoomLevel, *command.coordinates("coordinates")))
  }

  private fun setReferencePointLock(command: Map<String, Any?>): Map<String, Any?> {
    val gesture = referenceGesture(command.string("gesture"))
    requireMap().setFixedCenter(command.boolean("locked"), gesture)
    return mapOf("type" to "applied")
  }

  private fun dispatch(
    update: CameraUpdate,
    animation: CameraAnimation?,
  ) {
    val map = requireMap()
    if (animation == null) map.moveCamera(update) else map.moveCamera(update, animation)
  }

  private fun Map<String, Any?>.animation(): CameraAnimation? {
    if (!containsKey("animation")) return null
    val raw = this["animation"]
    val animation = raw as? Map<*, *> ?: invalid("animation must be an object.")
    val normalized = animation.stringKeys("animation")
    val duration = normalized.integer("duration")
    if (duration < 0) invalid("Animation duration must be non-negative.")
    val autoElevation = normalized.optionalBoolean("autoElevation") ?: false
    val consecutive = normalized.optionalBoolean("consecutive") ?: false
    if (duration == 0) return null
    return CameraAnimation.from(
      duration,
      autoElevation,
      consecutive,
    )
  }

  private fun capabilities() =
    mapOf(
      "type" to "capabilities",
      "capabilities" to
        mapOf(
          "transform" to false,
          "absoluteHeight" to true,
          "heightAtLevel" to false,
          "fit" to mapOf("padding" to true, "levelLimit" to true),
          "canShow" to mapOf("basic" to true, "rotation" to false, "weight" to false, "rect" to false),
          "resetOrientation" to false,
          "backToNorthDuringAutoElevation" to false,
          "animation" to mapOf("autoElevation" to true, "consecutive" to true, "operationCompletion" to false),
          "referencePoint" to mapOf("supported" to true, "gestures" to REFERENCE_GESTURES),
        ),
    )

  private fun requireMap() = map ?: throw CodedException(CAMERA_DESTROYED, "The map view was destroyed.", null)

  private fun rejectOperationId(command: Map<String, Any?>) {
    if (command["operationId"] != null) {
      unsupported("Android SDK 2.15.2 does not expose per-camera-operation completion callbacks.")
    }
  }

  private fun checkedPixel(value: Double): Int {
    val pixels = value * density
    if (!pixels.isFinite() || pixels > Int.MAX_VALUE) invalid("Camera fit padding exceeds the supported pixel range.")
    return pixels.roundToInt()
  }
}

private val REFERENCE_GESTURES = listOf("rotate", "zoom", "tilt", "rotateZoom", "oneFingerZoom")

private fun referenceGesture(value: String) =
  when (value) {
    "rotate" -> GestureType.Rotate
    "zoom" -> GestureType.Zoom
    "tilt" -> GestureType.Tilt
    "rotateZoom" -> GestureType.RotateZoom
    "oneFingerZoom" -> GestureType.OneFingerZoom
    else -> invalid("Unsupported reference-point gesture: $value.")
  }

private fun CameraPosition.advancedPayload() =
  mapOf(
    "latitude" to position.latitude,
    "longitude" to position.longitude,
    "zoomLevel" to zoomLevel,
    "height" to height,
    "tilt" to Math.toDegrees(tiltAngle),
    "rotation" to Math.toDegrees(rotationAngle).normalizedCameraDegrees(),
  )

private fun dispatched() = mapOf("type" to "dispatched")

private fun Map<String, Any?>.coordinates(name: String): Array<LatLng> {
  val values = this[name] as? List<*> ?: invalid("$name must be an array.")
  if (values.isEmpty()) invalid("$name must contain at least one coordinate.")
  return values
    .mapIndexed { index, value ->
      val coordinate =
        (value as? Map<*, *>)?.stringKeys("$name[$index]")
          ?: invalid("$name[$index] must be an object.")
      val latitude = coordinate.finiteNumber("latitude")
      val longitude = coordinate.finiteNumber("longitude")
      requireCoordinate(latitude, longitude)
      LatLng.from(latitude, longitude)
    }.toTypedArray()
}

private fun Map<String, Any?>.objectValue(name: String): Map<String, Any?> =
  (this[name] as? Map<*, *>)?.stringKeys(name) ?: invalid("$name must be an object.")

private fun Map<*, *>.stringKeys(path: String): Map<String, Any?> =
  entries.associate { (key, value) ->
    val stringKey = key as? String ?: invalid("$path must use string object keys.")
    stringKey to value
  }

private fun Map<String, Any?>.string(name: String) = this[name] as? String ?: invalid("$name must be a string.")

private fun Map<String, Any?>.boolean(name: String) = this[name] as? Boolean ?: invalid("$name must be a boolean.")

private fun Map<String, Any?>.optionalBoolean(name: String): Boolean? {
  if (!containsKey(name)) return null
  val value = this[name]
  return value as? Boolean ?: invalid("$name must be a boolean.")
}

private fun Map<String, Any?>.finiteNumber(name: String): Double = optionalFiniteNumber(name) ?: invalid("$name must be a finite number.")

private fun Map<String, Any?>.optionalFiniteNumber(name: String): Double? {
  if (!containsKey(name)) return null
  val value = this[name]
  val number = (value as? Number)?.toDouble() ?: invalid("$name must be a finite number.")
  if (!number.isFinite()) invalid("$name must be a finite number.")
  return number
}

private fun Map<String, Any?>.integer(name: String): Int = optionalInteger(name) ?: invalid("$name must be an integer.")

private fun Map<String, Any?>.optionalInteger(name: String): Int? {
  val number = optionalFiniteNumber(name) ?: return null
  if (number % 1.0 != 0.0 || number < Int.MIN_VALUE || number > Int.MAX_VALUE) invalid("$name must be an integer.")
  return number.toInt()
}

private fun requireCoordinate(
  latitude: Double,
  longitude: Double,
) {
  if (latitude !in -90.0..90.0 || longitude !in -180.0..180.0) {
    invalid("Coordinate latitude or longitude is outside its valid range.")
  }
}

private fun requireMainThread() {
  if (Looper.myLooper() != Looper.getMainLooper()) {
    throw CodedException("ERR_KAKAO_MAP_WRONG_THREAD", "Advanced camera commands must run on the main thread.", null)
  }
}

private fun invalid(message: String): Nothing = throw CodedException(INVALID_ARGUMENT, message, null)

private fun unsupported(message: String): Nothing = throw CodedException(CAMERA_UNSUPPORTED, message, null)
