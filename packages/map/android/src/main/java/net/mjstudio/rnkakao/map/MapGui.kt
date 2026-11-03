package net.mjstudio.rnkakao.map

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.PointF
import com.kakao.vectormap.KakaoMap
import com.kakao.vectormap.LatLng
import com.kakao.vectormap.MapGravity
import com.kakao.vectormap.mapwidget.InfoWindow
import com.kakao.vectormap.mapwidget.InfoWindowOptions
import com.kakao.vectormap.mapwidget.MapWidget
import com.kakao.vectormap.mapwidget.MapWidgetOptions
import com.kakao.vectormap.mapwidget.component.GuiImage
import com.kakao.vectormap.mapwidget.component.GuiLayout
import com.kakao.vectormap.mapwidget.component.GuiText
import com.kakao.vectormap.mapwidget.component.GuiView
import com.kakao.vectormap.mapwidget.component.Horizontal
import com.kakao.vectormap.mapwidget.component.Orientation
import com.kakao.vectormap.mapwidget.component.Vertical
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Required
import java.lang.ref.WeakReference
import kotlin.math.roundToInt

private const val GUI_INVALID_ARGUMENT = "ERR_KAKAO_MAP_GUI_INVALID_ARGUMENT"
private const val GUI_NOT_FOUND = "ERR_KAKAO_MAP_GUI_NOT_FOUND"
private const val GUI_UNSUPPORTED = "ERR_KAKAO_MAP_UNSUPPORTED_PLATFORM_FEATURE"
private const val GUI_APPLY_CANCELLED = "ERR_KAKAO_MAP_GUI_APPLY_CANCELLED"
private const val GUI_NATIVE_ERROR = "ERR_KAKAO_MAP_GUI_NATIVE"

class MapGuiImageSourceRecord : Record {
  @Field @Required
  var uri: String = ""

  @Field var width: Double? = null

  @Field var height: Double? = null
}

class MapGuiSizeRecord : Record {
  @Field @Required
  var width: Double = Double.NaN

  @Field @Required
  var height: Double = Double.NaN
}

class MapGuiStrokeRecord : Record {
  @Field @Required
  var color: String = ""

  @Field @Required
  var width: Double = Double.NaN
}

class MapGuiSplitLineRecord : Record {
  @Field @Required
  var color: String = ""

  @Field @Required
  var width: Double = Double.NaN
}

class MapGuiIosLayoutRecord : Record {
  @Field var backgroundColor: String? = null

  @Field var splitLine: MapGuiSplitLineRecord? = null
}

class MapGuiAndroidLayoutRecord : Record {
  @Field var background: MapGuiNodeRecord? = null
}

class MapGuiNodeRecord : Record {
  @Field @Required
  var id: String = ""

  @Field @Required
  var type: String = ""

  @Field var platform: String? = null

  @Field var clickable: Boolean = false

  @Field var padding: MapPaddingRecord? = null

  @Field var origin: String? = null

  @Field var align: String? = null

  @Field var orientation: String? = null

  @Field var children: List<MapGuiNodeRecord> = emptyList()

  @Field var child: MapGuiNodeRecord? = null

  @Field var source: MapGuiImageSourceRecord? = null

  @Field var pressedSource: MapGuiImageSourceRecord? = null

  @Field var sources: List<MapGuiImageSourceRecord> = emptyList()

  @Field var size: MapGuiSizeRecord? = null

  @Field var pressedSize: MapGuiSizeRecord? = null

  @Field var stretch: MapPaddingRecord? = null

  @Field var text: String? = null

  @Field var textSize: Double? = null

  @Field var color: String? = null

  @Field var stroke: MapGuiStrokeRecord? = null

  @Field var duration: Double? = null

  @Field var repeat: Double? = null

  @Field var autoStart: Boolean = false

  @Field var ios: MapGuiIosLayoutRecord? = null

  @Field var android: MapGuiAndroidLayoutRecord? = null
}

class MapGuiAutoMoveRecord : Record {
  @Field @Required
  var enabled: Boolean = false

  @Field var duration: Double? = null
}

class MapGuiInfoWindowRecord : Record {
  @Field @Required
  var id: String = ""

  @Field @Required
  var position: CoordinateRecord = CoordinateRecord()

  @Field @Required
  var body: MapGuiNodeRecord = MapGuiNodeRecord()

  @Field var tail: MapGuiNodeRecord? = null

  @Field var bodyOffset: ScreenPointRecord? = null

  @Field var tailOffset: ScreenPointRecord? = null

  @Field var visible: Boolean = true

  @Field var zIndex: Int = 0

  @Field var autoMove: MapGuiAutoMoveRecord? = null
}

class MapGuiWidgetRecord : Record {
  @Field @Required
  var id: String = ""

  @Field @Required
  var position: MapWidgetPositionRecord = MapWidgetPositionRecord()

  @Field @Required
  var root: MapGuiNodeRecord = MapGuiNodeRecord()

  @Field var visible: Boolean = true

  @Field var zIndex: Int = 0

  @Field var rotation: Double = 0.0

  @Field var ios: MapGuiIosLayoutRecord? = null
}

class MapGuiDropAnimationRecord : Record {
  @Field @Required
  var id: String = ""

  @Field @Required
  var platform: String = "ios"

  @Field @Required
  var infoWindowIds: List<String> = emptyList()

  @Field @Required
  var duration: Double = Double.NaN

  @Field @Required
  var pixelHeight: Double = Double.NaN

  @Field var interpolation: String = "linear"

  @Field var repeat: Double = 1.0

  @Field var hideAtStop: Boolean = false

  @Field var removeAtStop: Boolean = false
}

class MapGuiSceneRecord : Record {
  @Field var infoWindows: List<MapGuiInfoWindowRecord> = emptyList()

  @Field var widgets: List<MapGuiWidgetRecord> = emptyList()

  @Field var animations: List<MapGuiDropAnimationRecord> = emptyList()
}

internal class MapGui(
  private val map: KakaoMap,
  private val density: Float,
  private val imageLoader: MapImageLoader,
  private val emit: (Map<String, Any>) -> Unit,
) {
  private val infoWindows = mutableMapOf<String, InfoWindow>()
  private val widgets = mutableMapOf<String, MapWidget>()
  private val imageTokens = mutableListOf<MapImageLoadToken>()
  private var applyGeneration = 0
  private var pendingApply: ((CodedException?) -> Unit)? = null
  private var isDisposed = false

  init {
    val owner = WeakReference(this)
    map.setOnInfoWindowClickListener { _, infoWindow, componentId ->
      owner.get()?.takeUnless { it.isDisposed }?.run {
        if (infoWindows[infoWindow.id] !== infoWindow) return@run
        emit(
          mapOf(
            "type" to "tap",
            "ownerType" to "infoWindow",
            "ownerId" to infoWindow.id,
            "componentId" to componentId,
          ),
        )
      }
    }
    map.setOnMapWidgetClickListener { _, widget, componentId ->
      owner.get()?.takeUnless { it.isDisposed }?.run {
        if (widgets[widget.id] !== widget) return@run
        emit(
          mapOf(
            "type" to "tap",
            "ownerType" to "widget",
            "ownerId" to widget.id,
            "componentId" to componentId,
          ),
        )
      }
    }
  }

  fun apply(
    scene: MapGuiSceneRecord,
    completion: (CodedException?) -> Unit,
  ) {
    if (isDisposed) {
      completion(CodedException(GUI_NOT_FOUND, "The GUI manager was disposed.", null))
      return
    }
    try {
      validate(scene)
    } catch (error: CodedException) {
      completion(error)
      return
    }
    applyGeneration += 1
    pendingApply?.invoke(CodedException(GUI_APPLY_CANCELLED, "A newer GUI scene replaced this apply request.", null))
    pendingApply = completion
    val generation = applyGeneration
    imageTokens.forEach(MapImageLoadToken::cancel)
    imageTokens.clear()
    loadImages(scene, generation) { result ->
      if (isDisposed || generation != applyGeneration) return@loadImages
      result.fold(
        onSuccess = { images ->
          try {
            replaceScene(scene, images)
            pendingApply = null
            completion(null)
          } catch (error: CodedException) {
            runCatching(::clearScene)
            pendingApply = null
            completion(error)
          } catch (error: Throwable) {
            runCatching(::clearScene)
            pendingApply = null
            completion(CodedException(GUI_NATIVE_ERROR, error.message ?: "The native GUI operation failed.", error))
          }
        },
        onFailure = { error ->
          pendingApply = null
          completion(CodedException("ERR_KAKAO_MAP_IMAGE_LOAD", error.message ?: "Image load failed.", error))
        },
      )
    }
  }

  fun showInfoWindow(
    id: String,
    autoMove: Boolean,
    duration: Double?,
  ) {
    val infoWindow = requireInfoWindow(id)
    val nativeDuration = duration?.let(::duration) ?: 0
    when {
      autoMove && nativeDuration > 0 -> infoWindow.show(true, nativeDuration)
      autoMove -> infoWindow.show(true)
      else -> infoWindow.show()
    }
  }

  fun hideInfoWindow(id: String) = requireInfoWindow(id).hide()

  fun moveInfoWindow(
    id: String,
    position: CoordinateRecord,
    duration: Double,
  ) {
    position.validate()
    requireInfoWindow(id).moveTo(position.latLng(), duration(duration).toLong())
  }

  fun showWidget(id: String) = requireWidget(id).show()

  fun hideWidget(id: String) = requireWidget(id).hide()

  fun positionWidget(
    id: String,
    position: MapWidgetPositionRecord,
  ) {
    position.validate("Widget position")
    requireWidget(id).setPosition(position.nativeGravity(), position.x.toDpPixels(), position.y.toDpPixels())
  }

  fun rotateWidget(
    id: String,
    rotation: Double,
  ) {
    if (!rotation.isFinite()) invalid("Widget rotation must be finite.")
    requireWidget(id).setRotation(Math.toRadians(rotation).toFloat())
  }

  fun startAnimation(id: String): Unit =
    throw CodedException(
      GUI_UNSUPPORTED,
      "Info-window animator $id is unavailable in Android SDK 2.15.2.",
      null,
    )

  fun stopAnimation(id: String): Unit = startAnimation(id)

  fun controlAnimatedImage(
    ownerType: String,
    ownerId: String,
    componentId: String,
    action: String,
  ): Unit =
    throw CodedException(
      GUI_UNSUPPORTED,
      "Animated GUI image $componentId on $ownerType $ownerId cannot run $action on Android SDK 2.15.2.",
      null,
    )

  fun status(): Map<String, Any> {
    if (isDisposed) throw CodedException(GUI_NOT_FOUND, "The GUI manager was disposed.", null)
    val manager = requireManager()
    val infoWindowStatus =
      manager.infoWindowLayer.allInfoWindows.orEmpty().sortedBy(InfoWindow::getId).map { infoWindow ->
        mapOf(
          "id" to infoWindow.id,
          "visible" to infoWindow.isShow,
          "position" to
            mapOf(
              "latitude" to infoWindow.position.latitude,
              "longitude" to infoWindow.position.longitude,
            ),
          "zIndex" to infoWindow.zOrder,
        )
      }
    val widgetStatus =
      manager.mapWidgetLayer.allMapWidgets.orEmpty().sortedBy(MapWidget::getId).map { widget ->
        mapOf(
          "id" to widget.id,
          "visible" to widget.isShow,
          "position" to
            mapOf(
              "gravity" to gravityName(widget.mapGravity),
              "x" to widget.position.x / density,
              "y" to widget.position.y / density,
            ),
          "rotation" to Math.toDegrees(widget.rotation.toDouble()),
          "zIndex" to widget.zOrder,
        )
      }
    return mapOf(
      "infoWindows" to infoWindowStatus,
      "widgets" to widgetStatus,
      "animations" to emptyList<Map<String, Any>>(),
      "counts" to
        mapOf(
          "infoWindows" to infoWindowStatus.size,
          "widgets" to widgetStatus.size,
          "animations" to 0,
        ),
      "capabilities" to
        mapOf(
          "button" to false,
          "animatedImage" to false,
          "infoWindowAnimation" to false,
          "arbitraryComponentClicks" to true,
          "componentAnimationEvents" to false,
          "guiMoveEvents" to false,
          "autoMoveDuration" to true,
        ),
    )
  }

  fun dispose() {
    if (isDisposed) return
    isDisposed = true
    applyGeneration += 1
    pendingApply?.invoke(CodedException(GUI_APPLY_CANCELLED, "The GUI manager was disposed.", null))
    pendingApply = null
    imageTokens.forEach(MapImageLoadToken::cancel)
    imageTokens.clear()
    runCatching(::clearScene)
    infoWindows.clear()
    widgets.clear()
    runCatching { map.setOnInfoWindowClickListener(null) }
    runCatching { map.setOnMapWidgetClickListener(null) }
  }

  private fun replaceScene(
    scene: MapGuiSceneRecord,
    images: Map<String, Bitmap>,
  ) {
    clearScene()
    val manager = requireManager()
    scene.infoWindows.forEach { record ->
      val options =
        InfoWindowOptions
          .from(record.id, record.position.latLng())
          .setBody(component(record.body, images))
          .setApplyDpScale(false)
          .setVisible(false)
          .setZOrder(record.zIndex)
      record.tail?.let { options.setTail(image(it, images)) }
      record.bodyOffset?.let {
        options.setBodyOffset(it.x.dpPixelsFloat("Info-window body offset x"), it.y.dpPixelsFloat("Info-window body offset y"))
      }
      record.tailOffset?.let {
        options.setTailOffset(it.x.dpPixelsFloat("Info-window tail offset x"), it.y.dpPixelsFloat("Info-window tail offset y"))
      }
      val infoWindow =
        manager.infoWindowLayer.addInfoWindow(options)
          ?: throw CodedException(GUI_NATIVE_ERROR, "Could not add info window ${record.id}.", null)
      if (record.visible) {
        val autoMove = record.autoMove
        when {
          autoMove?.enabled == true && autoMove.duration != null -> {
            infoWindow.show(true, duration(autoMove.duration!!))
          }

          autoMove?.enabled == true -> {
            infoWindow.show(true)
          }

          else -> {
            infoWindow.show()
          }
        }
      }
      infoWindows[record.id] = infoWindow
    }
    scene.widgets.forEach { record ->
      val options =
        MapWidgetOptions
          .from(
            record.id,
            record.position.nativeGravity(),
            record.position.x.dpPixelsInt("Widget position x"),
            record.position.y.dpPixelsInt("Widget position y"),
          ).setRootView(component(record.root, images))
          .setVisible(record.visible)
          .setZOrder(record.zIndex)
          .setRotation(Math.toRadians(record.rotation).toFloat())
      val widget =
        manager.mapWidgetLayer.addMapWidget(options)
          ?: throw CodedException(GUI_NATIVE_ERROR, "Could not add widget ${record.id}.", null)
      widgets[record.id] = widget
    }
  }

  private fun clearScene() {
    val manager = requireManager()
    manager.infoWindowLayer.removeAll()
    manager.mapWidgetLayer.removeAll()
    infoWindows.clear()
    widgets.clear()
  }

  private fun component(
    record: MapGuiNodeRecord,
    images: Map<String, Bitmap>,
  ): GuiView {
    val result =
      when (record.type) {
        "layout" -> {
          GuiLayout(if (record.orientation == "horizontal") Orientation.Horizontal else Orientation.Vertical).apply {
            record.children.forEach { addView(component(it, images)) }
            record.android?.background?.let { setBackground(image(it, images)) }
          }
        }

        "image" -> {
          image(record, images)
        }

        "text" -> {
          val text = record.text ?: invalid("GUI text is required.")
          GuiText(text).apply {
            setTextSize(positiveDpPixels(record.textSize ?: 0.0, "Text size"))
            setTextColor(color(record.color ?: ""))
            record.stroke?.let {
              setStrokeColor(color(it.color))
              setStrokeSize(nonnegativeDpPixels(it.width, "Text stroke width"))
            }
          }
        }

        "button", "animatedImage" -> {
          throw CodedException(
            GUI_UNSUPPORTED,
            "${record.type} is unavailable in Android SDK 2.15.2.",
            null,
          )
        }

        else -> {
          invalid("Unknown GUI component type: ${record.type}.")
        }
      }
    result.id = record.id
    result.isClickable = record.clickable
    record.padding?.let {
      result.setPadding(
        nonnegativeDpPixels(it.left, "GUI padding left"),
        nonnegativeDpPixels(it.top, "GUI padding top"),
        nonnegativeDpPixels(it.right, "GUI padding right"),
        nonnegativeDpPixels(it.bottom, "GUI padding bottom"),
      )
    }
    val origin = alignment(record.origin ?: "topLeft")
    result.setOrigin(origin.first, origin.second)
    val align = alignment(record.align ?: "topLeft")
    result.setAlign(align.first, align.second)
    return result
  }

  private fun image(
    record: MapGuiNodeRecord,
    images: Map<String, Bitmap>,
  ): GuiImage {
    val source = record.source
    val nativeImage = requiredImage(source, images)
    val requestedWidth = record.size?.width ?: source?.width
    val requestedHeight = record.size?.height ?: source?.height
    val aspectRatio = nativeImage.width.toDouble() / nativeImage.height
    val width = requestedWidth ?: requestedHeight?.times(aspectRatio)
    val height = requestedHeight ?: requestedWidth?.div(aspectRatio)
    val sizedImage =
      if (width != null && height != null) {
        Bitmap.createScaledBitmap(
          nativeImage,
          positiveDpPixels(width, "Image width"),
          positiveDpPixels(height, "Image height"),
          true,
        )
      } else {
        nativeImage
      }
    val displayedImage =
      (if (sizedImage === nativeImage) sizedImage.copy(Bitmap.Config.ARGB_8888, false) else sizedImage).also {
        it.density = Bitmap.DENSITY_NONE
      }
    val guiImage = GuiImage(displayedImage)
    record.stretch?.let {
      guiImage.setFixedArea(
        nonnegativeDpPixels(it.left, "Image stretch left"),
        nonnegativeDpPixels(it.top, "Image stretch top"),
        nonnegativeDpPixels(it.right, "Image stretch right"),
        nonnegativeDpPixels(it.bottom, "Image stretch bottom"),
      )
    }
    record.child?.let { guiImage.addChild(component(it, images)) }
    return guiImage
  }

  private fun loadImages(
    scene: MapGuiSceneRecord,
    generation: Int,
    completion: (Result<Map<String, Bitmap>>) -> Unit,
  ) {
    val sources = mutableMapOf<String, MapGuiImageSourceRecord>()
    scene.infoWindows.forEach {
      collectImages(it.body, sources)
      it.tail?.let { tail -> collectImages(tail, sources) }
    }
    scene.widgets.forEach { collectImages(it.root, sources) }
    if (sources.isEmpty()) {
      completion(Result.success(emptyMap()))
      return
    }
    val images = mutableMapOf<String, Bitmap>()
    var remaining = sources.size
    var failure: Throwable? = null
    sources.values.forEach { source ->
      imageTokens +=
        imageLoader.load(source.uri) { result ->
          if (isDisposed || generation != applyGeneration) return@load
          result.onSuccess { images[source.uri] = it }
          result.onFailure { if (failure == null) failure = it }
          remaining -= 1
          if (remaining == 0) {
            imageTokens.clear()
            completion(failure?.let { Result.failure(it) } ?: Result.success(images))
          }
        }
    }
  }

  private fun collectImages(
    record: MapGuiNodeRecord,
    sources: MutableMap<String, MapGuiImageSourceRecord>,
  ) {
    listOfNotNull(record.source, record.pressedSource).forEach { sources[it.uri] = it }
    record.sources.forEach { sources[it.uri] = it }
    record.children.forEach { collectImages(it, sources) }
    record.child?.let { collectImages(it, sources) }
    record.android?.background?.let { collectImages(it, sources) }
  }

  private fun validate(scene: MapGuiSceneRecord) {
    unique(scene.infoWindows.map { it.id }, "info-window")
    unique(scene.widgets.map { it.id }, "widget")
    unique(scene.animations.map { it.id }, "GUI animation")
    if (scene.animations.isNotEmpty()) {
      throw CodedException(GUI_UNSUPPORTED, "Info-window animators are unavailable in Android SDK 2.15.2.", null)
    }
    scene.infoWindows.forEach { record ->
      nonempty(record.id, "Info-window ID")
      record.position.validate()
      record.bodyOffset?.let {
        it.validate("Info-window body offset")
        it.x.dpPixelsFloat("Info-window body offset x")
        it.y.dpPixelsFloat("Info-window body offset y")
      }
      record.tailOffset?.let {
        it.validate("Info-window tail offset")
        it.x.dpPixelsFloat("Info-window tail offset x")
        it.y.dpPixelsFloat("Info-window tail offset y")
      }
      val componentIds = mutableSetOf<String>()
      validate(record.body, componentIds)
      record.tail?.let {
        if (it.type != "image") invalid("Info-window tails must be images.")
        validate(it, componentIds)
      }
      record.autoMove?.duration?.let(::duration)
    }
    scene.widgets.forEach { record ->
      nonempty(record.id, "Widget ID")
      if (record.root.type != "layout") invalid("Widget roots must be layouts.")
      record.position.validate("Widget position")
      record.position.x.dpPixelsInt("Widget position x")
      record.position.y.dpPixelsInt("Widget position y")
      if (!record.rotation.isFinite()) invalid("Widget rotation must be finite.")
      validate(record.root, mutableSetOf())
    }
  }

  private fun validate(
    record: MapGuiNodeRecord,
    ids: MutableSet<String>,
  ) {
    nonempty(record.id, "GUI component ID")
    if (!ids.add(record.id)) invalid("Duplicate GUI component ID: ${record.id}.")
    alignment(record.origin ?: "topLeft")
    alignment(record.align ?: "topLeft")
    record.size?.validate("Image size")
    record.pressedSize?.validate("Pressed image size")
    record.stretch?.validateNonnegative("Image stretch")
    record.padding?.validateNonnegative("GUI padding")
    when (record.type) {
      "layout" -> {
        if (record.orientation !in setOf("horizontal", "vertical")) {
          invalid("GUI layout orientation must be horizontal or vertical.")
        }
        record.children.forEach { validate(it, ids) }
        record.android?.background?.let { validate(it, ids) }
      }

      "image" -> {
        validateSource(record.source)
        record.child?.let { validate(it, ids) }
      }

      "text" -> {
        if (record.text == null) invalid("GUI text is required.")
        positiveDpPixels(record.textSize ?: 0.0, "Text size")
        color(record.color ?: "")
        record.stroke?.let {
          color(it.color)
          nonnegativeDpPixels(it.width, "Text stroke width")
        }
      }

      "button", "animatedImage" -> {
        throw CodedException(GUI_UNSUPPORTED, "${record.type} is unavailable in Android SDK 2.15.2.", null)
      }

      else -> {
        invalid("Unknown GUI component type: ${record.type}.")
      }
    }
  }

  private fun validateSource(source: MapGuiImageSourceRecord?) {
    if (source == null || source.uri.isBlank()) invalid("GUI image URI must not be empty.")
    source.width?.let { positiveDpPixels(it, "Image source width") }
    source.height?.let { positiveDpPixels(it, "Image source height") }
  }

  private fun requiredImage(
    source: MapGuiImageSourceRecord?,
    images: Map<String, Bitmap>,
  ): Bitmap {
    validateSource(source)
    return images[source!!.uri] ?: invalid("GUI image was not loaded.")
  }

  private fun requireInfoWindow(id: String): InfoWindow {
    if (isDisposed) throw CodedException(GUI_NOT_FOUND, "The GUI manager was disposed.", null)
    return infoWindows[id] ?: throw CodedException(GUI_NOT_FOUND, "Info window $id was not found.", null)
  }

  private fun requireWidget(id: String): MapWidget {
    if (isDisposed) throw CodedException(GUI_NOT_FOUND, "The GUI manager was disposed.", null)
    return widgets[id] ?: throw CodedException(GUI_NOT_FOUND, "Widget $id was not found.", null)
  }

  private fun requireManager() = map.mapWidgetManager ?: throw CodedException(GUI_NOT_FOUND, "The map widget manager is unavailable.", null)

  private fun CoordinateRecord.latLng() = LatLng.from(latitude, longitude)

  private fun Double.toDpPixels() = dpPixelsFloat("Screen position")

  private fun Double.dpPixelsFloat(name: String): Float {
    val pixels = this * density
    if (!pixels.isFinite() || pixels > Float.MAX_VALUE || pixels < -Float.MAX_VALUE) {
      invalid("$name must fit a 32-bit floating-point pixel value.")
    }
    return pixels.toFloat()
  }

  private fun Double.dpPixelsInt(name: String): Int {
    val pixels = this * density
    if (!pixels.isFinite() || pixels > Int.MAX_VALUE || pixels < Int.MIN_VALUE) {
      invalid("$name is out of range after pixel conversion.")
    }
    return pixels.roundToInt()
  }

  private fun positiveDpPixels(
    value: Double,
    name: String,
  ): Int {
    positiveInt(value, name)
    return pixelInt(value, name, isPositive = true)
  }

  private fun nonnegativeDpPixels(
    value: Double,
    name: String,
  ): Int {
    nonnegativeInt(value, name)
    return pixelInt(value, name, isPositive = false)
  }

  private fun pixelInt(
    value: Double,
    name: String,
    isPositive: Boolean,
  ): Int {
    val pixels = value * density
    if (!pixels.isFinite() || pixels > Int.MAX_VALUE) invalid("$name is too large after pixel conversion.")
    val result = pixels.roundToInt()
    if (isPositive && result <= 0) invalid("$name is too small after pixel conversion.")
    return result
  }

  private fun MapGuiSizeRecord.validate(name: String) {
    positiveDpPixels(width, "$name width")
    positiveDpPixels(height, "$name height")
  }

  private fun MapPaddingRecord.validateNonnegative(name: String) {
    nonnegativeDpPixels(top, "$name top")
    nonnegativeDpPixels(right, "$name right")
    nonnegativeDpPixels(bottom, "$name bottom")
    nonnegativeDpPixels(left, "$name left")
  }

  private fun alignment(value: String): Pair<Vertical, Horizontal> =
    when (value) {
      "topLeft" -> Vertical.Top to Horizontal.Left
      "topCenter" -> Vertical.Top to Horizontal.Center
      "topRight" -> Vertical.Top to Horizontal.Right
      "centerLeft" -> Vertical.Center to Horizontal.Left
      "center" -> Vertical.Center to Horizontal.Center
      "centerRight" -> Vertical.Center to Horizontal.Right
      "bottomLeft" -> Vertical.Bottom to Horizontal.Left
      "bottomCenter" -> Vertical.Bottom to Horizontal.Center
      "bottomRight" -> Vertical.Bottom to Horizontal.Right
      else -> invalid("Unknown GUI alignment: $value.")
    }

  private fun gravityName(gravity: Int) =
    when (gravity) {
      MapGravity.TOP or MapGravity.LEFT -> "topLeft"
      MapGravity.TOP or MapGravity.CENTER_HORIZONTAL -> "topCenter"
      MapGravity.TOP or MapGravity.RIGHT -> "topRight"
      MapGravity.CENTER_VERTICAL or MapGravity.LEFT -> "centerLeft"
      MapGravity.CENTER -> "center"
      MapGravity.CENTER_VERTICAL or MapGravity.RIGHT -> "centerRight"
      MapGravity.BOTTOM or MapGravity.LEFT -> "bottomLeft"
      MapGravity.BOTTOM or MapGravity.CENTER_HORIZONTAL -> "bottomCenter"
      MapGravity.BOTTOM or MapGravity.RIGHT -> "bottomRight"
      else -> "topLeft"
    }

  private fun color(value: String): Int {
    if (!Regex("^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$").matches(value)) {
      invalid("Colors must use #RRGGBB or #RRGGBBAA.")
    }
    return if (value.length == 7) {
      Color.parseColor(value)
    } else {
      val rgba = value.drop(1).toLong(16)
      Color.argb(
        (rgba and 0xFF).toInt(),
        ((rgba shr 24) and 0xFF).toInt(),
        ((rgba shr 16) and 0xFF).toInt(),
        ((rgba shr 8) and 0xFF).toInt(),
      )
    }
  }

  private fun duration(value: Double): Int = nonnegativeInt(value, "Duration")

  private fun positiveInt(
    value: Double,
    name: String,
  ): Int {
    if (!value.isFinite() || value <= 0 || value > Int.MAX_VALUE || value % 1.0 != 0.0) {
      invalid("$name must be a positive integer.")
    }
    return value.toInt()
  }

  private fun nonnegativeInt(
    value: Double,
    name: String,
  ): Int {
    if (!value.isFinite() || value < 0 || value > Int.MAX_VALUE || value % 1.0 != 0.0) {
      invalid("$name must be a nonnegative integer.")
    }
    return value.toInt()
  }

  private fun unique(
    values: List<String>,
    name: String,
  ) {
    if (values.toSet().size != values.size) invalid("Duplicate $name ID.")
  }

  private fun nonempty(
    value: String,
    name: String,
  ) {
    if (value.isBlank()) invalid("$name must not be empty.")
  }

  private fun invalid(message: String): Nothing = throw CodedException(GUI_INVALID_ARGUMENT, message, null)
}
