package net.mjstudio.rnkakao.map

import android.graphics.Color
import android.graphics.PointF
import com.kakao.vectormap.KakaoMap
import com.kakao.vectormap.LatLng
import com.kakao.vectormap.animation.Interpolation
import com.kakao.vectormap.shape.DotPoints
import com.kakao.vectormap.shape.LatLngVertex
import com.kakao.vectormap.shape.MapPoints
import com.kakao.vectormap.shape.PointVertex
import com.kakao.vectormap.shape.Polygon
import com.kakao.vectormap.shape.PolygonOptions
import com.kakao.vectormap.shape.PolygonStyle
import com.kakao.vectormap.shape.PolygonStyles
import com.kakao.vectormap.shape.PolygonStylesSet
import com.kakao.vectormap.shape.Polyline
import com.kakao.vectormap.shape.PolylineCap
import com.kakao.vectormap.shape.PolylineOptions
import com.kakao.vectormap.shape.PolylineStyle
import com.kakao.vectormap.shape.PolylineStyles
import com.kakao.vectormap.shape.PolylineStylesSet
import com.kakao.vectormap.shape.ShapeAnimator
import com.kakao.vectormap.shape.ShapeLayer
import com.kakao.vectormap.shape.ShapeLayerOptions
import com.kakao.vectormap.shape.ShapeLayerPass
import com.kakao.vectormap.shape.animation.CircleWave
import com.kakao.vectormap.shape.animation.CircleWaves
import expo.modules.kotlin.exception.CodedException
import kotlin.math.asin
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin

internal class MapShapes(
  map: KakaoMap,
  density: Float,
  private val emit: (String, Map<String, Any?>) -> Unit,
) {
  private val manager = map.shapeManager ?: invalid("Shape manager is unavailable.")
  private val density = density.takeIf { it.isFinite() && it > 0 } ?: invalid("Display density must be positive and finite.")
  private val layers = mutableMapOf<String, ShapeLayer>()
  private val shapes = mutableMapOf<String, ShapeEntry>()
  private val animators = mutableMapOf<String, ShapeAnimator>()
  private val animationTargets = mutableMapOf<String, Set<String>>()
  private val animationNativeIds = mutableMapOf<String, String>()
  private val animatorIdsByDefinition = mutableMapOf<String, String>()
  private val animatorCache = mutableMapOf<String, ShapeAnimator>()
  private val polygonStyles = mutableMapOf<String, PolygonStylesSet>()
  private val polylineStyles = mutableMapOf<String, PolylineStylesSet>()
  private val styleCounts = mutableMapOf<String, Int>()
  private var animationSequence = 0
  private var sceneSequence = 0
  private var replacementSequence = 0
  private val nativePrefix = "rnk-shapes-${System.identityHashCode(this)}"

  fun apply(scene: Map<String, Any?>): Map<String, Any> {
    val styleSpecs = scene.list("styleSets")
    val layerSpecs = scene.list("layers")
    val shapeSpecs = scene.list("shapes")
    validateScene(styleSpecs, layerSpecs, shapeSpecs)
    val nextPolygonStyles = mutableMapOf<String, PolygonStylesSet>()
    val nextPolylineStyles = mutableMapOf<String, PolylineStylesSet>()
    val nextStyleCounts = mutableMapOf<String, Int>()
    val nextLayers = mutableMapOf<String, ShapeLayer>()
    val nextShapes = mutableMapOf<String, ShapeEntry>()
    registerStyles(styleSpecs, nextPolygonStyles, nextPolylineStyles, nextStyleCounts)
    val scenePrefix = "$nativePrefix-scene-${sceneSequence++}"
    try {
      layerSpecs.forEach { addLayer(it, nextLayers, scenePrefix) }
      shapeSpecs.forEach { addShape(it, nextLayers, nextShapes, nextPolygonStyles, nextPolylineStyles) }
    } catch (error: Throwable) {
      nextLayers.values.forEach(manager::remove)
      throw error
    }
    disposeObjects()
    polygonStyles.clear()
    polygonStyles.putAll(nextPolygonStyles)
    polylineStyles.clear()
    polylineStyles.putAll(nextPolylineStyles)
    styleCounts.clear()
    styleCounts.putAll(nextStyleCounts)
    layers.putAll(nextLayers)
    shapes.putAll(nextShapes)
    layerSpecs.forEach { spec -> nextLayers.getValue(spec.string("id")).setVisible(spec.boolean("visible", true)) }
    return counts()
  }

  fun command(command: Map<String, Any?>): Map<String, Any?> =
    when (command.string("type")) {
      "setVisible" -> {
        val targets = entries(command.stringList("ids"))
        val isVisible = command.boolean("visible")
        targets.forEach { it.setVisible(isVisible) }
        none()
      }

      "setPosition" -> {
        entry(command.string("id")).setPosition(command.coordinate("position"))
        none()
      }

      "setZIndex" -> {
        entry(command.string("id")).setZIndex(command.int("zIndex"))
        none()
      }

      "setOrientation" -> {
        throw unsupported("Android Kakao Maps does not expose shape orientation.")
      }

      "changeData" -> {
        changeData(command)
        none()
      }

      "startWave" -> {
        startWave(command.map("animation"))
        none()
      }

      "stopAnimation" -> {
        stopAnimation(command.string("animationId"))
        none()
      }

      "getState" -> {
        state(command.string("id"))
      }

      "getCounts" -> {
        counts()
      }

      "getCapabilities" -> {
        capabilities() + ("type" to "capabilities")
      }

      "remove" -> {
        val ids = command.stringList("ids")
        entries(ids)
        ids.forEach(::remove)
        none()
      }

      else -> {
        invalid("Unknown shape command type.")
      }
    }

  fun capabilities() =
    mapOf(
      "layerPasses" to listOf("default", "overlay", "route"),
      "geographicPrimitives" to true,
      "modelPrimitives" to true,
      "geographicPosition" to true,
      "geographicOrientation" to false,
      "modelPosition" to true,
      "modelOrientation" to false,
      "zIndexMutation" to true,
      "fractionalStyleWidth" to true,
      "waveAnimation" to true,
      "waveTargets" to listOf("polygon"),
      "waveNaturalStopEvent" to false,
    )

  fun resolvePolygon(id: String): Polygon? = shapes[id]?.native as? Polygon

  fun dispose() {
    disposeObjects()
    polygonStyles.clear()
    polylineStyles.clear()
    styleCounts.clear()
  }

  private fun validateScene(
    styleSpecs: List<Map<String, Any?>>,
    layerSpecs: List<Map<String, Any?>>,
    shapeSpecs: List<Map<String, Any?>>,
  ) {
    requireUnique(styleSpecs, "id", "style set")
    requireUnique(layerSpecs, "id", "shape layer")
    requireUnique(shapeSpecs, "id", "shape")
    styleSpecs.forEach(::validateStyleSet)
    layerSpecs.forEach { layer ->
      layer.int("zIndex", DEFAULT_SHAPE_LAYER_Z_INDEX)
      layerPass(layer.stringOrNull("pass") ?: "default")
      layer.boolean("visible", true)
    }
    val styleTypes = styleSpecs.associate { it.string("id") to it.string("type") }
    val layerIds = layerSpecs.mapTo(mutableSetOf()) { it.string("id") }
    shapeSpecs.forEach { spec ->
      spec.int("zIndex", 0)
      spec.boolean("visible", true)
      val geometry = spec.map("geometry")
      val geometryType = geometry.string("type")
      val requiredStyle =
        if (geometryType.contains("Polyline") || geometryType in setOf("geographicCurve", "modelArc", "geographicArc")) {
          "polyline"
        } else {
          "polygon"
        }
      if (spec.string("layerId") !in layerIds) invalid("Shape ${spec.string("id")} references an unknown layer.")
      if (styleTypes[spec.string("styleSetId")] != requiredStyle) {
        invalid("Shape ${spec.string("id")} references an incompatible style set.")
      }
      val normalized = normalizeGeometry(geometry)
      rejectAndroidOrientation(normalized)
      validateGeometry(normalized, styleSpecs.first { it.string("id") == spec.string("styleSetId") }.list("styles").size)
    }
  }

  private fun validateStyleSet(spec: Map<String, Any?>) {
    val styles = spec.list("styles")
    if (styles.isEmpty()) invalid("Shape style sets require styles.")
    when (spec.string("type")) {
      "polygon" -> {
        mapShapePolygonStylesSet(spec)
      }

      "polyline" -> {
        polylineCap(spec.stringOrNull("cap") ?: "square")
        styles.forEach { style ->
          val levels = style.list("levels")
          if (levels.isEmpty()) invalid("Polyline styles require levels.")
          levels.forEach { level ->
            level.int("level")
            if (level.float("width") < 0 || level.float("strokeWidth", 0f) < 0) {
              invalid("Polyline widths must be non-negative.")
            }
            level.color("color")
            level.color("strokeColor", Color.TRANSPARENT)
          }
        }
      }

      else -> {
        invalid("Unknown shape style type.")
      }
    }
  }

  private fun registerStyles(
    specs: List<Map<String, Any?>>,
    targetPolygonStyles: MutableMap<String, PolygonStylesSet>,
    targetPolylineStyles: MutableMap<String, PolylineStylesSet>,
    targetStyleCounts: MutableMap<String, Int>,
  ) {
    specs.forEach { spec ->
      val id = spec.string("id")
      val nativeSpec = spec + ("id" to mapStyleNativeID("rnk-shape-style", spec))
      if (spec.string("type") == "polygon") {
        targetPolygonStyles[id] = manager.addPolygonStyles(mapShapePolygonStylesSet(nativeSpec, density))
      } else {
        val styles =
          spec.list("styles").map { style ->
            PolylineStyles.from(
              style.list("levels").map { level ->
                PolylineStyle.from(
                  level.int("level"),
                  level.float("width") * density,
                  level.color("color"),
                  level.float("strokeWidth", 0f) * density,
                  level.color("strokeColor", Color.TRANSPARENT),
                )
              },
            )
          }
        val set = PolylineStylesSet.from(nativeSpec.string("id"), styles).setPolylineCap(polylineCap(spec.stringOrNull("cap") ?: "square"))
        targetPolylineStyles[id] = manager.addPolylineStyles(set)
      }
      targetStyleCounts[id] = spec.list("styles").size
    }
  }

  private fun addLayer(
    spec: Map<String, Any?>,
    targetLayers: MutableMap<String, ShapeLayer>,
    scenePrefix: String,
  ) {
    val id = spec.string("id")
    val options =
      ShapeLayerOptions
        .from(
          "$scenePrefix-layer-$id",
          spec.int("zIndex", DEFAULT_SHAPE_LAYER_Z_INDEX),
          layerPass(spec.stringOrNull("pass") ?: "default"),
        ).setVisible(false)
    targetLayers[id] = manager.addLayer(options) ?: invalid("Could not create shape layer $id.")
  }

  private fun addShape(
    spec: Map<String, Any?>,
    targetLayers: Map<String, ShapeLayer>,
    targetShapes: MutableMap<String, ShapeEntry>,
    targetPolygonStyles: Map<String, PolygonStylesSet>,
    targetPolylineStyles: Map<String, PolylineStylesSet>,
    nativeId: String = spec.string("id"),
  ) {
    val id = spec.string("id")
    val layerId = spec.string("layerId")
    val layer = targetLayers[layerId] ?: invalid("Unknown shape layer $layerId.")
    val styleId = spec.string("styleSetId")
    val rawGeometry = spec.map("geometry")
    val geometryType = rawGeometry.string("type")
    val geometry = normalizeGeometry(rawGeometry)
    val entry =
      when (geometry.string("type")) {
        "geographicPolygon" -> {
          val options =
            PolygonOptions
              .from(
                nativeId,
              ).setStylesSet(targetPolygonStyles[styleId] ?: unknown("polygon style set", styleId))
              .setZOrder(spec.int("zIndex", 0))
              .setVisible(spec.boolean("visible", true))
          geometry.list("parts").forEach { options.addPolygon(mapShapeMapPoints(it), it.int("styleIndex", 0)) }
          ShapeEntry(layerId, geometryType, layer.addPolygon(options) ?: invalid("Could not create polygon $id."))
        }

        "modelPolygon" -> {
          rejectAndroidOrientation(geometry)
          val options =
            PolygonOptions
              .from(
                nativeId,
              ).setStylesSet(targetPolygonStyles[styleId] ?: unknown("polygon style set", styleId))
              .setZOrder(spec.int("zIndex", 0))
              .setVisible(spec.boolean("visible", true))
          geometry.list("parts").forEach {
            options.addPolygon(mapShapeDotPoints(geometry.coordinate("base"), it), it.int("styleIndex", 0))
          }
          ShapeEntry(layerId, geometryType, layer.addPolygon(options) ?: invalid("Could not create model polygon $id."))
        }

        "geographicPolyline", "geographicCurve" -> {
          val options =
            PolylineOptions
              .from(
                nativeId,
              ).setStylesSet(targetPolylineStyles[styleId] ?: unknown("polyline style set", styleId))
              .setZOrder(spec.int("zIndex", 0))
              .setVisible(spec.boolean("visible", true))
          geometry.list("parts").forEach { options.addPolyline(mapLine(it), it.int("styleIndex", 0), 0) }
          ShapeEntry(layerId, geometryType, layer.addPolyline(options) ?: invalid("Could not create polyline $id."))
        }

        "modelPolyline" -> {
          rejectAndroidOrientation(geometry)
          val options =
            PolylineOptions
              .from(
                nativeId,
              ).setStylesSet(targetPolylineStyles[styleId] ?: unknown("polyline style set", styleId))
              .setZOrder(spec.int("zIndex", 0))
              .setVisible(spec.boolean("visible", true))
          geometry
            .list(
              "parts",
            ).forEach { options.addPolyline(dotLine(geometry.coordinate("base"), it), it.int("styleIndex", 0), 0) }
          ShapeEntry(layerId, geometryType, layer.addPolyline(options) ?: invalid("Could not create model polyline $id."))
        }

        else -> {
          invalid("Unsupported normalized shape geometry.")
        }
      }
    targetShapes[id] = entry
  }

  private fun normalizeGeometry(geometry: Map<String, Any?>): Map<String, Any?> =
    when (geometry.string("type")) {
      "modelCircle" -> geometry.primitiveModel(circle = true)
      "modelRectangle" -> geometry.primitiveModel(circle = false)
      "geographicCircle" -> geometry.primitiveGeographic(circle = true)
      "geographicRectangle" -> geometry.primitiveGeographic(circle = false)
      "geographicCurve" -> geometry.curveGeometry()
      "modelArc" -> geometry.modelArcGeometry()
      "geographicArc" -> geometry.geographicArcGeometry()
      else -> geometry
    }

  private fun changeData(command: Map<String, Any?>) {
    val id = command.string("id")
    val old = entry(id)
    val styleId = command.string("styleSetId")
    val geometry = normalizeGeometry(command.map("geometry"))
    rejectAndroidOrientation(geometry)
    val expectsPolyline = geometry.string("type").contains("Polyline") || geometry.string("type") == "geographicCurve"
    if ((expectsPolyline && styleId !in polylineStyles) || (!expectsPolyline && styleId !in polygonStyles)) {
      invalid("Shape $id references an incompatible style set.")
    }
    validateGeometry(geometry, styleCounts[styleId] ?: invalid("Unknown shape style set $styleId."))
    val visible = old.visible()
    val zIndex = old.zIndex()
    val spec =
      mapOf(
        "id" to id,
        "layerId" to old.layerId,
        "styleSetId" to styleId,
        "zIndex" to zIndex,
        "visible" to false,
        "geometry" to command.map("geometry"),
      )
    val replacement = mutableMapOf<String, ShapeEntry>()
    addShape(
      spec,
      layers,
      replacement,
      polygonStyles,
      polylineStyles,
      "$nativePrefix-replacement-${replacementSequence++}",
    )
    remove(id)
    replacement.getValue(id).also {
      it.setVisible(visible)
      shapes[id] = it
    }
  }

  private fun startWave(animation: Map<String, Any?>) {
    val id = animation.string("animationId")
    if (id.isBlank()) invalid("Shape animationId must not be empty.")
    if (animators.containsKey(id)) invalid("Shape animation $id already exists.")
    val definition = mapCanonicalValue(animation - "animationId")
    val nativeId =
      animatorIdsByDefinition.getOrPut(definition) {
        "rnk-shape-${System.identityHashCode(this)}-${animationSequence++}"
      }
    if (nativeId in animationNativeIds.values) invalid("An equivalent shape animation is already running.")
    val polygons =
      animation.stringList("shapeIds").map { shapeId ->
        val native = entry(shapeId).native
        native as? Polygon ?: invalid("Wave animation supports polygons only: $shapeId.")
      }
    if (polygons.isEmpty()) invalid("Shape wave animation requires shapeIds.")
    val animator =
      animatorCache[nativeId] ?: run {
        val effect = mapShapeCircleWaves(animation + ("animationId" to nativeId), density)
        (manager.addAnimator(effect) ?: invalid("Could not create shape animation $id.")).also {
          animatorCache[nativeId] = it
        }
      }
    animator.removeAllPolygon()
    animator.addPolygons(polygons)
    animators[id] = animator
    animationTargets[id] = animation.stringList("shapeIds").toSet()
    animationNativeIds[id] = nativeId
    animator.start()
  }

  private fun stopAnimation(id: String) {
    val animator = animators.remove(id) ?: unknown("shape animation", id)
    animationTargets.remove(id)
    animationNativeIds.remove(id)
    animator.stop()
    animator.removeAllPolygon()
    emit("onShapeAnimationStop", mapOf("animationId" to id))
  }

  private fun remove(id: String) {
    animationTargets
      .filterValues { id in it }
      .keys
      .toList()
      .forEach(::stopAnimation)
    val shape = shapes.remove(id) ?: unknown("shape", id)
    shape.remove()
  }

  private fun disposeObjects() {
    animators.values.forEach {
      it.stop()
      it.removeAllPolygon()
    }
    animators.clear()
    animationTargets.clear()
    animationNativeIds.clear()
    layers.values.forEach(manager::remove)
    layers.clear()
    shapes.clear()
  }

  private fun state(id: String): Map<String, Any?> {
    val value = entry(id)
    return mapOf(
      "type" to "state",
      "id" to id,
      "layerId" to value.layerId,
      "visible" to value.visible(),
      "zIndex" to value.zIndex(),
      "geometryType" to value.geometryType,
      "position" to null,
      "orientation" to null,
    )
  }

  private fun counts() = mapOf("type" to "counts", "layers" to layers.size, "shapes" to shapes.size, "animations" to animators.size)

  private fun none() = mapOf<String, Any?>("type" to "none")

  private fun entry(id: String) = shapes[id] ?: unknown("shape", id)

  private fun entries(ids: List<String>): List<ShapeEntry> {
    if (ids.toSet().size != ids.size) invalid("Shape command IDs must be unique.")
    return ids.map(::entry)
  }

  private data class ShapeEntry(
    val layerId: String,
    val geometryType: String,
    val native: Any,
  ) {
    fun setVisible(visible: Boolean) =
      when (val value = native) {
        is Polygon -> if (visible) value.show() else value.hide()
        is Polyline -> if (visible) value.show() else value.hide()
        else -> Unit
      }

    fun visible() =
      when (val value = native) {
        is Polygon -> value.isShow
        is Polyline -> value.isShow
        else -> false
      }

    fun zIndex() =
      when (val value = native) {
        is Polygon -> value.zOrder
        is Polyline -> value.zOrder
        else -> 0
      }

    fun setPosition(position: LatLng) =
      when (val value = native) {
        is Polygon -> value.setPosition(position)
        is Polyline -> value.setPosition(position)
        else -> Unit
      }

    fun setZIndex(zIndex: Int) =
      when (val value = native) {
        is Polygon -> value.setZOrder(zIndex)
        is Polyline -> value.setZOrder(zIndex)
        else -> Unit
      }

    fun remove() =
      when (val value = native) {
        is Polygon -> value.remove()
        is Polyline -> value.remove()
        else -> Unit
      }
  }
}

private const val SHAPE_ERROR = "ERR_KAKAO_MAP_SHAPE"
private const val DEFAULT_SHAPE_LAYER_Z_INDEX = 10_000
private const val EARTH_RADIUS_METERS = 6_378_137.0

internal fun mapStyleNativeID(
  prefix: String,
  spec: Map<String, Any?>,
): String {
  val canonical = mapCanonicalValue(spec)
  return "$prefix-${canonical.length}-${canonical.hashCode().toUInt().toString(16)}"
}

internal fun mapCanonicalValue(value: Any?): String =
  when (value) {
    null -> {
      "n"
    }

    is Map<*, *> -> {
      value.entries
        .sortedBy { it.key.toString() }
        .joinToString(prefix = "{", postfix = "}") { entry ->
          val key = entry.key.toString()
          "${key.length}:$key=${mapCanonicalValue(entry.value)}"
        }
    }

    is List<*> -> {
      value.joinToString(prefix = "[", postfix = "]", transform = ::mapCanonicalValue)
    }

    is String -> {
      "s${value.length}:$value"
    }

    is Number -> {
      "d${value.toDouble()}"
    }

    is Boolean -> {
      if (value) "t" else "f"
    }

    else -> {
      "o${value.toString().length}:$value"
    }
  }

private fun validateGeometry(
  geometry: Map<String, Any?>,
  styleCount: Int,
) {
  val type = geometry.string("type")
  val parts =
    when (type) {
      "geographicPolygon", "modelPolygon", "geographicPolyline", "modelPolyline" -> geometry.list("parts")
      else -> emptyList()
    }
  if (parts.isEmpty() &&
    type in setOf("geographicPolygon", "modelPolygon", "geographicPolyline", "modelPolyline")
  ) {
    invalid("Shape geometry requires parts.")
  }
  parts.forEach { part ->
    val index = part.int("styleIndex", 0)
    if (index !in 0 until styleCount) invalid("Shape styleIndex $index is out of range.")
    val points = (part["outer"] ?: part["points"]) as? List<*> ?: invalid("Shape part requires points.")
    val minimum = if (type.contains("Polygon")) 3 else 2
    if (points.size < minimum) invalid("Shape part requires at least $minimum points.")
    if (type.contains("Polygon")) {
      part.listOrNull("holes")?.forEach { hole ->
        if (hole.size < 3) invalid("Shape polygon holes require at least 3 points.")
      }
    }
  }
  when (type) {
    "geographicPolygon" -> {
      parts.forEach(::mapShapeMapPoints)
    }

    "modelPolygon" -> {
      val base = geometry.coordinate("base")
      parts.forEach { mapShapeDotPoints(base, it) }
      geometry.double("orientation", 0.0)
    }

    "geographicPolyline", "geographicCurve" -> {
      parts.forEach(::mapLine)
    }

    "modelPolyline" -> {
      val base = geometry.coordinate("base")
      parts.forEach { dotLine(base, it) }
      geometry.double("orientation", 0.0)
    }
  }
}

private fun Map<String, Any?>.primitiveModel(circle: Boolean): Map<String, Any?> {
  val base = map("base")
  val points =
    if (circle) {
      circlePoints(
        double("radius"),
        int("pointCount", 64),
        boolean("clockwise", true),
      )
    } else {
      rectanglePoints(double("width"), double("height"), boolean("clockwise", true))
    }
  return mapOf(
    "type" to "modelPolygon",
    "base" to base,
    "orientation" to double("orientation", 0.0),
    "parts" to listOf(mapOf("outer" to points, "styleIndex" to int("styleIndex", 0))),
  )
}

private fun Map<String, Any?>.primitiveGeographic(circle: Boolean): Map<String, Any?> {
  val center = coordinate("center")
  val points =
    if (circle) {
      geographicCircle(
        center,
        double("radius"),
        int("pointCount", 64),
        boolean("clockwise", true),
      )
    } else {
      geographicRectangle(center, double("width"), double("height"), boolean("clockwise", true))
    }
  return mapOf("type" to "geographicPolygon", "parts" to listOf(mapOf("outer" to points, "styleIndex" to int("styleIndex", 0))))
}

private fun Map<String, Any?>.curveGeometry(): Map<String, Any?> {
  val start = coordinate("start")
  val end = coordinate("end")
  val left =
    when (string("side")) {
      "left" -> true
      "right" -> false
      else -> invalid("Curve side must be left or right.")
    }
  val points = quadraticCurve(start, end, left)
  return mapOf("type" to "geographicCurve", "parts" to listOf(mapOf("points" to points, "styleIndex" to int("styleIndex", 0))))
}

private fun Map<String, Any?>.modelArcGeometry(): Map<String, Any?> =
  mapOf(
    "type" to "modelPolyline",
    "base" to map("base"),
    "orientation" to double("orientation", 0.0),
    "parts" to listOf(mapOf("points" to arcPoints(), "styleIndex" to int("styleIndex", 0))),
  )

private fun Map<String, Any?>.geographicArcGeometry(): Map<String, Any?> {
  val center = coordinate("center")
  return mapOf(
    "type" to "geographicPolyline",
    "parts" to
      listOf(
        mapOf(
          "points" to arcPoints().map { offset(center, it.getValue("x"), it.getValue("y")) },
          "styleIndex" to int("styleIndex", 0),
        ),
      ),
  )
}

private fun Map<String, Any?>.arcPoints(): List<Map<String, Double>> {
  val radius = double("radius")
  val count = int("pointCount", 64)
  if (radius <= 0 || count < 2) invalid("Arc radius must be positive and pointCount at least 2.")
  val startDegrees = double("startAngle")
  val endDegrees = double("endAngle")
  val clockwise = boolean("clockwise", true)
  val (start, sweep) = arcAngles(startDegrees, endDegrees, clockwise)
  return List(count) { index ->
    val angle = start + sweep * index / (count - 1)
    mapOf("x" to radius * sin(angle), "y" to radius * cos(angle))
  }
}

private fun arcAngles(
  start: Double,
  end: Double,
  clockwise: Boolean,
): Pair<Double, Double> {
  val normalizedStart = normalizedDegrees(start)
  val normalizedEnd = normalizedDegrees(end)
  val delta = normalizedEnd - normalizedStart
  val sweep =
    if (delta == 0.0) {
      if (start == end) {
        0.0
      } else if (clockwise) {
        360.0
      } else {
        -360.0
      }
    } else if (clockwise) {
      if (delta > 0) delta else delta + 360.0
    } else {
      if (delta < 0) delta else delta - 360.0
    }
  return Math.toRadians(normalizedStart) to Math.toRadians(sweep)
}

private fun normalizedDegrees(value: Double): Double {
  val remainder = value % 360.0
  return if (remainder < 0) remainder + 360.0 else remainder
}

internal fun mapShapeMapPoints(part: Map<String, Any?>): MapPoints {
  val value = MapPoints.fromLatLng(part.coordinateList("outer"))
  val holes =
    part
      .listOrNull("holes")
      ?.map { hole -> LatLngVertex.from(hole.map { it.coordinateValue() }) }
      .orEmpty()
  if (holes.isNotEmpty()) value.setHolePoints(*holes.toTypedArray())
  return value.setMergeOverlappingHoles(part.boolean("mergeOverlappedHoles", false))
}

private fun mapLine(part: Map<String, Any?>) = MapPoints.fromLatLng(part.coordinateList("points"))

internal fun mapShapeDotPoints(
  base: LatLng,
  part: Map<String, Any?>,
): DotPoints {
  val value = DotPoints.fromPoints(base, part.pointList("outer"), true)
  val holes =
    part
      .listOrNull("holes")
      ?.map { hole -> PointVertex.fromPoint(hole.map { point -> point.pointValue() }, true) }
      .orEmpty()
  if (holes.isNotEmpty()) value.setHolePoints(*holes.toTypedArray())
  return value.setMergeOverlappingHoles(part.boolean("mergeOverlappedHoles", false))
}

private fun dotLine(
  base: LatLng,
  part: Map<String, Any?>,
) = DotPoints.fromPoints(base, part.pointList("points"), true)

private fun layerPass(value: String) =
  when (value) {
    "default" -> ShapeLayerPass.Default
    "overlay" -> ShapeLayerPass.Overlay
    "route" -> ShapeLayerPass.Route
    else -> invalid("Unknown shape layer pass $value.")
  }

private fun polylineCap(value: String) =
  when (value) {
    "butt" -> PolylineCap.Butt
    "round" -> PolylineCap.Round
    "square" -> PolylineCap.Square
    else -> invalid("Unknown polyline cap $value.")
  }

private fun interpolation(value: String) =
  when (value) {
    "linear" -> Interpolation.Linear
    "cubicIn" -> Interpolation.CubicIn
    "cubicOut" -> Interpolation.CubicOut
    "cubicInOut" -> Interpolation.CubicInOut
    else -> invalid("Unknown interpolation $value.")
  }

internal fun mapShapePolygonStylesSet(
  spec: Map<String, Any?>,
  density: Float = 1f,
): PolygonStylesSet =
  PolygonStylesSet.from(
    spec.string("id"),
    spec.list("styles").map { style ->
      val levels = style.list("levels")
      if (levels.isEmpty()) invalid("Polygon styles require levels.")
      PolygonStyles.from(
        levels.map { level ->
          val strokeWidth = level.float("strokeWidth", 0f)
          if (strokeWidth < 0) invalid("Polygon strokeWidth must be non-negative.")
          PolygonStyle.from(
            level.int("level"),
            level.color("fillColor"),
            strokeWidth * density,
            level.color("strokeColor", Color.TRANSPARENT),
          )
        },
      )
    },
  )

internal fun mapShapeCircleWaves(
  animation: Map<String, Any?>,
  density: Float = 1f,
): CircleWaves {
  val duration = animation.int("duration")
  if (duration <= 0) invalid("Shape animation duration must be positive.")
  val repeat = animation.int("repeat", 1)
  if (repeat <= 0) invalid("Shape animation repeat must be positive.")
  val waves =
    animation.list("frames").map { frame ->
      val startAlpha = frame.float("startAlpha")
      val endAlpha = frame.float("endAlpha")
      val startRadius = frame.float("startRadius")
      val endRadius = frame.float("endRadius")
      if (startAlpha !in 0f..1f || endAlpha !in 0f..1f) invalid("Shape animation alpha must be between 0 and 1.")
      if (startRadius < 0f || endRadius < 0f) invalid("Shape animation radius must be non-negative.")
      CircleWave.from(
        frame.int("level"),
        startAlpha,
        endAlpha,
        startRadius * density,
        endRadius * density,
      )
    }
  if (waves.isEmpty()) invalid("Shape wave animation requires frames.")
  return CircleWaves
    .from(animation.string("animationId"), *waves.toTypedArray())
    .setDuration(duration)
    .setRepeatCount(repeat)
    .setHideShapeAtStop(animation.boolean("hideAtStop", false))
    .setInterpolation(interpolation(animation.stringOrNull("interpolation") ?: "linear"))
}

private fun rejectAndroidOrientation(geometry: Map<String, Any?>) {
  if (geometry.double("orientation", 0.0) != 0.0) throw unsupported("Android Kakao Maps does not expose shape orientation.")
}

private fun circlePoints(
  radius: Double,
  count: Int,
  clockwise: Boolean,
): List<Map<String, Double>> {
  if (radius <= 0 || count < 3) invalid("Circle radius must be positive and pointCount at least 3.")
  val sign = if (clockwise) 1 else -1
  return List(count) { index ->
    val angle = sign * 2 * Math.PI * index / count
    mapOf("x" to radius * cos(angle), "y" to radius * sin(angle))
  }
}

private fun rectanglePoints(
  width: Double,
  height: Double,
  clockwise: Boolean,
): List<Map<String, Double>> {
  if (width <= 0 || height <= 0) invalid("Rectangle dimensions must be positive.")
  val points =
    listOf(
      mapOf("x" to -width / 2, "y" to -height / 2),
      mapOf("x" to width / 2, "y" to -height / 2),
      mapOf(
        "x" to width / 2,
        "y" to height / 2,
      ),
      mapOf("x" to -width / 2, "y" to height / 2),
    )
  return if (clockwise) points else points.reversed()
}

private fun geographicCircle(
  center: LatLng,
  radius: Double,
  count: Int,
  clockwise: Boolean,
) = circlePoints(radius, count, clockwise).map { offset(center, it.getValue("x"), it.getValue("y")) }

private fun geographicRectangle(
  center: LatLng,
  width: Double,
  height: Double,
  clockwise: Boolean,
) = rectanglePoints(width, height, clockwise).map { offset(center, it.getValue("x"), it.getValue("y")) }

private fun offset(
  center: LatLng,
  east: Double,
  north: Double,
): Map<String, Double> {
  val distance = kotlin.math.sqrt(east * east + north * north)
  val bearing = atan2(east, north)
  val latitude = Math.toRadians(center.latitude)
  val longitude = Math.toRadians(center.longitude)
  val angular = distance / EARTH_RADIUS_METERS
  val targetLatitude = asin(sin(latitude) * cos(angular) + cos(latitude) * sin(angular) * cos(bearing))
  val targetLongitude = longitude + atan2(sin(bearing) * sin(angular) * cos(latitude), cos(angular) - sin(latitude) * sin(targetLatitude))
  return mapOf("latitude" to Math.toDegrees(targetLatitude), "longitude" to Math.toDegrees(targetLongitude))
}

private fun quadraticCurve(
  start: LatLng,
  end: LatLng,
  left: Boolean,
): List<Map<String, Double>> {
  val dx = end.longitude - start.longitude
  val dy = end.latitude - start.latitude
  val side = if (left) 0.25 else -0.25
  val controlLat = (start.latitude + end.latitude) / 2 + dx * side
  val controlLng = (start.longitude + end.longitude) / 2 - dy * side
  return List(33) { index ->
    val t = index / 32.0
    val u = 1 - t
    mapOf(
      "latitude" to u * u * start.latitude + 2 * u * t * controlLat + t * t * end.latitude,
      "longitude" to u * u * start.longitude + 2 * u * t * controlLng + t * t * end.longitude,
    )
  }
}

private fun requireUnique(
  values: List<Map<String, Any?>>,
  key: String,
  noun: String,
) {
  val ids = values.map { it.string(key) }
  if (ids.any(String::isBlank)) invalid("$noun ID must not be empty.")
  if (ids.toSet().size != ids.size) invalid("Duplicate $noun ID.")
}

private fun Map<String, Any?>.map(key: String) = this[key] as? Map<String, Any?> ?: invalid("$key must be an object.")

private fun Map<String, Any?>.list(key: String): List<Map<String, Any?>> {
  if (!containsKey(key)) return emptyList()
  val raw = this[key] as? List<*> ?: invalid("$key must be an array of objects.")
  return raw.map { it as? Map<String, Any?> ?: invalid("$key must contain objects.") }
}

private fun Map<String, Any?>.listOrNull(key: String): List<List<*>>? {
  if (!containsKey(key)) return null
  val raw = this[key] as? List<*> ?: invalid("$key must be an array of arrays.")
  return raw.map {
    it as? List<*>
      ?: invalid("$key must contain arrays.")
  }
}

private fun Map<String, Any?>.string(key: String) = this[key] as? String ?: invalid("$key must be a string.")

private fun Map<String, Any?>.stringOrNull(key: String): String? {
  if (!containsKey(key)) return null
  return this[key] as? String ?: invalid("$key must be a string.")
}

private fun Map<String, Any?>.stringList(key: String) =
  (this[key] as? List<*>)?.map { it as? String ?: invalid("$key must contain strings.") } ?: invalid("$key must be an array.")

private fun Map<String, Any?>.boolean(
  key: String,
  fallback: Boolean? = null,
): Boolean {
  if (!containsKey(key)) return fallback ?: invalid("$key must be a boolean.")
  return this[key] as? Boolean ?: invalid("$key must be a boolean.")
}

private fun Map<String, Any?>.double(
  key: String,
  fallback: Double? = null,
): Double {
  if (!containsKey(key)) return fallback ?: invalid("$key must be finite.")
  return (this[key] as? Number)?.toDouble()?.takeIf { it.isFinite() } ?: invalid("$key must be finite.")
}

private fun Map<String, Any?>.float(
  key: String,
  fallback: Float? = null,
) = double(key, fallback?.toDouble()).toFloat()

private fun Map<String, Any?>.int(
  key: String,
  fallback: Int? = null,
): Int {
  val value = double(key, fallback?.toDouble())
  if (value % 1 !=
    0.0 ||
    value !in Int.MIN_VALUE.toDouble()..Int.MAX_VALUE.toDouble()
  ) {
    invalid("$key must be an integer.")
  }
  return value.toInt()
}

private fun Map<String, Any?>.color(
  key: String,
  fallback: Int? = null,
): Int {
  if (!containsKey(key)) return fallback ?: invalid("$key must be a color.")
  return (this[key] as? String)?.let(::parseColor) ?: invalid("$key must be a color.")
}

private fun Map<String, Any?>.coordinate(key: String) = map(key).coordinateValue()

private fun Map<String, Any?>.coordinateList(key: String) =
  (this[key] as? List<*>)?.map { it.coordinateValue() } ?: invalid("$key must be an array.")

private fun Map<String, Any?>.pointList(key: String) = (this[key] as? List<*>)?.map { it.pointValue() } ?: invalid("$key must be an array.")

private fun Any?.coordinateValue(): LatLng {
  val value =
    this as? Map<String, Any?> ?: invalid("Coordinate must be an object.")
  val latitude = value.double("latitude")
  val longitude = value.double("longitude")
  if (latitude !in
    -90.0..90.0 ||
    longitude !in -180.0..180.0
  ) {
    invalid("Invalid coordinate.")
  }
  return LatLng.from(latitude, longitude)
}

private fun Any?.pointValue(): PointF {
  val value =
    this as? Map<String, Any?> ?: invalid("Point must be an object.")
  return PointF(value.float("x"), value.float("y"))
}

private fun parseColor(value: String): Int {
  if (!Regex("^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$").matches(value)) invalid("Colors must be #RRGGBB or #RRGGBBAA.")
  val raw = value.drop(1)
  return if (raw.length ==
    6
  ) {
    Color.parseColor(value)
  } else {
    ((raw.takeLast(2).toLong(16) shl 24) or raw.dropLast(2).toLong(16)).toInt()
  }
}

private fun invalid(message: String): Nothing = throw CodedException("${SHAPE_ERROR}_INVALID_ARGUMENT", message, null)

private fun unsupported(message: String): CodedException = CodedException("${SHAPE_ERROR}_UNSUPPORTED", message, null)

private fun unknown(
  noun: String,
  id: String,
): Nothing = throw CodedException("${SHAPE_ERROR}_NOT_FOUND", "Unknown $noun $id.", null)
