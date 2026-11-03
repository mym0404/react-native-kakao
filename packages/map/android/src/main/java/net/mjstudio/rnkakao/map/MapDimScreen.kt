package net.mjstudio.rnkakao.map

import android.graphics.Color
import com.kakao.vectormap.LatLng
import com.kakao.vectormap.shape.DimScreenCover
import com.kakao.vectormap.shape.Polygon
import com.kakao.vectormap.shape.PolygonOptions
import com.kakao.vectormap.shape.ShapeAnimator
import expo.modules.kotlin.exception.CodedException

private const val DIM_INVALID_ARGUMENT = "ERR_KAKAO_MAP_DIM_INVALID_ARGUMENT"
private const val DIM_NOT_FOUND = "ERR_KAKAO_MAP_DIM_NOT_FOUND"
private const val DIM_SHAPE_UNSUPPORTED = "ERR_KAKAO_MAP_SHAPE_UNSUPPORTED"
private const val DIM_NATIVE_ERROR = "ERR_KAKAO_MAP_DIM_NATIVE"

internal class MapDimScreen(
  private val map: com.kakao.vectormap.KakaoMap,
  private val density: Float,
  @Suppress("UNUSED_PARAMETER")
  private val emit: (Map<String, Any>) -> Unit,
) {
  private val highlights = mutableMapOf<String, Polygon>()
  private val animations = mutableMapOf<String, ShapeAnimator>()
  private val styleFingerprints = mutableMapOf<String, String>()
  private var isDisposed = false

  fun apply(options: Map<String, Any?>) =
    native {
      if (isDisposed) throw CodedException(DIM_NOT_FOUND, "The map is no longer available.", null)
      val parsed = parse(options)
      val manager = requireManager()
      val layer = manager.dimScreenLayer
      val nativeStyles =
        parsed.styleSets.associate { style ->
          val id = string(style, "id")
          val fingerprint = fingerprint(style)
          val current = styleFingerprints[id]
          if (current != null && current != fingerprint) {
            invalid("Dim-screen style $id cannot be replaced during a map engine lifetime; use a new style ID.")
          }
          id to mapShapePolygonStylesSet(style, density)
        }
      val availableStyleIds = styleFingerprints.keys + nativeStyles.keys
      val highlightIds = parsed.highlights.map { string(it, "id") }.toSet()
      parsed.highlights.forEach { validateHighlight(it, availableStyleIds) }
      parsed.animations.forEach { animation ->
        mapShapeCircleWaves(animation, density)
        val id = string(animation, "animationId")
        val shapeIds = strings(animation, "shapeIds")
        if (shapeIds.isEmpty()) invalid("Dim-screen animation $id requires a target.")
        unique(shapeIds, "animation target")
        shapeIds.forEach { shapeId ->
          if (shapeId !in highlightIds) invalid("Dim-screen animation $id references unknown highlight $shapeId.")
        }
      }
      clearObjects()
      try {
        nativeStyles.forEach { (id, style) ->
          if (styleFingerprints[id] == null) {
            manager.addPolygonStyles(style)
            styleFingerprints[id] = fingerprint(parsed.styleSets.first { string(it, "id") == id })
          }
        }
        parsed.highlights.forEach { addHighlight(it) }
        parsed.animations.forEach { addAnimation(it) }
        layer.setColor(color(parsed.color))
        layer.setDimScreenCover(cover(parsed.cover))
        parsed.zIndex?.let(layer::setZOrder)
        layer.setVisible(parsed.enabled)
      } catch (error: Throwable) {
        runCatching(::clearObjects)
        throw error
      }
    }

  fun setHighlightVisible(
    id: String,
    visible: Boolean,
  ) = native {
    ensureAlive()
    val highlight = highlights[id] ?: throw CodedException(DIM_NOT_FOUND, "Dim-screen highlight $id was not found.", null)
    if (visible) highlight.show() else highlight.hide()
  }

  fun startAnimation(id: String) =
    native {
      ensureAlive()
      requireAnimation(id).start()
    }

  fun stopAnimation(id: String) =
    native {
      ensureAlive()
      requireAnimation(id).stop()
    }

  fun status(): Map<String, Any?> =
    native {
      ensureAlive()
      val manager = requireManager()
      val nativeHighlights =
        manager.dimScreenLayer.allPolygons.orEmpty().sortedBy(Polygon::getId).map { polygon ->
          mapOf(
            "id" to polygon.id,
            "visible" to polygon.isShow,
            "geometryType" to if (polygon.mapPoints.orEmpty().isNotEmpty()) "geographicPolygon" else "modelPolygon",
          )
        }
      val nativeAnimations =
        animations.keys.sorted().mapNotNull { id ->
          manager.getAnimator(id)?.let { mapOf("id" to it.id, "running" to null) }
        }
      mapOf(
        "enabled" to null,
        "color" to null,
        "cover" to null,
        "highlights" to nativeHighlights,
        "animations" to nativeAnimations,
        "counts" to
          mapOf(
            "highlights" to nativeHighlights.size,
            "animations" to nativeAnimations.size,
          ),
        "capabilities" to
          mapOf(
            "coversRoute" to true,
            "modelHighlights" to true,
            "modelOrientation" to false,
            "animations" to true,
            "animationDuration" to true,
            "animationState" to false,
            "nativeConfigurationState" to false,
          ),
      )
    }

  fun dispose() {
    if (isDisposed) return
    isDisposed = true
    runCatching(::clearObjects)
    animations.clear()
    highlights.clear()
    runCatching { requireManager().dimScreenLayer.setVisible(false) }
  }

  private fun addHighlight(value: Map<String, Any?>) {
    val id = string(value, "id")
    val styleSetId = string(value, "styleSetId")
    val styles =
      requireManager().getPolygonStyles(styleSetId)
        ?: invalid("Highlight $id references unknown style set $styleSetId.")
    val geometry = dictionary(value, "geometry")
    val type = string(geometry, "type")
    val parts = dictionaries(geometry, "parts")
    if (parts.isEmpty()) invalid("Highlight $id requires at least one polygon part.")
    val option =
      PolygonOptions
        .from(id)
        .setStylesSet(styles)
        .setVisible(value["visible"] as? Boolean ?: true)
        .setZOrder(integer(value, "zIndex", 0))
    val polygon =
      when (type) {
        "geographicPolygon" -> {
          option.setMapPoints(parts.map(::mapShapeMapPoints))
          requireManager().dimScreenLayer.addPolygon(option)
        }

        "modelPolygon" -> {
          val base = coordinate(dictionary(geometry, "base"))
          option.setDotPoints(parts.map { mapShapeDotPoints(base, it) })
          requireManager().dimScreenLayer.addPolygon(option)
        }

        else -> {
          invalid("Dim-screen highlights require geographicPolygon or modelPolygon geometry.")
        }
      } ?: invalid("Could not add dim-screen highlight $id.")
    highlights[id] = polygon
  }

  private fun addAnimation(value: Map<String, Any?>) {
    val id = string(value, "animationId")
    val animator =
      requireManager().addAnimator(mapShapeCircleWaves(value, density))
        ?: invalid("Could not add dim-screen animation $id.")
    val shapeIds = strings(value, "shapeIds")
    if (shapeIds.isEmpty()) invalid("Dim-screen animation $id requires a target.")
    animator.addPolygons(
      shapeIds.map { shapeId ->
        highlights[shapeId] ?: invalid("Dim-screen animation $id references unknown highlight $shapeId.")
      },
    )
    animations[id] = animator
  }

  private fun validateHighlight(
    value: Map<String, Any?>,
    availableStyleIds: Set<String>,
  ) {
    val id = string(value, "id")
    val styleSetId = string(value, "styleSetId")
    if (styleSetId !in availableStyleIds) invalid("Highlight $id references unknown style set $styleSetId.")
    if (value.containsKey("visible") && value["visible"] !is Boolean) {
      invalid("Highlight visible must be a boolean.")
    }
    integer(value, "zIndex", 0)
    val geometry = dictionary(value, "geometry")
    val type = string(geometry, "type")
    val parts = dictionaries(geometry, "parts")
    if (parts.isEmpty()) invalid("Highlight $id requires at least one polygon part.")
    when (type) {
      "geographicPolygon" -> {
        parts.map(::mapShapeMapPoints)
      }

      "modelPolygon" -> {
        val orientation =
          if (geometry.containsKey("orientation")) {
            (geometry["orientation"] as? Number)?.toDouble()
              ?: invalid("Model-polygon orientation must be numeric degrees.")
          } else {
            0.0
          }
        if (!orientation.isFinite()) invalid("Model-polygon orientation must be finite degrees.")
        if (orientation != 0.0) {
          throw CodedException(
            DIM_SHAPE_UNSUPPORTED,
            "Android SDK 2.15.2 does not support model-polygon orientation.",
            null,
          )
        }
        val base = coordinate(dictionary(geometry, "base"))
        parts.map { mapShapeDotPoints(base, it) }
      }

      else -> {
        invalid("Dim-screen highlights require geographicPolygon or modelPolygon geometry.")
      }
    }
  }

  private fun clearObjects() {
    val manager = requireManager()
    animations.values.forEach { it.stop() }
    manager.removeAllAnimator()
    manager.dimScreenLayer.clearAll()
    animations.clear()
    highlights.clear()
  }

  private fun requireAnimation(id: String) =
    animations[id] ?: throw CodedException(DIM_NOT_FOUND, "Dim-screen animation $id was not found.", null)

  private fun ensureAlive() {
    if (isDisposed) throw CodedException(DIM_NOT_FOUND, "The dim-screen manager was disposed.", null)
  }

  private fun requireManager() = map.dimScreenManager ?: throw CodedException(DIM_NOT_FOUND, "The dim-screen manager is unavailable.", null)

  private data class ParsedOptions(
    val enabled: Boolean,
    val color: String,
    val cover: String,
    val zIndex: Int?,
    val styleSets: List<Map<String, Any?>>,
    val highlights: List<Map<String, Any?>>,
    val animations: List<Map<String, Any?>>,
  )

  private fun parse(value: Map<String, Any?>): ParsedOptions {
    val enabled = value["enabled"] as? Boolean ?: invalid("Dim-screen enabled is required.")
    val color = string(value, "color")
    color(color)
    val cover = string(value, "cover")
    cover(cover)
    val styleSets = optionalObjects(value, "styleSets")
    val highlights = optionalObjects(value, "highlights")
    val animations = optionalObjects(value, "animations")
    unique(styleSets.map { string(it, "id") }, "dim-screen style")
    unique(highlights.map { string(it, "id") }, "dim-screen highlight")
    unique(animations.map { string(it, "animationId") }, "dim-screen animation")
    return ParsedOptions(
      enabled,
      color,
      cover,
      if (value.containsKey("zIndex")) integer(value, "zIndex", 0) else null,
      styleSets,
      highlights,
      animations,
    )
  }

  private fun cover(value: String) =
    when (value) {
      "map" -> DimScreenCover.Map
      "mapAndRoute" -> DimScreenCover.MapAndRoute
      "mapAndLabel" -> DimScreenCover.MapAndLabel
      "all" -> DimScreenCover.All
      else -> invalid("Unknown dim-screen cover: $value.")
    }

  private fun coordinate(value: Map<String, Any?>): LatLng {
    val latitude = (value["latitude"] as? Number)?.toDouble() ?: invalid("Coordinate latitude is required.")
    val longitude = (value["longitude"] as? Number)?.toDouble() ?: invalid("Coordinate longitude is required.")
    if (!latitude.isFinite() || !longitude.isFinite() || latitude !in -90.0..90.0 || longitude !in -180.0..180.0) {
      invalid("Invalid dim-screen base coordinate.")
    }
    return LatLng.from(latitude, longitude)
  }

  private fun color(value: String): Int {
    if (!Regex("^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$").matches(value)) {
      invalid("Colors must use #RRGGBB or #RRGGBBAA.")
    }
    if (value.length == 7) return Color.parseColor(value)
    val rgba = value.drop(1).toLong(16)
    return Color.argb(
      (rgba and 0xFF).toInt(),
      ((rgba shr 24) and 0xFF).toInt(),
      ((rgba shr 16) and 0xFF).toInt(),
      ((rgba shr 8) and 0xFF).toInt(),
    )
  }

  private fun fingerprint(value: Map<String, Any?>): String = canonical(value)

  private fun canonical(value: Any?): String =
    when (value) {
      null -> {
        "n"
      }

      is String -> {
        "s${value.length}:$value"
      }

      is Boolean -> {
        if (value) "b1" else "b0"
      }

      is Number -> {
        "d${value.toDouble()}"
      }

      is List<*> -> {
        value.joinToString(prefix = "[", postfix = "]", separator = "") { canonical(it) }
      }

      is Map<*, *> -> {
        value.entries
          .map { (key, item) -> (key as? String ?: invalid("Object keys must be strings.")) to item }
          .sortedBy { it.first }
          .joinToString(prefix = "{", postfix = "}", separator = "") { (key, item) -> canonical(key) + canonical(item) }
      }

      else -> {
        invalid("Style values must be serializable.")
      }
    }

  private fun string(
    value: Map<String, Any?>,
    key: String,
  ): String = (value[key] as? String)?.takeIf(String::isNotBlank) ?: invalid("$key must be a nonempty string.")

  private fun strings(
    value: Map<String, Any?>,
    key: String,
  ): List<String> =
    (value[key] as? List<*>)?.map { it as? String ?: invalid("$key must contain strings.") }
      ?: invalid("$key must be a string array.")

  private fun integer(
    value: Map<String, Any?>,
    key: String,
    fallback: Int,
  ): Int {
    if (!value.containsKey(key)) return fallback
    val raw = value[key] ?: invalid("$key must be an integer.")
    val number = (raw as? Number)?.toDouble() ?: invalid("$key must be an integer.")
    if (!number.isFinite() || number % 1.0 != 0.0 || number < Int.MIN_VALUE || number > Int.MAX_VALUE) {
      invalid("$key must be a 32-bit integer.")
    }
    return number.toInt()
  }

  private fun dictionary(
    value: Map<String, Any?>,
    key: String,
  ) = objectMap(value[key])

  private fun dictionaries(
    value: Map<String, Any?>,
    key: String,
  ): List<Map<String, Any?>> = (value[key] as? List<*>)?.map(::objectMap) ?: invalid("$key must be an object array.")

  private fun optionalObjects(
    value: Map<String, Any?>,
    key: String,
  ): List<Map<String, Any?>> {
    if (!value.containsKey(key)) return emptyList()
    val items = value[key] as? List<*> ?: invalid("$key must be an object array.")
    return items.map(::objectMap)
  }

  private fun objectMap(value: Any?): Map<String, Any?> {
    if (value !is Map<*, *>) invalid("Expected an object.")
    return value.entries.associate { (key, item) ->
      (key as? String ?: invalid("Object keys must be strings.")) to item
    }
  }

  private fun unique(
    values: List<String>,
    name: String,
  ) {
    if (values.toSet().size != values.size) invalid("Duplicate $name ID.")
  }

  private fun invalid(message: String): Nothing = throw CodedException(DIM_INVALID_ARGUMENT, message, null)

  private inline fun <T> native(operation: () -> T): T =
    try {
      operation()
    } catch (error: CodedException) {
      throw error
    } catch (error: Throwable) {
      throw CodedException(DIM_NATIVE_ERROR, error.message ?: "The native dim-screen operation failed.", error)
    }
}
