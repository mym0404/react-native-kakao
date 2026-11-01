package net.mjstudio.rnkakao.map

import android.graphics.Bitmap
import android.graphics.Color
import android.view.Gravity
import com.kakao.vectormap.KakaoMap
import com.kakao.vectormap.LatLng
import com.kakao.vectormap.animation.Interpolation
import com.kakao.vectormap.label.Badge
import com.kakao.vectormap.label.CompetitionType
import com.kakao.vectormap.label.CompetitionUnit
import com.kakao.vectormap.label.Label
import com.kakao.vectormap.label.LabelLayer
import com.kakao.vectormap.label.LabelLayerOptions
import com.kakao.vectormap.label.LabelOptions
import com.kakao.vectormap.label.LabelStyle
import com.kakao.vectormap.label.LabelStyles
import com.kakao.vectormap.label.LabelTextBuilder
import com.kakao.vectormap.label.LabelTextStyle
import com.kakao.vectormap.label.LabelTransition
import com.kakao.vectormap.label.LodLabel
import com.kakao.vectormap.label.LodLabelLayer
import com.kakao.vectormap.label.OrderingType
import com.kakao.vectormap.label.PathOptions
import com.kakao.vectormap.label.PolylineLabel
import com.kakao.vectormap.label.PolylineLabelOptions
import com.kakao.vectormap.label.PolylineLabelStyle
import com.kakao.vectormap.label.PolylineLabelStyles
import com.kakao.vectormap.label.TrackingManager
import com.kakao.vectormap.label.TransformMethod
import com.kakao.vectormap.label.Transition
import com.kakao.vectormap.label.animation.AlphaAnimation
import com.kakao.vectormap.label.animation.AlphaAnimations
import com.kakao.vectormap.label.animation.DropAnimation
import com.kakao.vectormap.label.animation.ScaleAlphaAnimation
import com.kakao.vectormap.label.animation.ScaleAlphaAnimations
import com.kakao.vectormap.label.animation.ScaleAnimation
import com.kakao.vectormap.label.animation.ScaleAnimations
import com.kakao.vectormap.label.animation.TransformAnimation
import com.kakao.vectormap.label.animation.TransformAnimations
import com.kakao.vectormap.shape.Polygon
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Required
import java.util.UUID
import kotlin.math.PI
import kotlin.math.roundToInt

internal const val LABEL_INVALID_ARGUMENT = "ERR_KAKAO_MAP_LABEL_INVALID_ARGUMENT"
internal const val LABEL_NOT_FOUND = "ERR_KAKAO_MAP_LABEL_NOT_FOUND"
internal const val LABEL_UNSUPPORTED = "ERR_KAKAO_MAP_LABEL_UNSUPPORTED"
internal const val LABEL_APPLY_CANCELLED = "ERR_KAKAO_MAP_LABEL_APPLY_CANCELLED"
private const val DEFAULT_LABEL_LAYER_Z_ORDER = 1000
private const val MIN_CHARACTER_SPACE_PX = -2

class MapLabelPoint : Record {
  @Field @Required
  var latitude = Double.NaN

  @Field @Required
  var longitude = Double.NaN
}

class MapLabelVector : Record {
  @Field @Required
  var x = Double.NaN

  @Field @Required
  var y = Double.NaN
}

class MapLabelImage : Record {
  @Field @Required
  var uri = ""

  @Field var width: Double? = null

  @Field var height: Double? = null
}

class MapLabelTextStyleRecord : Record {
  @Field var fontFamily: String? = null

  @Field @Required
  var fontSize = Double.NaN

  @Field @Required
  var color = ""

  @Field var strokeColor: String? = null

  @Field var strokeWidth = 0.0

  @Field var characterSpacing = 0.0

  @Field var lineSpacing = 1.0

  @Field var aspectRatio = 1.0
}

class MapLabelTransitionRecord : Record {
  @Field @Required
  var entrance = "none"

  @Field @Required
  var exit = "none"

  @Field var enableEntrance = true

  @Field var enableExit = true
}

class MapLabelBadgeStyleRecord : Record {
  @Field @Required
  var id = ""

  @Field @Required
  var image = MapLabelImage()

  @Field var offset: MapLabelVector? = null

  @Field var zOrder = 0
}

class MapLabelPerLevelStyleRecord : Record {
  @Field @Required
  var level = 0

  @Field var image: MapLabelImage? = null

  @Field var anchor: MapLabelVector? = null

  @Field var padding = 0.0

  @Field var iconTransition: MapLabelTransitionRecord? = null

  @Field var textTransition: MapLabelTransitionRecord? = null

  @Field var textLayout = "center"

  @Field var textLines: List<MapLabelTextStyleRecord> = emptyList()

  @Field var badges: List<MapLabelBadgeStyleRecord> = emptyList()
}

class MapLabelStyleRecord : Record {
  @Field @Required
  var id = ""

  @Field @Required
  var levels: List<MapLabelPerLevelStyleRecord> = emptyList()
}

class MapPathTextLevelStyleRecord : Record {
  @Field @Required
  var level = 0

  @Field @Required
  var text = MapLabelTextStyleRecord()
}

class MapPathTextStyleRecord : Record {
  @Field @Required
  var id = ""

  @Field @Required
  var levels: List<MapPathTextLevelStyleRecord> = emptyList()
}

open class MapLabelLayerRecord : Record {
  @Field @Required
  var id = ""

  @Field var visible = true

  @Field var clickable = true

  @Field var zOrder = DEFAULT_LABEL_LAYER_Z_ORDER

  @Field var competition = "none"

  @Field var competitionUnit = "iconAndText"

  @Field var ordering = "rank"

  @Field var competitionExceptions: List<String> = emptyList()
}

class MapLodLabelLayerRecord : MapLabelLayerRecord() {
  @Field var radius = 20.0
}

class MapLabelTextRecord : Record {
  @Field @Required
  var value = ""

  @Field var styleIndex = 0
}

class MapLabelBadgeRecord : Record {
  @Field @Required
  var id = ""

  @Field @Required
  var image = MapLabelImage()

  @Field var offset: MapLabelVector? = null

  @Field var zOrder = 0

  @Field var visible = true
}

open class MapLabelRecord : Record {
  @Field @Required
  var id = ""

  @Field @Required
  var layerId = ""

  @Field @Required
  var styleId = ""

  @Field @Required
  var coordinate = MapLabelPoint()

  @Field var text: List<MapLabelTextRecord> = emptyList()

  @Field var rank = 0.0

  @Field var clickable = false

  @Field var visible = true

  @Field var transform = "default"

  @Field var pixelOffset: MapLabelVector? = null

  @Field var orientation = 0.0

  @Field var scale: MapLabelVector? = null

  @Field var badges: List<MapLabelBadgeRecord> = emptyList()
}

class MapLodLabelRecord : MapLabelRecord()

class MapPathLabelRecord : Record {
  @Field @Required
  var id = ""

  @Field @Required
  var layerId = ""

  @Field @Required
  var styleId = ""

  @Field @Required
  var points: List<MapLabelPoint> = emptyList()

  @Field @Required
  var text = ""

  @Field var rank = 0.0

  @Field var visible = true
}

class MapLabelAnimationKeyframeRecord : Record {
  @Field @Required
  var duration = 0.0

  @Field var interpolation = "linear"

  @Field var alpha: Double? = null

  @Field var scale: MapLabelVector? = null

  @Field var translation: MapLabelVector? = null

  @Field var rotation: Double? = null
}

class MapLabelAnimationRecord : Record {
  @Field @Required
  var id = ""

  @Field @Required
  var labelIds: List<String> = emptyList()

  @Field @Required
  var effect = ""

  @Field @Required
  var keyframes: List<MapLabelAnimationKeyframeRecord> = emptyList()

  @Field var repeatCount = 1

  @Field var hideAtStop = false

  @Field var removeAtStop = false

  @Field var resetToInitialState = false
}

class MapLabelSceneRecord : Record {
  @Field var styles: List<MapLabelStyleRecord> = emptyList()

  @Field var pathTextStyles: List<MapPathTextStyleRecord> = emptyList()

  @Field var layers: List<MapLabelLayerRecord> = emptyList()

  @Field var lodLayers: List<MapLodLabelLayerRecord> = emptyList()

  @Field var labels: List<MapLabelRecord> = emptyList()

  @Field var lodLabels: List<MapLodLabelRecord> = emptyList()

  @Field var pathLabels: List<MapPathLabelRecord> = emptyList()

  @Field var animations: List<MapLabelAnimationRecord> = emptyList()
}

class MapLabelCommandRecord : Record {
  @Field @Required
  var type = ""

  @Field var id: String? = null

  @Field var sourceId: String? = null

  @Field var targetId: String? = null

  @Field var badgeId: String? = null

  @Field var style = false

  @Field var visible: Boolean? = null

  @Field var enabled: Boolean? = null

  @Field var coordinate: MapLabelPoint? = null

  @Field var points: List<MapLabelPoint> = emptyList()

  @Field var duration: Double? = null

  @Field var cornerRadius = 0.0

  @Field var jumpThreshold = 0.0

  @Field var rotate = false

  @Field var autoMove = false

  @Field var baseRotation = 0.0

  @Field var rotation: Double? = null

  @Field var scale: MapLabelVector? = null
}

internal class MapLabels(
  private val map: KakaoMap,
  private val imageLoader: MapImageLoader,
  private val emitClick: (Map<String, Any>) -> Unit,
  private val emitAnimationStopped: (Map<String, Any>) -> Unit,
  private val resolvePolygon: (String) -> Polygon?,
  private val density: Float,
) {
  private data class ActiveAnimationRun(
    val nativeId: String,
    val epoch: Long,
    val definition: MapLabelAnimationRecord,
  )

  init {
    if (!density.isFinite() || density <= 0) invalid("Display density must be positive.")
  }

  private val manager = map.labelManager ?: invalid("The label manager is unavailable before map readiness.")
  private val nativeNamespace = UUID.randomUUID().toString().replace("-", "")
  private val trackingManager: TrackingManager =
    map.trackingManager ?: invalid("The tracking manager is unavailable before map readiness.")
  private val labels = mutableMapOf<String, Label>()
  private val lodLabels = mutableMapOf<String, LodLabel>()
  private val pathLabels = mutableMapOf<String, PolylineLabel>()
  private val dynamicBadges = mutableMapOf<String, MutableMap<String, Badge>>()
  private val ownedLabelLayers = mutableMapOf<String, LabelLayer>()
  private val ownedLodLabelLayers = mutableMapOf<String, LodLabelLayer>()
  private val publicLayerIdsByNative = mutableMapOf<String, String>()
  private val nativeStyleIdsByDefinition = mutableMapOf<String, String>()
  private var nextNativeObjectId = 0L
  private val animationDefinitions = mutableMapOf<String, MapLabelAnimationRecord>()
  private val activeAnimationRuns = mutableMapOf<String, ActiveAnimationRun>()
  private var nextAnimationEpoch = 0L
  private var generation = 0
  private val imageRequests = mutableListOf<MapImageLoadToken>()
  private var pendingApplyCompletion: ((Result<Unit>) -> Unit)? = null
  private var isDisposed = false
  private var isTracking = false

  fun apply(
    scene: MapLabelSceneRecord,
    completion: (Result<Unit>) -> Unit,
  ) {
    requireActive()
    validateScene(scene, density)
    cancelPendingApply("A newer label scene replaced this apply operation.")
    pendingApplyCompletion = completion
    val currentGeneration = ++generation
    cancelImageRequests()
    loadImages(scene.imageUris(), currentGeneration) { result ->
      if (isDisposed || currentGeneration != generation) return@loadImages
      result.fold(
        onSuccess = { images -> finishApply(runCatching { rebuild(scene, images) }) },
        onFailure = { finishApply(Result.failure(it)) },
      )
    }
  }

  fun command(command: MapLabelCommandRecord) {
    requireActive()
    val duration = (command.duration ?: 0.0).duration()
    when (command.type) {
      "show" -> {
        show(command.requiredId(), command.visible.required(), command.autoMove, duration)
      }

      "move" -> {
        label(command.requiredId()).moveTo(command.coordinate.required().latLng(), duration)
      }

      "movePath" -> {
        command.duration.required()
        if (command.points.size < 2) invalid("movePath requires at least two points.")
        if (command.cornerRadius < 0 || command.jumpThreshold < 0) {
          invalid("cornerRadius and jumpThreshold must be non-negative.")
        }
        val path =
          PathOptions
            .fromPath(command.points.map(MapLabelPoint::latLng))
            .setDuration(duration)
            .setCornerRadius(command.cornerRadius.finiteFloat("cornerRadius"))
            .setJumpThreshold(command.jumpThreshold.finiteFloat("jumpThreshold"))
            .setBaseRadian(Math.toRadians(command.baseRotation.finiteFloat("baseRotation").toDouble()).toFloat())
        label(command.requiredId()).moveOnPath(path, command.rotate)
      }

      "rotate" -> {
        label(
          command.requiredId(),
        ).rotateTo(
          Math
            .toRadians(
              command.rotation
                .required()
                .finiteFloat("rotation")
                .toDouble(),
            ).toFloat(),
          duration,
        )
      }

      "scale" -> {
        command.scale.required().also {
          it.validateScale()
          label(command.requiredId()).scaleTo(it.x.finiteFloat("scale.x"), it.y.finiteFloat("scale.y"), duration)
        }
      }

      "sharePosition" -> {
        share(command, transform = false)
      }

      "shareTransform" -> {
        share(command, transform = true)
      }

      "shareShapeTransform" -> {
        val isEnabled = command.enabled.required()
        val source = label(command.sourceId ?: invalid("sourceId is required."))
        val targetId = command.targetId ?: invalid("targetId is required.")
        val target = resolvePolygon(targetId) ?: notFound("polygon", targetId)
        if (isEnabled) source.addShareTransform(target) else source.removeShareTransform(target)
      }

      "setBadgeVisibility" -> {
        setBadgeVisibility(command)
      }

      "startAnimation" -> {
        startAnimation(command.requiredId())
      }

      "stopAnimation" -> {
        val id = command.requiredId()
        if (id !in animationDefinitions) notFound("animation", id)
        activeAnimationRuns[id]?.let { finishAnimationRun(id, it, finished = false, stopNative = true) }
      }

      "startTracking" -> {
        trackingManager.startTracking(label(command.requiredId()))
        trackingManager.setTrackingRotation(command.rotate)
        isTracking = true
      }

      "stopTracking" -> {
        trackingManager.stopTracking()
        isTracking = false
      }

      else -> {
        invalid("Unknown label command: ${command.type}")
      }
    }
  }

  private fun startAnimation(id: String) {
    var definition = animationDefinitions[id] ?: notFound("animation", id)
    activeAnimationRuns[id]?.let { run ->
      finishAnimationRun(id, run, finished = false, stopNative = true)
      definition = animationDefinitions[id] ?: notFound("animation", id)
    }
    val targets = definition.labelIds.map(::label)
    val epoch = ++nextAnimationEpoch
    val nativeId = makeNativeId("animation")
    val animator =
      manager.addAnimator(definition.nativeAnimation(density, nativeId))
        ?: invalid("Could not create animation $id.")
    animator.addLabels(*targets.toTypedArray())
    val run = ActiveAnimationRun(nativeId, epoch, definition)
    activeAnimationRuns[id] = run
    animator.setOnAnimationStopListener {
      val active = activeAnimationRuns[id]
      if (!isDisposed && active?.nativeId == nativeId && active.epoch == epoch) {
        finishAnimationRun(id, active, finished = true, stopNative = false)
      }
    }
    animator.start()
  }

  private fun finishAnimationRun(
    id: String,
    run: ActiveAnimationRun,
    finished: Boolean,
    stopNative: Boolean,
  ) {
    val active = activeAnimationRuns[id]
    if (active?.nativeId != run.nativeId || active.epoch != run.epoch) return
    activeAnimationRuns.remove(id)
    if (stopNative) manager.getAnimator(run.nativeId)?.stop()
    manager.removeAnimator(run.nativeId)
    if (run.definition.removeAtStop) removeAnimationTargets(run.definition.labelIds)
    emitAnimationStopped(mapOf("id" to id, "finished" to finished))
  }

  private fun clearAnimationRuns() {
    val runs = activeAnimationRuns.values.toList()
    activeAnimationRuns.clear()
    runs.forEach { run ->
      manager.getAnimator(run.nativeId)?.stop()
      manager.removeAnimator(run.nativeId)
    }
  }

  private fun removeAnimationTargets(ids: List<String>) {
    val removedIds = ids.toMutableSet()
    if (removedIds.isEmpty()) return
    val canceledRuns = mutableListOf<Pair<String, ActiveAnimationRun>>()
    while (true) {
      val invalidDefinitionIds =
        animationDefinitions
          .filterValues { definition -> definition.labelIds.any(removedIds::contains) }
          .keys
          .toList()
      if (invalidDefinitionIds.isEmpty()) break
      var didAddRemovedId = false
      invalidDefinitionIds.forEach { invalidId ->
        animationDefinitions.remove(invalidId)
        activeAnimationRuns.remove(invalidId)?.let { run ->
          canceledRuns += invalidId to run
          if (run.definition.removeAtStop) {
            run.definition.labelIds.forEach { targetId ->
              if (removedIds.add(targetId)) didAddRemovedId = true
            }
          }
        }
      }
      if (!didAddRemovedId) break
    }
    canceledRuns.forEach { (canceledId, run) ->
      manager.getAnimator(run.nativeId)?.stop()
      manager.removeAnimator(run.nativeId)
      emitAnimationStopped(mapOf("id" to canceledId, "finished" to false))
    }
    removedIds.forEach {
      labels.remove(it)
      dynamicBadges.remove(it)
    }
    trackingManager.stopTracking()
    isTracking = false
  }

  fun capabilities() =
    mapOf(
      "pathText" to "polylineLabel",
      "pathTextRank" to false,
      "pathTextStyleAddition" to true,
      "pathTextStyleDefinitionUpdate" to true,
      "pathTextStyleRegistrationRemoval" to true,
      "lodPositionMutation" to false,
      "lodAutoMove" to false,
      "autoMoveDuration" to true,
      "labelScaleCommand" to true,
      "sharedShapeTransform" to true,
      "sharedShapeTarget" to "polygon",
      "competitionExceptions" to true,
      "supportedTransforms" to
        listOf("none", "absoluteRotation", "default", "absoluteRotationKeepUpright", "absoluteRotationDecal", "decal"),
      "keyframeRepeatCount" to false,
      "trackingStateSource" to "managed",
      "remoteImages" to true,
    )

  fun state(): Map<String, Any> {
    requireActive()
    val liveLabels =
      labels.mapNotNull { (id, cached) ->
        manager.getLayer(cached.layerId)?.getLabel(id)?.let {
          mapOf(
            "id" to id,
            "kind" to "label",
            "visible" to it.isShow,
            "coordinate" to mapOf("latitude" to it.position.latitude, "longitude" to it.position.longitude),
          )
        }
      }
    val liveLodLabels =
      lodLabels.mapNotNull { (id, cached) ->
        manager.getLodLayer(cached.layerId)?.getLabel(id)?.let {
          mapOf(
            "id" to id,
            "kind" to "lodLabel",
            "visible" to it.isShow,
            "coordinate" to mapOf("latitude" to it.position.latitude, "longitude" to it.position.longitude),
          )
        }
      }
    val livePathLabels =
      pathLabels.mapNotNull { (id, cached) ->
        manager.getLayer(cached.layerId)?.getPolylineLabel(id)?.let {
          mapOf("id" to id, "kind" to "pathLabel", "visible" to it.isShow)
        }
      }
    labels.keys.retainAll(liveLabels.mapTo(mutableSetOf()) { it["id"].toString() })
    lodLabels.keys.retainAll(liveLodLabels.mapTo(mutableSetOf()) { it["id"].toString() })
    pathLabels.keys.retainAll(livePathLabels.mapTo(mutableSetOf()) { it["id"].toString() })
    dynamicBadges.keys.retainAll(labels.keys + lodLabels.keys)
    return mapOf(
      "labels" to (liveLabels + liveLodLabels + livePathLabels).sortedBy { it["id"].toString() },
      "animationIds" to animationDefinitions.keys.sorted(),
      "tracking" to mapOf("active" to isTracking, "source" to "managed"),
    )
  }

  fun handleLabelClick(label: Label) {
    if (isDisposed || labels[label.labelId] !== label) return
    if (manager.getLayer(label.layerId)?.getLabel(label.labelId) !== label) return
    val publicLayerId = publicLayerIdsByNative[label.layerId] ?: return
    emitClick(label.clickPayload("label", publicLayerId))
  }

  fun handleLodLabelClick(label: LodLabel) {
    if (isDisposed || lodLabels[label.labelId] !== label) return
    if (manager.getLodLayer(label.layerId)?.getLabel(label.labelId) !== label) return
    val publicLayerId = publicLayerIdsByNative[label.layerId] ?: return
    emitClick(label.clickPayload("lodLabel", publicLayerId))
  }

  fun dispose() {
    if (isDisposed) return
    isDisposed = true
    ++generation
    clearAnimationRuns()
    cancelImageRequests()
    cancelPendingApply("The map view was destroyed.")
    trackingManager.stopTracking()
    clearOwnedLayers()
    labels.clear()
    lodLabels.clear()
    pathLabels.clear()
    dynamicBadges.clear()
    animationDefinitions.clear()
    nativeStyleIdsByDefinition.clear()
    isTracking = false
  }

  private fun rebuild(
    scene: MapLabelSceneRecord,
    images: Map<String, Bitmap>,
  ) {
    val nativeLayerIds =
      (scene.layers.map { it.id to makeNativeId("layer") } + scene.lodLayers.map { it.id to makeNativeId("lod_layer") }).toMap()
    val nativeStyles =
      scene.styles.associate { style ->
        val nativeId = nativeStyleId("poi_style", style.id, style.fingerprint())
        style.id to style.native(images, nativeId, density)
      }
    val pathStyles =
      scene.pathTextStyles.associate { style ->
        val nativeId = nativeStyleId("path_style", style.id, style.fingerprint())
        style.id to style.native(nativeId, density)
      }
    val layerOptions =
      scene.layers.associate { layer ->
        layer.id to layer.options(nativeLayerIds.getValue(layer.id), nativeLayerIds)
      }
    val lodLayerOptions =
      scene.lodLayers.associate { layer ->
        layer.id to layer.options(nativeLayerIds.getValue(layer.id), nativeLayerIds, density)
      }
    clearAnimationRuns()
    trackingManager.stopTracking()
    clearOwnedLayers()
    labels.clear()
    lodLabels.clear()
    pathLabels.clear()
    dynamicBadges.clear()
    animationDefinitions.clear()
    isTracking = false

    val styles =
      nativeStyles.mapValues { manager.addLabelStyles(it.value) }
    val layers =
      layerOptions.mapValues { (id, options) ->
        val layer = manager.addLayer(options) ?: invalid("Could not create label layer $id.")
        ownedLabelLayers[id] = layer
        publicLayerIdsByNative[layer.layerId] = id
        layer
      }
    val lodLayers =
      lodLayerOptions.mapValues { (id, options) ->
        val layer = manager.addLodLayer(options) ?: invalid("Could not create LOD label layer $id.")
        ownedLodLabelLayers[id] = layer
        publicLayerIdsByNative[layer.layerId] = id
        layer
      }
    scene.labels.forEach { item ->
      val layer = layers[item.layerId] ?: notFound("layer", item.layerId)
      val native =
        layer.addLabel(item.options(styles[item.styleId] ?: notFound("style", item.styleId)))
          ?: invalid("Could not create label ${item.id}.")
      native.changePixelOffset(
        item.pixelOffset?.x?.dp("pixelOffset.x", density) ?: 0f,
        item.pixelOffset?.y?.dp("pixelOffset.y", density) ?: 0f,
        false,
      )
      native.rotateTo(Math.toRadians(item.orientation).toFloat())
      item.scale?.let { native.scaleTo(it.x.finiteFloat("scale.x"), it.y.finiteFloat("scale.y")) }
      item.badges.forEach { badge ->
        native.addBadge(badge.native(images, density)).firstOrNull()?.let {
          dynamicBadges.getOrPut(item.id) { mutableMapOf() }[badge.id] = it
          if (!badge.visible) it.hide()
        }
      }
      labels[item.id] = native
    }
    scene.lodLabels.forEach { item ->
      val layer = lodLayers[item.layerId] ?: notFound("LOD layer", item.layerId)
      val native =
        layer.addLodLabel(item.options(styles[item.styleId] ?: notFound("style", item.styleId)))
          ?: invalid("Could not create LOD label ${item.id}.")
      item.badges.forEach { badge ->
        native.addBadge(badge.native(images, density)).firstOrNull()?.let {
          dynamicBadges.getOrPut(item.id) { mutableMapOf() }[badge.id] = it
          if (!badge.visible) it.hide()
        }
      }
      lodLabels[item.id] = native
    }
    scene.pathLabels.forEach { item ->
      val layer = layers[item.layerId] ?: notFound("layer", item.layerId)
      val style = pathStyles[item.styleId] ?: notFound("path text style", item.styleId)
      val native =
        layer.addPolylineLabel(
          PolylineLabelOptions.from(item.id, item.text, item.points.map(MapLabelPoint::latLng)).setStyles(style).setVisible(item.visible),
        ) ?: invalid("Could not create path label ${item.id}.")
      pathLabels[item.id] = native
    }
    scene.animations.forEach { animation -> addAnimation(animation) }
  }

  private fun addAnimation(animation: MapLabelAnimationRecord) {
    animationDefinitions[animation.id] = animation
  }

  private fun clearOwnedLayers() {
    ownedLabelLayers.values.toList().forEach(manager::remove)
    ownedLodLabelLayers.values.toList().forEach(manager::remove)
    ownedLabelLayers.clear()
    ownedLodLabelLayers.clear()
    publicLayerIdsByNative.clear()
  }

  private fun makeNativeId(kind: String): String = "__rnk_${nativeNamespace}_${kind}_${++nextNativeObjectId}"

  private fun nativeStyleId(
    kind: String,
    publicId: String,
    fingerprint: String,
  ) = nativeStyleIdsByDefinition.getOrPut("$kind\u0000$publicId\u0000$fingerprint") { makeNativeId(kind) }

  private fun share(
    command: MapLabelCommandRecord,
    transform: Boolean,
  ) {
    val isEnabled = command.enabled.required()
    val source = label(command.sourceId ?: invalid("sourceId is required."))
    val target = label(command.targetId ?: invalid("targetId is required."))
    if (transform) {
      if (isEnabled) source.addShareTransform(target) else source.removeShareTransform(target)
    } else {
      if (isEnabled) source.addSharePosition(target) else source.removeSharePosition(target)
    }
  }

  private fun setBadgeVisibility(command: MapLabelCommandRecord) {
    val isVisible = command.visible.required()
    val id = command.requiredId()
    val badgeId = command.badgeId ?: invalid("badgeId is required.")
    if (command.style) {
      labels[id]?.let {
        if (isVisible) it.showStyleBadge(badgeId) else it.hideStyleBadge(badgeId)
        return
      }
      lodLabels[id]?.let {
        if (isVisible) it.showStyleBadge(badgeId) else it.hideStyleBadge(badgeId)
        return
      }
      notFound("label", id)
      return
    }
    val badge = dynamicBadges[id]?.get(badgeId) ?: notFound("badge", badgeId)
    if (isVisible) badge.show() else badge.hide()
  }

  private fun show(
    id: String,
    visible: Boolean,
    autoMove: Boolean,
    duration: Int,
  ) {
    labels[id]?.let {
      if (visible) {
        if (autoMove) it.show(true, duration) else it.show()
      } else {
        it.hide()
      }
      return
    }
    lodLabels[id]?.let {
      if (autoMove) throw CodedException(LABEL_UNSUPPORTED, "Android LOD labels do not expose auto-move.", null)
      if (visible) it.show() else it.hide()
      return
    }
    pathLabels[id]?.let {
      if (autoMove) throw CodedException(LABEL_UNSUPPORTED, "Path labels do not expose auto-move.", null)
      if (visible) it.show() else it.hide()
      return
    }
    notFound("label", id)
  }

  private fun label(id: String) =
    labels[id] ?: if (lodLabels.containsKey(id)) {
      throw CodedException(LABEL_UNSUPPORTED, "LOD label $id cannot be moved, transformed, animated, or tracked.", null)
    } else {
      notFound("label", id)
    }

  private fun requireActive() {
    if (isDisposed) throw CodedException("ERR_KAKAO_MAP_VIEW_DESTROYED", "The map view was destroyed.", null)
  }

  private fun loadImages(
    uris: Set<String>,
    currentGeneration: Int,
    completion: (Result<Map<String, Bitmap>>) -> Unit,
  ) {
    if (uris.isEmpty()) {
      completion(Result.success(emptyMap()))
      return
    }
    val images = mutableMapOf<String, Bitmap>()
    var remaining = uris.size
    var didFinish = false
    uris.forEach { uri ->
      imageRequests +=
        imageLoader.load(uri) { result ->
          if (isDisposed || currentGeneration != generation || didFinish) return@load
          result.fold(
            onSuccess = { image ->
              images[uri] = image
              remaining -= 1
              if (remaining == 0) {
                didFinish = true
                imageRequests.clear()
                completion(Result.success(images))
              }
            },
            onFailure = { error ->
              didFinish = true
              cancelImageRequests()
              completion(Result.failure(error))
            },
          )
        }
    }
  }

  private fun cancelImageRequests() {
    imageRequests.forEach(MapImageLoadToken::cancel)
    imageRequests.clear()
  }

  private fun finishApply(result: Result<Unit>) {
    val completion = pendingApplyCompletion ?: return
    pendingApplyCompletion = null
    completion(result)
  }

  private fun cancelPendingApply(message: String) {
    finishApply(Result.failure(CodedException(LABEL_APPLY_CANCELLED, message, null)))
  }
}

private fun validateScene(
  scene: MapLabelSceneRecord,
  density: Float,
) {
  unique("style", scene.styles.map { it.id })
  unique("path text style", scene.pathTextStyles.map { it.id })
  unique("layer", scene.layers.map { it.id } + scene.lodLayers.map { it.id })
  unique("label", scene.labels.map { it.id } + scene.lodLabels.map { it.id } + scene.pathLabels.map { it.id })
  unique("animation", scene.animations.map { it.id })
  val styleById = scene.styles.associateBy { it.id }
  val layerIds = scene.layers.mapTo(mutableSetOf()) { it.id }
  val lodLayerIds = scene.lodLayers.mapTo(mutableSetOf()) { it.id }
  val regularLabelIds = scene.labels.mapTo(mutableSetOf()) { it.id }
  (
    scene.styles.map { it.id } + scene.pathTextStyles.map { it.id } + layerIds + lodLayerIds +
      regularLabelIds + scene.lodLabels.map { it.id } + scene.pathLabels.map { it.id } + scene.animations.map { it.id }
  ).forEach { if (it.isBlank()) invalid("IDs must not be empty.") }
  scene.styles.forEach { style ->
    if (style.levels.isEmpty()) invalid("Style ${style.id} must contain at least one level.")
    unique("style level", style.levels.map { it.level.toString() })
    style.levels.forEach { level ->
      if (level.padding < 0) invalid("Style padding must be non-negative.")
      unique("style badge", level.badges.map { it.id })
      level.image?.validate()
      level.badges.forEach { it.image.validate() }
    }
  }
  scene.pathTextStyles.forEach { style ->
    if (style.levels.isEmpty()) invalid("Path style ${style.id} must contain at least one level.")
    unique("path style level", style.levels.map { it.level.toString() })
  }
  scene.layers.forEach { layer ->
    layer.competitionExceptions.forEach { if (it !in layerIds && it !in lodLayerIds) notFound("competition layer", it) }
  }
  scene.lodLayers.forEach { layer ->
    if (layer.radius < 0) invalid("LOD radius must be non-negative.")
    layer.competitionExceptions.forEach { if (it !in layerIds && it !in lodLayerIds) notFound("competition layer", it) }
  }
  (scene.labels + scene.lodLabels).forEach { item ->
    item.coordinate.validate()
    val style = styleById[item.styleId] ?: notFound("style", item.styleId)
    val expectedLayerIds = if (item is MapLodLabelRecord) lodLayerIds else layerIds
    if (item.layerId !in expectedLayerIds) notFound("layer", item.layerId)
    item.text.forEach { text ->
      if (text.styleIndex < 0 || style.levels.any { text.styleIndex >= it.textLines.size }) {
        invalid("Label ${item.id} has a text style index that is unavailable at one or more levels.")
      }
    }
    item.rank.integerLong("rank")
    transform(item.transform)
    item.pixelOffset?.validateVector("pixelOffset")
    item.orientation.finiteFloat("orientation")
    item.scale?.validateScale()
    unique("label badge", item.badges.map { it.id })
    item.badges.forEach {
      it.image.validate(density)
      it.offset?.validateVector("badge.offset")
    }
  }
  scene.pathLabels.forEach { item ->
    if (item.points.size < 2) invalid("Path label ${item.id} requires at least two points.")
    item.points.forEach(MapLabelPoint::validate)
    if (item.layerId !in layerIds) notFound("layer", item.layerId)
    if (scene.pathTextStyles.none { it.id == item.styleId }) notFound("path text style", item.styleId)
    if (item.rank != 0.0) {
      throw CodedException(LABEL_UNSUPPORTED, "Android Kakao Maps SDK cannot set a polyline label rank.", null)
    }
  }
  scene.animations.forEach { animation ->
    if (animation.labelIds.isEmpty() || animation.keyframes.isEmpty()) invalid("Animation ${animation.id} cannot be empty.")
    unique("animation label", animation.labelIds)
    animation.labelIds.forEach { if (it !in regularLabelIds) notFound("animatable label", it) }
    if (animation.repeatCount < 0) invalid("Animation repeatCount must be non-negative.")
    if (animation.effect != "drop" && animation.repeatCount != 1) {
      throw CodedException(LABEL_UNSUPPORTED, "Keyframe label animations do not expose repeatCount on Android.", null)
    }
    if (animation.effect !in setOf("drop", "alpha", "scale", "scaleAlpha", "transform")) {
      invalid("Unknown label animation effect: ${animation.effect}")
    }
    if (animation.effect == "drop" && animation.keyframes.size != 1) invalid("Drop animation requires exactly one keyframe.")
    animation.keyframes.forEach { frame ->
      frame.duration.duration()
      interpolation(frame.interpolation)
      frame.alpha?.unitFloat("alpha")
      frame.scale?.validateScale()
      frame.translation?.validateVector("translation")
      frame.rotation?.finiteFloat("rotation")
      if (animation.effect in setOf("scale", "scaleAlpha") && frame.scale == null) {
        invalid("${animation.effect} animation requires scale in every keyframe.")
      }
    }
  }
}

private fun MapLabelImage.validate(density: Float = 1f) {
  if (uri.isBlank()) invalid("Image URI must not be empty.")
  width?.positiveSize("image.width", density)
  height?.positiveSize("image.height", density)
}

private fun MapLabelVector.validateScale() {
  if (x.finiteFloat("scale.x") < 0 || y.finiteFloat("scale.y") < 0) invalid("Scale must be non-negative.")
}

private fun MapLabelVector.validateVector(name: String) {
  x.finiteFloat("$name.x")
  y.finiteFloat("$name.y")
}

private fun MapLabelSceneRecord.imageUris() =
  buildSet {
    styles.flatMap { it.levels }.forEach { level ->
      level.image?.let { add(it.uri) }
      level.badges.forEach { add(it.image.uri) }
    }
    (labels + lodLabels).flatMap { it.badges }.forEach { add(it.image.uri) }
  }

private fun MapLabelStyleRecord.fingerprint() =
  levels.sortedBy { it.level }.joinToString(";") { level ->
    listOf(
      level.level.toString(),
      level.image.fingerprint(),
      level.anchor.fingerprint(),
      level.padding.toBits().toString(),
      level.iconTransition.fingerprint(),
      level.textTransition.fingerprint(),
      level.textLayout.fingerprint(),
      level.textLines.joinToString(",", transform = MapLabelTextStyleRecord::fingerprint),
      level.badges.joinToString(",", transform = MapLabelBadgeStyleRecord::fingerprint),
    ).joinToString("|")
  }

private fun MapPathTextStyleRecord.fingerprint() = levels.sortedBy { it.level }.joinToString(";") { "${it.level}|${it.text.fingerprint()}" }

private fun MapLabelTextStyleRecord.fingerprint() =
  listOf(
    fontFamily.fingerprint(),
    fontSize.toBits().toString(),
    color.fingerprint(),
    strokeColor.fingerprint(),
    strokeWidth.toBits().toString(),
    characterSpacing.toBits().toString(),
    lineSpacing.toBits().toString(),
    aspectRatio.toBits().toString(),
  ).joinToString("|")

private fun MapLabelBadgeStyleRecord.fingerprint() =
  listOf(id.fingerprint(), image.fingerprint(), offset.fingerprint(), zOrder.toString()).joinToString("|")

private fun MapLabelImage?.fingerprint() =
  this?.let { listOf(uri.fingerprint(), width?.toBits(), height?.toBits()).joinToString("|") } ?: "-"

private fun MapLabelVector?.fingerprint() = this?.let { "${x.toBits()}|${y.toBits()}" } ?: "-"

private fun MapLabelTransitionRecord?.fingerprint() =
  this?.let { "${entrance.fingerprint()}|${exit.fingerprint()}|$enableEntrance|$enableExit" } ?: "-"

private fun String?.fingerprint() = this?.let { "${it.length}:$it" } ?: "-"

private fun MapLabelStyleRecord.native(
  images: Map<String, Bitmap>,
  nativeId: String,
  density: Float,
) = LabelStyles.from(
  nativeId,
  levels.sortedBy { it.level }.map { level ->
    val textStyles = level.textLines.map { it.native(density) }.toTypedArray()
    val image = level.image?.bitmap(images, density)
    val style =
      when {
        image != null -> LabelStyle.from(image).setTextStyles(*textStyles)
        textStyles.isNotEmpty() -> LabelStyle.from(*textStyles)
        else -> invalid("Style $id level ${level.level} needs an image or text style.")
      }
    style
      .setZoomLevel(level.level)
      .setPadding(level.padding.dp("padding", density))
      .setApplyDpScale(false)
    level.anchor?.let { style.setAnchorPoint(it.x.finiteFloat("anchor.x"), it.y.finiteFloat("anchor.y")) }
    level.iconTransition?.let { style.setIconTransition(it.native()) }
    level.textTransition?.let { style.setTextTransition(it.native()) }
    style.setTextGravity(textGravity(level.textLayout))
    if (level.badges.isNotEmpty()) style.setBadges(*level.badges.map { it.native(images, density) }.toTypedArray())
    style
  },
)

private fun MapPathTextStyleRecord.native(
  nativeId: String,
  density: Float,
) = PolylineLabelStyles.from(
  nativeId,
  levels.sortedBy { it.level }.map { level ->
    val text = level.text.native(density)
    PolylineLabelStyle
      .from(text.size, text.color, text.stroke, text.strokeColor)
      .setZoomLevel(level.level)
      .setApplyDpScale(false)
  },
)

private fun MapLabelTextStyleRecord.native(density: Float): LabelTextStyle {
  val nativeFontSize = fontSize.positiveDpInt("fontSize", density)
  val nativeLineSpace = lineSpacing.finiteFloat("lineSpacing")
  if (nativeLineSpace < 1) invalid("lineSpacing must be at least 1.")
  val nativeCharacterSpace = characterSpacing.dpInt("characterSpacing", density)
  if (nativeCharacterSpace < MIN_CHARACTER_SPACE_PX) {
    invalid("characterSpacing must resolve to at least $MIN_CHARACTER_SPACE_PX native pixels on Android.")
  }
  val result =
    LabelTextStyle.from(
      nativeFontSize,
      parseColor(color),
      strokeWidth.nonnegativeDpInt("strokeWidth", density),
      parseColor(strokeColor ?: "#00000000"),
    )
  fontFamily?.let(result::setFont)
  result.setCharacterSpace(nativeCharacterSpace)
  result.setLineSpace(nativeLineSpace)
  val ratio = aspectRatio.finiteFloat("aspectRatio")
  if (ratio <= 0) invalid("aspectRatio must be positive.")
  result.setAspectRatio(ratio)
  return result
}

private fun MapLabelTransitionRecord.native() =
  LabelTransition.from(transition(entrance), transition(exit)).enableTransitionWhenChange(enableEntrance, enableExit)

private fun MapLabelLayerRecord.options(
  nativeId: String,
  nativeLayerIds: Map<String, String>,
) = LabelLayerOptions
  .from(nativeId)
  .setCompetitionType(competitionType(competition))
  .setCompetitionUnit(competitionUnit(competitionUnit))
  .setOrderingType(ordering(ordering))
  .setZOrder(zOrder)
  .setVisible(visible)
  .setClickable(clickable)
  .addCompetitionExceptions(*competitionExceptions.map(nativeLayerIds::getValue).toTypedArray())

private fun MapLodLabelLayerRecord.options(
  nativeId: String,
  nativeLayerIds: Map<String, String>,
  density: Float,
) = (this as MapLabelLayerRecord).options(nativeId, nativeLayerIds).setLodRadius(radius.dp("radius", density))

private fun MapLabelRecord.options(style: LabelStyles) =
  LabelOptions
    .from(id, coordinate.latLng())
    .setStyles(style)
    .setTexts(LabelTextBuilder().apply { text.forEach { addTextLine(it.value, it.styleIndex) } })
    .setRank(rank.integerLong("rank"))
    .setClickable(clickable)
    .setVisible(visible)
    .setTransform(transform(transform))

private fun MapLabelBadgeStyleRecord.native(
  images: Map<String, Bitmap>,
  density: Float,
) = com.kakao.vectormap.label.BadgeOptions
  .from(id, image.bitmap(images, density))
  .setOffset(offset?.x?.dp("badge.offset.x", density) ?: 0f, offset?.y?.dp("badge.offset.y", density) ?: 0f)
  .setZOrder(zOrder)

private fun MapLabelBadgeRecord.native(
  images: Map<String, Bitmap>,
  density: Float,
) = com.kakao.vectormap.label.BadgeOptions
  .from(id, image.bitmap(images, density))
  .setOffset(offset?.x?.dp("badge.offset.x", density) ?: 0f, offset?.y?.dp("badge.offset.y", density) ?: 0f)
  .setZOrder(zOrder)

private fun MapLabelImage.bitmap(
  images: Map<String, Bitmap>,
  scale: Float = 1f,
): Bitmap {
  val source = images[uri] ?: invalid("Image was not loaded: $uri")
  if (width == null && height == null) {
    return source.copy(Bitmap.Config.ARGB_8888, false).also { it.density = Bitmap.DENSITY_NONE }
  }
  val targetWidth = width?.positiveSize("image.width", scale)
  val targetHeight = height?.positiveSize("image.height", scale)
  val ratio = source.width.toDouble() / source.height.toDouble()
  val resolvedWidth = targetWidth ?: ((targetHeight ?: invalid("Image dimensions are unavailable.")) * ratio).roundToInt().coerceAtLeast(1)
  val resolvedHeight = targetHeight ?: (resolvedWidth / ratio).roundToInt().coerceAtLeast(1)
  val resized = Bitmap.createScaledBitmap(source, resolvedWidth, resolvedHeight, true)
  return (if (resized === source) source.copy(Bitmap.Config.ARGB_8888, false) else resized)
    .also { it.density = Bitmap.DENSITY_NONE }
}

private fun Double.positiveSize(
  name: String,
  scale: Float = 1f,
): Int {
  val scaled = this * scale
  if (!scaled.isFinite() || scaled <= 0 || scaled > Int.MAX_VALUE) invalid("$name must be positive.")
  return scaled.roundToInt().coerceAtLeast(1)
}

private fun textGravity(value: String) =
  when (value) {
    "center" -> Gravity.CENTER
    "top" -> Gravity.TOP
    "bottom" -> Gravity.BOTTOM
    "left" -> Gravity.LEFT
    "right" -> Gravity.RIGHT
    else -> invalid("Unknown label text layout: $value")
  }

private fun MapLabelAnimationRecord.nativeAnimation(
  density: Float,
  nativeId: String,
): com.kakao.vectormap.animation.Animation =
  when (effect) {
    "drop" -> {
      DropAnimation
        .from(nativeId)
        .setPixelHeight(
          keyframes
            .firstOrNull()
            ?.translation
            ?.y
            ?.dp("translation.y", density) ?: 0f,
        ).setDuration(keyframes.firstOrNull()?.duration?.duration() ?: 0)
        .setRepeatCount(repeatCount)
        .setHideShapeAtStop(hideAtStop)
        .setRemoveLabelAtStop(removeAtStop)
    }

    "alpha" -> {
      AlphaAnimations
        .from(
          nativeId,
          *keyframes
            .map {
              AlphaAnimation
                .from(
                  (it.alpha ?: 1.0).unitFloat("alpha"),
                ).setDuration(it.duration.duration())
                .setInterpolation(interpolation(it.interpolation))
            }.toTypedArray(),
        ).setHideLabelAtStop(hideAtStop)
        .setRemoveLabelAtStop(removeAtStop)
        .setResetToInitialState(resetToInitialState)
    }

    "scale" -> {
      ScaleAnimations
        .from(
          nativeId,
          *keyframes
            .map { frame ->
              frame.scale.required().let {
                ScaleAnimation
                  .from(
                    it.x.finiteFloat("scale.x"),
                    it.y.finiteFloat("scale.y"),
                  ).setDuration(frame.duration.duration())
                  .setInterpolation(interpolation(frame.interpolation))
              }
            }.toTypedArray(),
        ).setHideLabelAtStop(hideAtStop)
        .setRemoveLabelAtStop(removeAtStop)
        .setResetToInitialState(resetToInitialState)
    }

    "scaleAlpha" -> {
      ScaleAlphaAnimations
        .from(
          nativeId,
          *keyframes
            .map { frame ->
              frame.scale.required().let {
                ScaleAlphaAnimation
                  .from(
                    it.x.finiteFloat("scale.x"),
                    it.y.finiteFloat("scale.y"),
                    (
                      frame.alpha
                        ?: 1.0
                    ).unitFloat("alpha"),
                  ).setDuration(frame.duration.duration())
                  .setInterpolation(interpolation(frame.interpolation))
              }
            }.toTypedArray(),
        ).setHideLabelAtStop(hideAtStop)
        .setRemoveLabelAtStop(removeAtStop)
        .setResetToInitialState(resetToInitialState)
    }

    "transform" -> {
      TransformAnimations
        .from(
          nativeId,
          *keyframes
            .map { frame ->
              TransformAnimation
                .from()
                .setDuration(frame.duration.duration())
                .setInterpolation(interpolation(frame.interpolation))
                .setAlpha((frame.alpha ?: 1.0).unitFloat("alpha"))
                .setScale(
                  frame.scale?.let { android.graphics.PointF(it.x.finiteFloat("scale.x"), it.y.finiteFloat("scale.y")) }
                    ?: android.graphics.PointF(1f, 1f),
                ).setPixelTranslation(
                  frame.translation?.let { android.graphics.PointF(it.x.dp("translation.x", density), it.y.dp("translation.y", density)) }
                    ?: android.graphics.PointF(),
                ).setRotation(Math.toRadians(frame.rotation ?: 0.0).toFloat())
            }.toTypedArray(),
        ).setHideLabelAtStop(hideAtStop)
        .setRemoveLabelAtStop(removeAtStop)
        .setResetToInitialState(resetToInitialState)
    }

    else -> {
      invalid("Unknown label animation effect: $effect")
    }
  }

private fun Label.clickPayload(
  kind: String,
  publicLayerId: String,
) = mapOf(
  "id" to labelId,
  "layerId" to publicLayerId,
  "kind" to kind,
  "coordinate" to mapOf("latitude" to position.latitude, "longitude" to position.longitude),
)

private fun LodLabel.clickPayload(
  kind: String,
  publicLayerId: String,
) = mapOf(
  "id" to labelId,
  "layerId" to publicLayerId,
  "kind" to kind,
  "coordinate" to mapOf("latitude" to position.latitude, "longitude" to position.longitude),
)

private fun MapLabelPoint.latLng(): LatLng {
  validate()
  return LatLng.from(latitude, longitude)
}

private fun MapLabelPoint.validate() {
  if (!latitude.isFinite() || !longitude.isFinite() || latitude !in -90.0..90.0 ||
    longitude !in -180.0..180.0
  ) {
    invalid("Invalid coordinate.")
  }
}

private fun Double.duration(): Int {
  if (!isFinite() || this < 0 || this > Int.MAX_VALUE ||
    this % 1.0 != 0.0
  ) {
    invalid("Duration must be a non-negative 32-bit integer.")
  }
  return toInt()
}

private fun Double.finiteFloat(name: String): Float {
  if (!isFinite() || this > Float.MAX_VALUE ||
    this < -Float.MAX_VALUE
  ) {
    invalid("$name must be finite.")
  }
  return toFloat()
}

private fun Double.dp(
  name: String,
  density: Float,
): Float {
  if (!density.isFinite() || density <= 0) invalid("Display density must be positive.")
  val value = this * density
  return value.finiteFloat(name)
}

private fun Double.dpInt(
  name: String,
  density: Float,
): Int {
  if (!isFinite()) invalid("$name must be finite.")
  if (!density.isFinite() || density <= 0) invalid("Display density must be positive.")
  val value = this * density
  if (!value.isFinite() || value > Int.MAX_VALUE || value < Int.MIN_VALUE) {
    invalid("$name is outside the supported range.")
  }
  return value.roundToInt()
}

private fun Double.nonnegativeDpInt(
  name: String,
  density: Float,
): Int {
  if (this < 0) invalid("$name must be non-negative.")
  return dpInt(name, density).also { if (it < 0) invalid("$name must be non-negative.") }
}

private fun Double.positiveDpInt(
  name: String,
  density: Float,
): Int {
  if (this <= 0) invalid("$name must be positive.")
  return dpInt(name, density).also { if (it <= 0) invalid("$name must be positive.") }
}

private fun Double.unitFloat(name: String): Float {
  val value = finiteFloat(name)
  if (value !in 0f..1f) invalid("$name must be between 0 and 1.")
  return value
}

private fun Double.integerLong(name: String): Long {
  if (!isFinite() || this % 1.0 != 0.0 || this > Long.MAX_VALUE || this < Long.MIN_VALUE) {
    invalid("$name must be an integer.")
  }
  return toLong()
}

private fun Double.integerInt(name: String): Int {
  val value = integerLong(name)
  if (value > Int.MAX_VALUE || value < Int.MIN_VALUE) invalid("$name is outside the supported range.")
  return value.toInt()
}

private fun Double.nonnegativeInt(name: String): Int {
  val value = integerInt(name)
  if (value < 0) invalid("$name must be non-negative.")
  return value
}

private fun Double.positiveInt(name: String): Int {
  val value = integerInt(name)
  if (value <= 0) invalid("$name must be positive.")
  return value
}

private fun parseColor(value: String): Int {
  val hex = value.removePrefix("#")
  if (hex.length != 6 && hex.length != 8) invalid("Invalid color: $value")
  val number = hex.toLongOrNull(16) ?: invalid("Invalid color: $value")
  val hasAlpha = hex.length == 8
  val red = ((number shr (if (hasAlpha) 24 else 16)) and 0xFF).toInt()
  val green = ((number shr (if (hasAlpha) 16 else 8)) and 0xFF).toInt()
  val blue = ((number shr (if (hasAlpha) 8 else 0)) and 0xFF).toInt()
  val alpha = if (hasAlpha) (number and 0xFF).toInt() else 0xFF
  return Color.argb(alpha, red, green, blue)
}

private fun transition(value: String) =
  when (value) {
    "none" -> Transition.None
    "alpha" -> Transition.Alpha
    "scale" -> Transition.Scale
    else -> invalid("Unknown transition: $value")
  }

private fun competitionType(value: String) =
  when (value) {
    "none" -> CompetitionType.None
    "all" -> CompetitionType.All
    "upper" -> CompetitionType.Upper
    "upperLower" -> CompetitionType.UpperLower
    "upperSame" -> CompetitionType.UpperSame
    "same" -> CompetitionType.Same
    "sameLower" -> CompetitionType.SameLower
    "lower" -> CompetitionType.Lower
    else -> invalid("Unknown competition: $value")
  }

private fun competitionUnit(value: String) =
  when (value) {
    "iconAndText" -> CompetitionUnit.IconAndText
    "iconFirst" -> CompetitionUnit.IconFirst
    else -> invalid("Unknown competition unit: $value")
  }

private fun ordering(value: String) =
  when (value) {
    "rank" -> OrderingType.Rank
    "leftBottom" -> OrderingType.LeftBottom
    else -> invalid("Unknown ordering: $value")
  }

private fun transform(value: String) =
  when (value) {
    "none" -> TransformMethod.None
    "absoluteRotation" -> TransformMethod.AbsoluteRotation
    "default" -> TransformMethod.Default
    "absoluteRotationKeepUpright" -> TransformMethod.AbsoluteRotation_KeepUpright
    "absoluteRotationDecal" -> TransformMethod.AbsoluteRotation_Decal
    "decal" -> TransformMethod.Decal
    else -> invalid("Unknown transform: $value")
  }

private fun interpolation(value: String) =
  when (value) {
    "linear" -> Interpolation.Linear
    "cubicIn" -> Interpolation.CubicIn
    "cubicOut" -> Interpolation.CubicOut
    "cubicInOut" -> Interpolation.CubicInOut
    else -> invalid("Unknown interpolation: $value")
  }

private fun unique(
  kind: String,
  values: List<String>,
) {
  val duplicate =
    values
      .groupingBy { it }
      .eachCount()
      .entries
      .firstOrNull {
        it.value >
          1
      }?.key
  ; if (duplicate != null) invalid("Duplicate $kind id: $duplicate")
}

private fun MapLabelCommandRecord.requiredId() = id ?: invalid("id is required.")

private fun <T : Any> T?.required(): T = this ?: invalid("Required value is missing.")

private fun invalid(message: String): Nothing = throw CodedException(LABEL_INVALID_ARGUMENT, message, null)

private fun notFound(
  kind: String,
  id: String,
): Nothing = throw CodedException(LABEL_NOT_FOUND, "$kind not found: $id", null)
