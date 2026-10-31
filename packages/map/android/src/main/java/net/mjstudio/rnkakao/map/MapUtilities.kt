package net.mjstudio.rnkakao.map

import android.content.Context
import android.os.Handler
import android.os.Looper
import com.kakao.vectormap.BuildConfig
import com.kakao.vectormap.CoordConverter
import com.kakao.vectormap.KakaoMap
import com.kakao.vectormap.PoiCategory
import com.kakao.vectormap.PoiScale
import com.kakao.vectormap.PoiState
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import java.lang.ref.WeakReference
import kotlin.math.roundToInt

private const val UTILITY_UNSUPPORTED = "ERR_KAKAO_MAP_UNSUPPORTED_PLATFORM_FEATURE"
private const val UTILITY_DESTROYED = "ERR_KAKAO_MAP_VIEW_DESTROYED"
private const val POI_STATE_TIMEOUT = "ERR_KAKAO_MAP_POI_STATE_TIMEOUT"
private const val POI_STATE_TIMEOUT_MILLIS = 3_000L
private val fontResourceNamePattern = Regex("^[a-z][a-z0-9_]*$")

internal class MapUtilities(
  map: KakaoMap,
  context: Context,
) {
  private var map: KakaoMap? = map
  private val applicationContext = context.applicationContext
  private val density = applicationContext.resources.displayMetrics.density
  private val mainHandler = Handler(Looper.getMainLooper())
  private val pendingPoiStateRequests = mutableMapOf<Any, PendingPoiStateRequest>()

  fun command(command: Map<String, Any?>): Map<String, Any?> {
    requireMap()
    return when (command.utilityString("type")) {
      "getCapabilities" -> {
        capabilities()
      }

      "getState" -> {
        state()
      }

      "setPoiVisible" -> {
        requireMap().setPoiVisible(command.utilityBoolean("visible"))
        none()
      }

      "setPoiCategoryVisible" -> {
        requireMap().setVisiblePoiCategory(command.utilityCategory("category"), command.utilityBoolean("visible"))
        none()
      }

      "setPoiCategoryMaxCount" -> {
        requireMap().setPoiVisibleMaxCount(command.utilityCategory("category"), command.utilityInteger("count"))
        none()
      }

      "resetPoiCategoryMaxCount" -> {
        requireMap().resetPoiVisibleMaxCount(command.utilityCategory("category"))
        none()
      }

      "setTapInterval" -> {
        requireMap().setClickIntervalTime(command.utilityInteger("milliseconds"))
        none()
      }

      "setCameraAnimationEnabled" -> {
        requireMap().setCameraAnimateEnable(command.utilityBoolean("enabled"))
        none()
      }

      "setEnabled" -> {
        unsupported("The Kakao Maps Android SDK does not expose an enabled setting.")
      }

      "setVisible" -> {
        requireMap().setVisible(command.utilityBoolean("visible"))
        none()
      }

      "setKeepLevelOnResize" -> {
        unsupported("The Kakao Maps Android SDK does not expose keep-level-on-resize.")
      }

      "getViewport" -> {
        viewport()
      }

      "setViewport" -> {
        setViewport(command.utilityObject("viewport"))
        none()
      }

      "refresh" -> {
        unsupported("The Kakao Maps Android SDK does not expose map refresh.")
      }

      "registerFont" -> {
        registerFont(command)
        none()
      }

      "getVersion" -> {
        version(command.utilityString("component"))
      }

      "convertCoordinate" -> {
        convert(command)
      }

      "clearCache" -> {
        clearCache(command.utilityString("kind"))
        none()
      }

      else -> {
        invalidUtility("Unknown map utility command.")
      }
    }
  }

  fun dispose() {
    map = null
    pendingPoiStateRequests.values.forEach { request ->
      mainHandler.removeCallbacks(request.timeout)
      request.promise.reject(UTILITY_DESTROYED, "The map view was destroyed.", null)
    }
    pendingPoiStateRequests.clear()
  }

  fun requestPoiState(promise: Promise) {
    val map =
      try {
        requireMap()
      } catch (error: CodedException) {
        promise.reject(error)
        return
      }
    val requestId = Any()
    val utilitiesReference = WeakReference(this)
    val mapReference = WeakReference(map)
    val timeout =
      Runnable {
        utilitiesReference.get()?.rejectPoiStateRequest(
          requestId,
          POI_STATE_TIMEOUT,
          "Kakao Maps did not return POI state within $POI_STATE_TIMEOUT_MILLIS milliseconds.",
        )
      }
    pendingPoiStateRequests[requestId] = PendingPoiStateRequest(promise, timeout)
    mainHandler.postDelayed(timeout, POI_STATE_TIMEOUT_MILLIS)
    val callbackHandler = mainHandler
    try {
      map.requestPoiState { callbackMap, state ->
        val callbackMapReference = WeakReference(callbackMap)
        callbackHandler.post {
          utilitiesReference.get()?.resolvePoiStateRequest(requestId, mapReference.get(), callbackMapReference.get(), state)
        }
      }
    } catch (error: Exception) {
      rejectPoiStateRequest(requestId, error.javaClass.simpleName, error.message ?: "POI-state request failed.", error)
    }
  }

  private fun capabilities(): Map<String, Any?> =
    mapOf(
      "type" to "capabilities",
      "poi" to
        mapOf(
          "visibility" to true,
          "visibilityReadable" to true,
          "categoryVisibility" to true,
          "categoryMaxCount" to true,
          "stateRequest" to true,
          "categories" to utilityCategoryNames,
        ),
      "settings" to
        mapOf(
          "tapInterval" to true,
          "cameraAnimationEnabled" to true,
          "cameraAnimationEnabledReadable" to false,
          "enabled" to false,
          "visible" to true,
          "keepLevelOnResize" to false,
          "refresh" to false,
          "focusedReadable" to false,
        ),
      "viewport" to mapOf("readable" to true, "writable" to true),
      "fontRegistration" to true,
      "versionComponents" to listOf("sdk", "engine"),
      "coordinateSystems" to androidCoordinateSystems,
      "coordinateConversions" to utilityConversions(androidCoordinateSystems),
      "cacheKinds" to listOf("disk", "all"),
    )

  private fun state(): Map<String, Any?> {
    val map = requireMap()
    return mapOf(
      "type" to "state",
      "tapInterval" to map.clickIntervalTime,
      "poiVisible" to map.isPoiVisible,
      "visible" to map.isVisible,
    )
  }

  private fun version(component: String): Map<String, Any?> {
    val value =
      when (component) {
        "sdk" -> BuildConfig.SDK_VERSION
        "engine" -> BuildConfig.ENGINE_VERSION
        else -> invalidUtility("Unknown map version component.")
      }
    if (value.isBlank()) {
      throw CodedException(
        "ERR_KAKAO_MAP_VERSION_UNAVAILABLE",
        "The Kakao Maps $component version is unavailable.",
        null,
      )
    }
    return mapOf("type" to "version", "component" to component, "version" to value)
  }

  private fun viewport(): Map<String, Any?> {
    val viewport = requireMap().viewport
    return mapOf(
      "type" to "viewport",
      "viewport" to
        mapOf(
          "x" to viewport.left / density.toDouble(),
          "y" to viewport.top / density.toDouble(),
          "width" to viewport.width() / density.toDouble(),
          "height" to viewport.height() / density.toDouble(),
        ),
    )
  }

  private fun setViewport(viewport: Map<String, Any?>) {
    val x = viewport.utilityViewportPixel("x", density, isSize = false)
    val y = viewport.utilityViewportPixel("y", density, isSize = false)
    val width = viewport.utilityViewportPixel("width", density, isSize = true)
    val height = viewport.utilityViewportPixel("height", density, isSize = true)
    if (x.toLong() + width > Int.MAX_VALUE || y.toLong() + height > Int.MAX_VALUE) {
      invalidUtility("Viewport edges exceed the Android pixel range.")
    }
    requireMap().setViewport(x, y, width, height)
  }

  private fun registerFont(command: Map<String, Any?>) {
    val resourceName = command.utilityString("resourceName")
    if (!fontResourceNamePattern.matches(resourceName)) {
      invalidUtility("resourceName must be a lowercase Android font resource name.")
    }
    val resourceId =
      applicationContext.resources.getIdentifier(resourceName, "font", applicationContext.packageName)
    if (resourceId == 0) {
      throw CodedException(
        "ERR_KAKAO_MAP_FONT_RESOURCE_NOT_FOUND",
        "Android font resource '$resourceName' was not found.",
        null,
      )
    }
    val name = command.utilityOptionalString("name")
    if (name == null) requireMap().addFont(resourceId) else requireMap().addFont(name, resourceId)
  }

  private fun convert(command: Map<String, Any?>): Map<String, Any?> {
    val source = command.utilityString("from")
    val destination = command.utilityString("to")
    if (source !in utilityCoordinateSystems || destination !in utilityCoordinateSystems) {
      invalidUtility("Unknown coordinate system.")
    }
    if (source == "kakao" || destination == "kakao") {
      unsupported("The Kakao Maps Android SDK does not expose Kakao-coordinate conversion.")
    }
    val value = command.utilityObject("coordinate").utilityCoordinate(source)
    val converted =
      when (source to destination) {
        "wgs84" to "wgs84", "wtm" to "wtm", "wcong" to "wcong" -> value
        "wgs84" to "wtm" -> CoordConverter.toWTMFromLatLng(value.first, value.second)?.coordinatePair() ?: conversionFailed()
        "wgs84" to "wcong" -> CoordConverter.toWCONGFromLatLng(value.first, value.second)?.coordinatePair() ?: conversionFailed()
        "wtm" to "wgs84" -> CoordConverter.toLatLngFromWTM(value.first, value.second)?.coordinatePair() ?: conversionFailed()
        "wtm" to "wcong" -> CoordConverter.toWCONGFromWTM(value.first, value.second)?.coordinatePair() ?: conversionFailed()
        "wcong" to "wgs84" -> CoordConverter.toLatLngFromWCONG(value.first, value.second)?.coordinatePair() ?: conversionFailed()
        "wcong" to "wtm" -> CoordConverter.toWTMFromWCONG(value.first, value.second)?.coordinatePair() ?: conversionFailed()
        else -> unsupported("The requested coordinate conversion is unavailable on Android.")
      }
    if (!converted.first.isFinite() || !converted.second.isFinite()) {
      throw CodedException("ERR_KAKAO_MAP_COORDINATE_CONVERSION_FAILED", "Kakao Maps returned an invalid coordinate.", null)
    }
    return mapOf(
      "type" to "coordinate",
      "system" to destination,
      "coordinate" to mapOf("x" to converted.first, "y" to converted.second),
    )
  }

  private fun clearCache(kind: String) {
    val map = requireMap()
    when (kind) {
      "disk" -> map.clearDiskCache()
      "all" -> map.clearAllCache()
      "memory", "viewInfo" -> unsupported("The Kakao Maps Android SDK does not expose $kind-only cache clearing.")
      else -> invalidUtility("Unknown map cache kind.")
    }
  }

  private fun resolvePoiStateRequest(
    requestId: Any,
    expectedMap: KakaoMap?,
    callbackMap: KakaoMap?,
    state: PoiState,
  ) {
    val request = pendingPoiStateRequests.remove(requestId) ?: return
    mainHandler.removeCallbacks(request.timeout)
    if (map == null || expectedMap == null || map !== expectedMap || callbackMap !== expectedMap) {
      request.promise.reject(UTILITY_DESTROYED, "The map view was destroyed.", null)
      return
    }
    request.promise.resolve(
      mapOf(
        "type" to "poiState",
        "state" to
          mapOf(
            "visible" to state.isVisible,
            "clickable" to state.isClickable,
            "scale" to
              when (state.poiScale) {
                PoiScale.SMALL -> "small"
                PoiScale.REGULAR -> "regular"
                PoiScale.LARGE -> "large"
                PoiScale.XLARGE -> "xLarge"
              },
            "language" to state.poiLanguage,
          ),
      ),
    )
  }

  private fun rejectPoiStateRequest(
    requestId: Any,
    code: String,
    message: String,
    cause: Throwable? = null,
  ) {
    val request = pendingPoiStateRequests.remove(requestId) ?: return
    mainHandler.removeCallbacks(request.timeout)
    request.promise.reject(code, message, cause)
  }

  private fun requireMap() = map ?: throw CodedException(UTILITY_DESTROYED, "The map view was destroyed.", null)

  private data class PendingPoiStateRequest(
    val promise: Promise,
    val timeout: Runnable,
  )
}

private val androidCoordinateSystems = listOf("wgs84", "wtm", "wcong")

private val utilityCategoryNames =
  listOf(
    "policyCategory",
    "address",
    "district",
    "busStop",
    "railroadPlatform",
    "railroadEntrance",
    "railroadLine",
    "brand",
    "place",
    "climb",
    "climbWave",
    "road",
    "roadNumber",
    "roadInfo",
    "facilities",
    "publicFacilities",
    "apartNumber",
    "apartDetail",
    "houseNumber",
    "land",
    "indoor",
    "indoorPlace",
    "detailCategory",
  )

private val utilityCategories =
  mapOf(
    "policyCategory" to PoiCategory.POLICY_CATEGORY,
    "address" to PoiCategory.ADDRESS,
    "district" to PoiCategory.DISTRICT,
    "busStop" to PoiCategory.BUS_STOP,
    "railroadPlatform" to PoiCategory.RAILROAD_PLATFORM,
    "railroadEntrance" to PoiCategory.RAILROAD_ENTRANCE,
    "railroadLine" to PoiCategory.RAILROAD_LINE,
    "brand" to PoiCategory.BRAND,
    "place" to PoiCategory.PLACE,
    "climb" to PoiCategory.CLIMB,
    "climbWave" to PoiCategory.CLIMB_WAVE,
    "road" to PoiCategory.ROAD,
    "roadNumber" to PoiCategory.ROAD_NUMBER,
    "roadInfo" to PoiCategory.ROAD_INFO,
    "facilities" to PoiCategory.FACILITIES,
    "publicFacilities" to PoiCategory.PUBLIC_FACILITIES,
    "apartNumber" to PoiCategory.APART_NUMBER,
    "apartDetail" to PoiCategory.APART_DETAIL,
    "houseNumber" to PoiCategory.HOUSE_NUMBER,
    "land" to PoiCategory.LAND,
    "indoor" to PoiCategory.INDOOR,
    "indoorPlace" to PoiCategory.INDOOR_PLACE,
    "detailCategory" to PoiCategory.DETAIL_CATEGORY,
  )

private val utilityCoordinateSystems = setOf("wgs84", "wtm", "wcong", "kakao")

private fun utilityConversions(systems: List<String>) = systems.flatMap { source -> systems.map { destination -> "$source:$destination" } }

private fun com.kakao.vectormap.Coordinate.coordinatePair() = x to y

private fun com.kakao.vectormap.LatLng.coordinatePair() = longitude to latitude

private fun none(): Map<String, Any?> = mapOf("type" to "none")

private fun invalidUtility(message: String): Nothing = throw CodedException(INVALID_ARGUMENT, message, null)

private fun unsupported(message: String): Nothing = throw CodedException(UTILITY_UNSUPPORTED, message, null)

private fun conversionFailed(): Nothing =
  throw CodedException("ERR_KAKAO_MAP_COORDINATE_CONVERSION_FAILED", "Kakao Maps could not convert the coordinate.", null)

private fun Map<String, Any?>.utilityString(key: String): String {
  val value = this[key] as? String
  if (value.isNullOrEmpty()) invalidUtility("$key must be a non-empty string.")
  return value
}

private fun Map<String, Any?>.utilityOptionalString(key: String): String? {
  val value = this[key] ?: return null
  if (value !is String || value.isBlank()) invalidUtility("$key must be a non-empty string when provided.")
  return value
}

private fun Map<String, Any?>.utilityBoolean(key: String) = this[key] as? Boolean ?: invalidUtility("$key must be a boolean.")

private fun Map<String, Any?>.utilityInteger(key: String): Int {
  val value = (this[key] as? Number)?.toDouble() ?: invalidUtility("$key must be an integer.")
  if (!value.isFinite() || value % 1 != 0.0 || value !in 0.0..Int.MAX_VALUE.toDouble()) {
    invalidUtility("$key must be an integer between 0 and ${Int.MAX_VALUE}.")
  }
  return value.toInt()
}

private fun Map<String, Any?>.utilityObject(key: String): Map<String, Any?> {
  val value = this[key] as? Map<*, *> ?: invalidUtility("$key must be an object.")
  return value.entries.associate { (entryKey, entryValue) ->
    val stringKey = entryKey as? String ?: invalidUtility("$key must use string keys.")
    stringKey to entryValue
  }
}

private fun Map<String, Any?>.utilityViewportPixel(
  key: String,
  density: Float,
  isSize: Boolean,
): Int {
  if (!density.isFinite() || density <= 0) invalidUtility("Display density must be positive and finite.")
  val value = (this[key] as? Number)?.toDouble() ?: invalidUtility("viewport.$key must be a number.")
  if (!value.isFinite() || value < 0 || (isSize && value == 0.0)) {
    invalidUtility("viewport.$key must be ${if (isSize) "positive" else "non-negative"} and finite.")
  }
  val pixels = value * density
  if (pixels > Int.MAX_VALUE) invalidUtility("viewport.$key exceeds the Android pixel range.")
  val rounded = pixels.roundToInt()
  if (isSize && rounded == 0) invalidUtility("viewport.$key must resolve to at least one physical pixel.")
  return rounded
}

private fun Map<String, Any?>.utilityCategory(key: String): PoiCategory {
  val name = utilityString(key)
  return utilityCategories[name] ?: invalidUtility("Unknown POI category.")
}

private fun Map<String, Any?>.utilityCoordinate(system: String): Pair<Double, Double> {
  val x = (this["x"] as? Number)?.toDouble()
  val y = (this["y"] as? Number)?.toDouble()
  if (x == null || y == null || !x.isFinite() || !y.isFinite()) {
    invalidUtility("Coordinate x and y must be finite numbers.")
  }
  if (system == "wgs84" && (x !in -180.0..180.0 || y !in -90.0..90.0)) {
    invalidUtility("WGS84 x must be longitude and y must be latitude.")
  }
  return x to y
}
