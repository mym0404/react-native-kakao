package net.mjstudio.rnkakao.map

import android.graphics.Bitmap
import android.graphics.Color
import com.kakao.vectormap.CurveType
import com.kakao.vectormap.KakaoMap
import com.kakao.vectormap.LatLng
import com.kakao.vectormap.animation.Interpolation
import com.kakao.vectormap.route.RouteLine
import com.kakao.vectormap.route.RouteLineAnimator
import com.kakao.vectormap.route.RouteLineLayer
import com.kakao.vectormap.route.RouteLineOptions
import com.kakao.vectormap.route.RouteLinePattern
import com.kakao.vectormap.route.RouteLineSegment
import com.kakao.vectormap.route.RouteLineStyle
import com.kakao.vectormap.route.RouteLineStyles
import com.kakao.vectormap.route.RouteLineStylesSet
import com.kakao.vectormap.route.animation.ProgressAnimation
import com.kakao.vectormap.route.animation.ProgressDirection
import com.kakao.vectormap.route.animation.ProgressType
import expo.modules.kotlin.exception.CodedException
import java.lang.ref.WeakReference

internal class MapRoutes(
  map: KakaoMap,
  density: Float,
  private val imageLoader: MapImageLoader,
  private val emit: (String, Map<String, Any>) -> Unit,
) {
  private val manager = map.routeLineManager ?: invalidRoute("Route manager is unavailable.")
  private val density = density.takeIf { it.isFinite() && it > 0 } ?: invalidRoute("Display density must be positive and finite.")
  private val layers = mutableMapOf<String, RouteLineLayer>()
  private val routes = mutableMapOf<String, RouteLine>()
  private val styleSets = mutableMapOf<String, RouteLineStylesSet>()
  private val styleCounts = mutableMapOf<String, Int>()
  private val animators = mutableMapOf<String, RouteLineAnimator>()
  private val animationTargets = mutableMapOf<String, Set<String>>()
  private val animationNativeIds = mutableMapOf<String, String>()
  private val animationRunEpochs = mutableMapOf<String, Long>()
  private val animatorIdsByDefinition = mutableMapOf<String, String>()
  private val animatorCache = mutableMapOf<String, RouteLineAnimator>()
  private val animatorTargetIds = mutableMapOf<String, Set<String>>()
  private val animatorsNeedingTargets = mutableSetOf<String>()
  private val requestedProgress = mutableMapOf<String, Float>()
  private val progressEpochs = mutableMapOf<String, Long>()
  private val routeLayerIds = mutableMapOf<String, String>()
  private val pendingImages = mutableSetOf<MapImageLoadToken>()
  private var pendingApply: ((Result<Map<String, Any>>) -> Unit)? = null
  private var generation = 0
  private var animationSequence = 0
  private var animationRunSequence = 0L
  private var sceneSequence = 0
  private var replacementSequence = 0
  private val nativePrefix = "rnk-routes-${System.identityHashCode(this)}"

  fun apply(
    scene: Map<String, Any?>,
    completion: (Result<Map<String, Any>>) -> Unit,
  ) {
    rejectPendingApply("${ROUTE_ERROR}_SUPERSEDED", "The route scene was superseded by a newer update.")
    pendingImages.forEach(MapImageLoadToken::cancel)
    pendingImages.clear()
    val token = ++generation
    val styleSpecs = scene.list("styleSets")
    val layerSpecs = scene.list("layers")
    val routeSpecs = scene.list("routes")
    validateScene(styleSpecs, layerSpecs, routeSpecs)
    pendingApply = completion
    val uris =
      styleSpecs
        .flatMap { it.list("patterns") }
        .flatMap { pattern ->
          listOfNotNull(pattern.map("image").string("uri"), pattern.mapOrNull("symbol")?.string("uri"))
        }.toSet()
    if (uris.isEmpty()) {
      val result = runCatching { buildScene(styleSpecs, layerSpecs, routeSpecs, emptyMap()) }
      pendingApply = null
      completion(result)
      return
    }
    val images = mutableMapOf<String, Bitmap>()
    val requests = mutableListOf<MapImageLoadToken>()
    var isCompleted = false
    val managerReference = WeakReference(this)

    fun finish(result: Result<Map<String, Any>>) {
      val owner = managerReference.get() ?: return
      if (isCompleted || token != owner.generation) return
      isCompleted = true
      if (result.isFailure) requests.forEach(MapImageLoadToken::cancel)
      requests.forEach(owner.pendingImages::remove)
      owner.pendingApply = null
      completion(result)
    }
    uris.forEach { uri ->
      val request =
        imageLoader.load(uri) { result ->
          result.fold(
            onSuccess = { bitmap ->
              images[uri] = bitmap
              if (images.size == uris.size) {
                managerReference.get()?.let { owner ->
                  finish(runCatching { owner.buildScene(styleSpecs, layerSpecs, routeSpecs, images) })
                }
              }
            },
            onFailure = { error -> finish(Result.failure(error)) },
          )
        }
      requests += request
      pendingImages += request
    }
  }

  fun command(command: Map<String, Any?>): Map<String, Any?> =
    when (command.string("type")) {
      "setVisible" -> {
        val targets = routeEntries(command.stringList("ids"))
        val isVisible = command.boolean("visible")
        targets.forEach { if (isVisible) it.show() else it.hide() }
        none()
      }

      "setZIndex" -> {
        route(command.string("id")).setZOrder(command.int("zIndex"))
        none()
      }

      "changeData" -> {
        val id = command.string("id")
        val value = route(id)
        val styleId = command.string("styleSetId")
        val style = style(styleId)
        val styleCount = styleCounts[styleId] ?: unknownRoute("route style set", styleId)
        val segments = command.list("segments")
        validateSegments(segments, styleCount)
        invalidateProgressRequest(id)
        val layer = value.layer ?: invalidRoute("Route $id has no layer.")
        val isVisible = value.isShow
        val options =
          RouteLineOptions
            .from(
              "$nativePrefix-replacement-${replacementSequence++}",
              segments.map { routeSegment(it, style) },
            ).setStylesSet(style)
            .setZOrder(value.zOrder)
            .setVisible(false)
        val replacement = layer.addRouteLine(options) ?: invalidRoute("Could not replace route $id.")
        replacement.setProgress(value.progress)
        stopAnimationsForRoute(id)
        invalidateCachedAnimationsForRoute(id)
        value.remove()
        if (isVisible) replacement.show()
        routes[id] = replacement
        none()
      }

      "setProgress" -> {
        val requested = command.double("progress")
        val value = signedProgress(requested, command.string("mode"))
        val id = command.string("id")
        val target = route(id)
        val duration = command.int("duration", 0)
        if (duration < 0) invalidRoute("duration must be non-negative.")
        requestedProgress[id] = requested.toFloat()
        val sceneGeneration = generation
        val requestEpoch = nextProgressEpoch(id)
        if (duration == 0) {
          target.setProgress(value)
          emitRequestedProgress(id, requested, sceneGeneration, requestEpoch, target)
        } else {
          val managerReference = WeakReference(this)
          target.progressTo(value, duration) { completedRoute, _ ->
            managerReference.get()?.let { owner ->
              if (completedRoute === target) {
                owner.emitRequestedProgress(id, requested, sceneGeneration, requestEpoch, target)
              }
            }
          }
        }
        none()
      }

      "getProgress" -> {
        mapOf("type" to "progress", "progress" to route(command.string("id")).progress, "source" to "native")
      }

      "getRequestedProgress" -> {
        val id = command.string("id")
        route(id)
        mapOf("type" to "progress", "progress" to (requestedProgress[id] ?: 0f), "source" to "requested")
      }

      "getProgressAtCoordinate" -> {
        mapOf(
          "type" to "progress",
          "progress" to route(command.string("id")).getProgressFromPoint(command.coordinate("coordinate")),
          "source" to "native",
        )
      }

      "getCoordinateAtProgress" -> {
        val point =
          route(command.string("id")).getPointFromProgress(command.progress())
            ?: invalidRoute("The SDK could not resolve this route progress.")
        mapOf(
          "type" to "coordinate",
          "latitude" to point.point.latitude,
          "longitude" to point.point.longitude,
          "orientation" to point.orientation.toDouble(),
        )
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

      "startProgressAnimation" -> {
        startAnimation(command.map("animation"))
        none()
      }

      "stopAnimation" -> {
        stopAnimation(command.string("animationId"), true)
        none()
      }

      "remove" -> {
        val ids = command.stringList("ids")
        routeEntries(ids)
        ids.forEach(::remove)
        none()
      }

      else -> {
        invalidRoute("Unknown route command type.")
      }
    }

  fun dispose() {
    generation++
    rejectPendingApply("${ROUTE_ERROR}_DISPOSED", "The map view was disposed while applying the route scene.")
    pendingImages.forEach(MapImageLoadToken::cancel)
    pendingImages.clear()
    disposeObjects()
    styleSets.clear()
    styleCounts.clear()
  }

  private fun rejectPendingApply(
    code: String,
    message: String,
  ) {
    val completion = pendingApply
    pendingApply = null
    completion?.invoke(Result.failure(CodedException(code, message, null)))
  }

  fun capabilities() =
    mapOf(
      "curves" to true,
      "patterns" to true,
      "patternSymbols" to true,
      "patternImageSizing" to false,
      "progressAtCoordinate" to true,
      "coordinateAtProgress" to true,
      "nativeProgressRead" to true,
      "fractionalStyleWidth" to true,
      "progressAnimationRepeat" to false,
    )

  private fun validateScene(
    styleSpecs: List<Map<String, Any?>>,
    layerSpecs: List<Map<String, Any?>>,
    routeSpecs: List<Map<String, Any?>>,
  ) {
    requireUniqueRoute(styleSpecs, "style set")
    requireUniqueRoute(layerSpecs, "route layer")
    requireUniqueRoute(routeSpecs, "route")
    layerSpecs.forEach { layer ->
      layer.int("zIndex", 0)
      layer.boolean("visible", true)
    }
    val styles = styleSpecs.associateBy { it.string("id") }
    val layerIds = layerSpecs.mapTo(mutableSetOf()) { it.string("id") }
    routeSpecs.forEach { route ->
      route.int("zIndex", 0)
      route.boolean("visible", true)
      if (route.string("layerId") !in layerIds) invalidRoute("Route ${route.string("id")} references an unknown layer.")
      val styleSpec = styles[route.string("styleSetId")] ?: invalidRoute("Route ${route.string("id")} references an unknown style set.")
      val styleCount = styleSpec.list("styles").size
      route.list("segments").forEach { segment ->
        if (segment.coordinateList("coordinates").size < 2) invalidRoute("Route segments require at least two coordinates.")
        if (segment.int("styleIndex", 0) !in 0 until styleCount) invalidRoute("Route segment styleIndex is out of range.")
        routeCurve(segment)
      }
      if (route.list("segments").isEmpty()) invalidRoute("Routes require at least one segment.")
    }
    styleSpecs.forEach { spec ->
      val patterns = spec.list("patterns")
      val patternCount = patterns.size
      patterns.forEach { pattern ->
        val image = pattern.map("image")
        if (image.string("uri").isBlank()) invalidRoute("Route pattern image URI must not be empty.")
        rejectRouteImageSizing(image)
        pattern.mapOrNull("symbol")?.let {
          if (it.string("uri").isBlank()) invalidRoute("Route symbol image URI must not be empty.")
          rejectRouteImageSizing(it)
        }
        if (pattern.float("distance") <= 0) invalidRoute("Route pattern distance must be positive.")
      }
      val styles = spec.list("styles")
      if (styles.isEmpty()) invalidRoute("Route style sets require styles.")
      styles.forEach { style -> if (style.list("levels").isEmpty()) invalidRoute("Route styles require levels.") }
      styles.flatMap { it.list("levels") }.forEach { level ->
        val index = level.int("patternIndex", -1)
        if (index !in -1 until patternCount) invalidRoute("Route patternIndex is out of range.")
        if (level.float("width") < 0 || level.float("strokeWidth", 0f) < 0) invalidRoute("Route widths must be non-negative.")
        level.int("level")
        level.color("color")
        level.color("strokeColor", Color.TRANSPARENT)
      }
    }
  }

  private fun buildScene(
    styleSpecs: List<Map<String, Any?>>,
    layerSpecs: List<Map<String, Any?>>,
    routeSpecs: List<Map<String, Any?>>,
    images: Map<String, Bitmap>,
  ): Map<String, Any> {
    val nextStyleSets = mutableMapOf<String, RouteLineStylesSet>()
    val nextStyleCounts = mutableMapOf<String, Int>()
    val nextLayers = mutableMapOf<String, RouteLineLayer>()
    val nextRoutes = mutableMapOf<String, RouteLine>()
    val nextRouteLayerIds = mutableMapOf<String, String>()
    registerStyles(styleSpecs, images, nextStyleSets, nextStyleCounts)
    val sceneId = sceneSequence++
    val scenePrefix = "$nativePrefix-scene-$sceneId"
    try {
      layerSpecs.forEach { spec ->
        val id = spec.string("id")
        val nativeId = "$scenePrefix-layer-$id"
        val layer = manager.addLayer(nativeId, spec.int("zIndex", 0)) ?: invalidRoute("Could not create route layer $id.")
        layer.setVisible(false)
        nextLayers[id] = layer
      }
      routeSpecs.forEach { spec ->
        val id = spec.string("id")
        val styleId = spec.string("styleSetId")
        val styleSet = nextStyleSets[styleId] ?: unknownRoute("route style set", styleId)
        val options =
          RouteLineOptions
            .from(id, spec.list("segments").map { routeSegment(it, styleSet) })
            .setStylesSet(styleSet)
            .setZOrder(spec.int("zIndex", 0))
            .setVisible(spec.boolean("visible", true))
        val layerId = spec.string("layerId")
        nextRoutes[id] = nextLayers[layerId]?.addRouteLine(options) ?: invalidRoute("Could not create route $id.")
        nextRouteLayerIds[id] = layerId
      }
    } catch (error: Throwable) {
      nextLayers.values.forEach(manager::remove)
      throw error
    }
    disposeObjects()
    styleSets.clear()
    styleSets.putAll(nextStyleSets)
    styleCounts.clear()
    styleCounts.putAll(nextStyleCounts)
    layers.putAll(nextLayers)
    routes.putAll(nextRoutes)
    routeLayerIds.putAll(nextRouteLayerIds)
    requestedProgress.putAll(nextRoutes.keys.associateWith { 0f })
    layerSpecs.forEach { spec -> nextLayers.getValue(spec.string("id")).setVisible(spec.boolean("visible", true)) }
    return counts()
  }

  private fun registerStyles(
    specs: List<Map<String, Any?>>,
    images: Map<String, Bitmap>,
    targetStyleSets: MutableMap<String, RouteLineStylesSet>,
    targetStyleCounts: MutableMap<String, Int>,
  ) {
    specs.forEach { spec ->
      val id = spec.string("id")
      val nativeId = mapStyleNativeID("rnk-route-style", spec)
      val patterns =
        spec.list("patterns").map { pattern ->
          val bitmap = images[pattern.map("image").string("uri")] ?: invalidRoute("Missing route pattern image.")
          val symbol = pattern.mapOrNull("symbol")?.let { images[it.string("uri")] ?: invalidRoute("Missing route symbol image.") }
          (
            if (symbol ==
              null
            ) {
              RouteLinePattern.from(bitmap, pattern.float("distance") * density)
            } else {
              RouteLinePattern.from(bitmap, symbol, pattern.float("distance") * density)
            }
          ).setPinStart(pattern.boolean("pinStart", false))
            .setPinEnd(pattern.boolean("pinEnd", false))
        }
      val styles =
        spec.list("styles").map { style ->
          RouteLineStyles.from(
            style.list("levels").map { level ->
              val patternIndex = level.int("patternIndex", -1)
              val width = level.float("width") * density
              val color = level.color("color")
              val strokeWidth = level.float("strokeWidth", 0f) * density
              val strokeColor = level.color("strokeColor", Color.TRANSPARENT)
              val pattern = patterns.getOrNull(patternIndex)
              val routeStyle =
                if (pattern == null) {
                  RouteLineStyle.from(width, color, strokeWidth, strokeColor)
                } else {
                  RouteLineStyle.from(width, color, strokeWidth, strokeColor, pattern)
                }
              routeStyle.setZoomLevel(level.int("level"))
            },
          )
        }
      targetStyleSets[id] = manager.addStylesSet(RouteLineStylesSet.from(nativeId, styles, patterns))
      targetStyleCounts[id] = styles.size
    }
  }

  private fun routeSegment(
    spec: Map<String, Any?>,
    styleSet: RouteLineStylesSet,
  ): RouteLineSegment {
    val styleIndex = spec.int("styleIndex", 0)
    val styles = styleSet.getStyles(styleIndex) ?: invalidRoute("Route segment styleIndex is out of range.")
    return RouteLineSegment
      .from(spec.coordinateList("coordinates"), styles)
      .setCurveType(routeCurve(spec))
  }

  private fun routeCurve(spec: Map<String, Any?>) =
    when (spec.stringOrNull("curve") ?: "none") {
      "none" -> CurveType.None
      "left" -> CurveType.LeftCurve
      "right" -> CurveType.RightCurve
      else -> invalidRoute("Unknown route curve type.")
    }

  private fun validateSegments(
    segments: List<Map<String, Any?>>,
    styleCount: Int,
  ) {
    if (segments.isEmpty()) invalidRoute("Routes require at least one segment.")
    segments.forEach { segment ->
      if (segment.coordinateList("coordinates").size < 2) invalidRoute("Route segments require at least two coordinates.")
      if (segment.int("styleIndex", 0) !in 0 until styleCount) invalidRoute("Route segment styleIndex is out of range.")
      routeCurve(segment)
    }
  }

  private fun startAnimation(animation: Map<String, Any?>) {
    val id = animation.string("animationId")
    if (id.isBlank()) invalidRoute("Route animationId must not be empty.")
    if (animators.containsKey(id)) invalidRoute("Route animation $id already exists.")
    if (animation.int("repeat", 1) != 1) throw unsupportedRoute("The Kakao route progress animator does not support repeat counts.")
    val duration = animation.int("duration")
    if (duration <= 0) invalidRoute("Route animation duration must be positive.")
    val routeIds = animation.stringList("routeIds")
    if (routeIds.isEmpty()) invalidRoute("Route animation requires routeIds.")
    val direction =
      when (animation.string("direction")) {
        "forward" -> ProgressDirection.StartFirst
        "backward" -> ProgressDirection.EndFirst
        else -> invalidRoute("Unknown route animation direction.")
      }
    val type =
      when (animation.string("mode")) {
        "fill" -> ProgressType.ToShow
        "clear" -> ProgressType.ToHide
        else -> invalidRoute("Unknown route animation mode.")
      }
    val requested = if (animation.string("mode") == "fill") 1f else 0f
    val resetToInitial = animation.boolean("resetToInitial", false)
    val targets = routeIds.map(::route)
    val interpolation = routeInterpolation(animation.stringOrNull("interpolation") ?: "linear")
    val hideAtStop = animation.boolean("hideAtStop", false)
    val definition = mapCanonicalValue(animation - "animationId")
    val nativeId =
      animatorIdsByDefinition.getOrPut(definition) {
        "rnk-route-${System.identityHashCode(this)}-${animationSequence++}"
      }
    if (nativeId in animationNativeIds.values) invalidRoute("An equivalent route animation is already running.")
    val cachedAnimator = animatorCache[nativeId]
    val animator =
      cachedAnimator ?: run {
        val effect =
          ProgressAnimation
            .from(nativeId, duration)
            .setProgressDirection(direction)
            .setProgressType(type)
            .setInterpolation(interpolation)
            .setHideAtStop(hideAtStop)
            .setResetToInitialState(resetToInitial)
        (manager.addAnimator(effect) ?: invalidRoute("Could not create route animation $id.")).also {
          it.addRouteLines(*targets.toTypedArray())
          animatorCache[nativeId] = it
          animatorTargetIds[nativeId] = routeIds.toSet()
        }
      }
    if (cachedAnimator != null && nativeId in animatorsNeedingTargets) {
      animator.addRouteLines(*targets.toTypedArray())
      animatorsNeedingTargets.remove(nativeId)
    }
    routeIds.forEach(::invalidateProgressRequest)
    if (!resetToInitial) routeIds.forEach { requestedProgress[it] = requested }
    animators[id] = animator
    animationTargets[id] = routeIds.toSet()
    animationNativeIds[id] = nativeId
    val runEpoch = ++animationRunSequence
    animationRunEpochs[id] = runEpoch
    val managerReference = WeakReference(this)
    animator.start { completedAnimator -> managerReference.get()?.completeAnimation(id, nativeId, runEpoch, completedAnimator) }
  }

  private fun stopAnimation(
    id: String,
    shouldStop: Boolean,
  ) {
    val animator = animators.remove(id) ?: unknownRoute("route animation", id)
    animationTargets.remove(id)
    val nativeId = animationNativeIds.remove(id)
    animationRunEpochs.remove(id)
    if (shouldStop) {
      animator.stop()
      nativeId?.let(animatorsNeedingTargets::add)
    }
    emit("onRouteAnimationStop", mapOf("animationId" to id))
  }

  private fun completeAnimation(
    id: String,
    nativeId: String,
    runEpoch: Long,
    completedAnimator: RouteLineAnimator,
  ) {
    if (animationNativeIds[id] != nativeId || animationRunEpochs[id] != runEpoch || animators[id] !== completedAnimator) return
    animators.remove(id)
    animationTargets.remove(id)
    animationNativeIds.remove(id)
    animationRunEpochs.remove(id)
    emit("onRouteAnimationStop", mapOf("animationId" to id))
  }

  private fun state(id: String): Map<String, Any?> {
    val value = route(id)
    return mapOf(
      "type" to "state",
      "id" to id,
      "layerId" to routeLayerIds.getValue(id),
      "visible" to value.isShow,
      "zIndex" to value.zOrder,
      "nativeProgress" to value.progress,
      "requestedProgress" to (requestedProgress[id] ?: 0f),
    )
  }

  private fun counts() = mapOf("type" to "counts", "layers" to layers.size, "routes" to routes.size, "animations" to animators.size)

  private fun none() = mapOf<String, Any?>("type" to "none")

  private fun route(id: String) = routes[id] ?: unknownRoute("route", id)

  private fun routeEntries(ids: List<String>): List<RouteLine> {
    if (ids.toSet().size != ids.size) invalidRoute("Route command IDs must be unique.")
    return ids.map(::route)
  }

  private fun style(id: String) = styleSets[id] ?: unknownRoute("route style set", id)

  private fun remove(id: String) {
    invalidateProgressRequest(id)
    stopAnimationsForRoute(id)
    invalidateCachedAnimationsForRoute(id)
    routes.remove(id)?.remove() ?: unknownRoute("route", id)
    requestedProgress.remove(id)
    routeLayerIds.remove(id)
  }

  private fun stopAnimationsForRoute(id: String) {
    animationTargets
      .filterValues { id in it }
      .keys
      .toList()
      .forEach { stopAnimation(it, true) }
  }

  private fun invalidateCachedAnimationsForRoute(id: String) {
    animatorTargetIds
      .filterValues { id in it }
      .keys
      .forEach { nativeId ->
        animatorCache[nativeId]?.stop()
        animatorsNeedingTargets += nativeId
      }
  }

  private fun disposeObjects() {
    animators.clear()
    animationTargets.clear()
    animationNativeIds.clear()
    animationRunEpochs.clear()
    animatorCache.values.forEach(RouteLineAnimator::stop)
    animatorsNeedingTargets.addAll(animatorCache.keys)
    layers.values.forEach(manager::remove)
    layers.clear()
    routes.clear()
    requestedProgress.clear()
    progressEpochs.clear()
    routeLayerIds.clear()
  }

  private fun nextProgressEpoch(id: String): Long {
    val epoch = (progressEpochs[id] ?: 0L) + 1
    progressEpochs[id] = epoch
    return epoch
  }

  private fun invalidateProgressRequest(id: String) {
    nextProgressEpoch(id)
  }

  private fun emitRequestedProgress(
    id: String,
    requested: Double,
    sceneGeneration: Int,
    requestEpoch: Long,
    target: RouteLine,
  ) {
    if (generation != sceneGeneration || progressEpochs[id] != requestEpoch || routes[id] !== target) return
    emit("onRouteProgress", mapOf("id" to id, "progress" to requested, "source" to "requested"))
  }
}

private const val ROUTE_ERROR = "ERR_KAKAO_MAP_ROUTE"

private fun signedProgress(
  value: Double,
  mode: String,
): Float {
  if (!value.isFinite() || value !in 0.0..1.0) invalidRoute("Route progress must be between 0 and 1.")
  return when (mode) {
    "fill" -> value.toFloat()
    "clear" -> -value.toFloat()
    else -> invalidRoute("Unknown route progress mode.")
  }
}

private fun Map<String, Any?>.progress() =
  double("progress")
    .also {
      if (it !in
        0.0..1.0
      ) {
        invalidRoute("Route progress must be between 0 and 1.")
      }
    }.toFloat()

private fun routeInterpolation(value: String) =
  when (value) {
    "linear" -> Interpolation.Linear
    "cubicIn" -> Interpolation.CubicIn
    "cubicOut" -> Interpolation.CubicOut
    "cubicInOut" -> Interpolation.CubicInOut
    else -> invalidRoute("Unknown interpolation $value.")
  }

private fun rejectRouteImageSizing(source: Map<String, Any?>) {
  if (source.containsKey("width") || source.containsKey("height")) {
    throw unsupportedRoute("Kakao route patterns use the source bitmap size.")
  }
}

private fun requireUniqueRoute(
  values: List<Map<String, Any?>>,
  noun: String,
) {
  val ids = values.map { it.string("id") }
  if (ids.any(String::isBlank)) invalidRoute("$noun ID must not be empty.")
  if (ids.toSet().size !=
    ids.size
  ) {
    invalidRoute("Duplicate $noun ID.")
  }
}

private fun Map<String, Any?>.map(key: String) = this[key] as? Map<String, Any?> ?: invalidRoute("$key must be an object.")

private fun Map<String, Any?>.mapOrNull(key: String): Map<String, Any?>? {
  if (!containsKey(key)) return null
  return this[key] as? Map<String, Any?> ?: invalidRoute("$key must be an object.")
}

private fun Map<String, Any?>.list(key: String): List<Map<String, Any?>> {
  if (!containsKey(key)) return emptyList()
  val raw = this[key] as? List<*> ?: invalidRoute("$key must be an array of objects.")
  return raw.map { it as? Map<String, Any?> ?: invalidRoute("$key must contain objects.") }
}

private fun Map<String, Any?>.string(key: String) = this[key] as? String ?: invalidRoute("$key must be a string.")

private fun Map<String, Any?>.stringOrNull(key: String): String? {
  if (!containsKey(key)) return null
  return this[key] as? String ?: invalidRoute("$key must be a string.")
}

private fun Map<String, Any?>.stringList(key: String) =
  (this[key] as? List<*>)?.map { it as? String ?: invalidRoute("$key must contain strings.") } ?: invalidRoute("$key must be an array.")

private fun Map<String, Any?>.boolean(
  key: String,
  fallback: Boolean? = null,
): Boolean {
  if (!containsKey(key)) return fallback ?: invalidRoute("$key must be a boolean.")
  return this[key] as? Boolean ?: invalidRoute("$key must be a boolean.")
}

private fun Map<String, Any?>.double(
  key: String,
  fallback: Double? = null,
): Double {
  if (!containsKey(key)) return fallback ?: invalidRoute("$key must be finite.")
  return (this[key] as? Number)?.toDouble()?.takeIf { it.isFinite() } ?: invalidRoute("$key must be finite.")
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
  if (value % 1 != 0.0 ||
    value !in Int.MIN_VALUE.toDouble()..Int.MAX_VALUE.toDouble()
  ) {
    invalidRoute("$key must be an integer.")
  }
  return value.toInt()
}

private fun Map<String, Any?>.color(
  key: String,
  fallback: Int? = null,
): Int {
  if (!containsKey(key)) return fallback ?: invalidRoute("$key must be a color.")
  return (this[key] as? String)?.let(::parseRouteColor) ?: invalidRoute("$key must be a color.")
}

private fun Map<String, Any?>.coordinate(key: String) = map(key).coordinateValue()

private fun Map<String, Any?>.coordinateList(key: String) =
  (this[key] as? List<*>)?.map { it.coordinateValue() } ?: invalidRoute("$key must be an array.")

private fun Any?.coordinateValue(): LatLng {
  val value =
    this as? Map<String, Any?> ?: invalidRoute("Coordinate must be an object.")
  val latitude = value.double("latitude")
  val longitude = value.double("longitude")
  if (latitude !in
    -90.0..90.0 ||
    longitude !in -180.0..180.0
  ) {
    invalidRoute("Invalid coordinate.")
  }
  return LatLng.from(latitude, longitude)
}

private fun parseRouteColor(value: String): Int {
  if (!Regex("^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$").matches(value)) invalidRoute("Colors must be #RRGGBB or #RRGGBBAA.")
  val raw = value.drop(1)
  return if (raw.length ==
    6
  ) {
    Color.parseColor(value)
  } else {
    ((raw.takeLast(2).toLong(16) shl 24) or raw.dropLast(2).toLong(16)).toInt()
  }
}

private fun invalidRoute(message: String): Nothing = throw CodedException("${ROUTE_ERROR}_INVALID_ARGUMENT", message, null)

private fun unsupportedRoute(message: String): CodedException = CodedException("${ROUTE_ERROR}_UNSUPPORTED", message, null)

private fun unknownRoute(
  noun: String,
  id: String,
): Nothing = throw CodedException("${ROUTE_ERROR}_NOT_FOUND", "Unknown $noun $id.", null)
