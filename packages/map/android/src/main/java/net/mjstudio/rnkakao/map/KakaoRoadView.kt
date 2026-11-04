package net.mjstudio.rnkakao.map

import android.content.Context
import android.graphics.Bitmap
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.LifecycleState
import com.kakao.vectormap.KakaoMap
import com.kakao.vectormap.KakaoMapReadyCallback
import com.kakao.vectormap.LatLng
import com.kakao.vectormap.MapAuthException
import com.kakao.vectormap.MapLifeCycleCallback
import com.kakao.vectormap.MapView
import com.kakao.vectormap.RoadView
import com.kakao.vectormap.RoadViewByDate
import com.kakao.vectormap.RoadViewReadyCallback
import com.kakao.vectormap.RoadViewRequest
import com.kakao.vectormap.camera.CameraAnimation
import com.kakao.vectormap.camera.CameraUpdateFactory
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Required
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

private const val ROADVIEW_NOT_READY = "ERR_KAKAO_ROADVIEW_NOT_READY"
private const val ROADVIEW_REQUEST_CANCELLED = "ERR_KAKAO_ROADVIEW_REQUEST_CANCELLED"
private const val ROADVIEW_UNSUPPORTED = "ERR_KAKAO_MAP_UNSUPPORTED_PLATFORM_FEATURE"
private const val VIEW_DESTROYED = "ERR_KAKAO_MAP_VIEW_DESTROYED"

class RoadViewCoordinateRecord : Record {
  @Field @Required
  var latitude: Double = Double.NaN

  @Field @Required
  var longitude: Double = Double.NaN

  fun native(name: String = "Roadview coordinate"): LatLng {
    if (!latitude.isFinite() || !longitude.isFinite() || latitude !in -90.0..90.0 || longitude !in -180.0..180.0) {
      throw CodedException(INVALID_ARGUMENT, "$name must contain a valid latitude and longitude.", null)
    }
    return LatLng.from(latitude, longitude)
  }
}

class RoadViewSearchRangeRecord : Record {
  @Field @Required
  var primary: Double = Double.NaN

  @Field @Required
  var extended: Double = Double.NaN
}

class RoadViewLookAtRecord : Record {
  @Field @Required
  var type: String = ""

  @Field var coordinate: RoadViewCoordinateRecord? = null

  @Field var pan: Double? = null

  @Field var tilt: Double? = null
}

class RoadViewImageRecord : Record {
  @Field @Required
  var uri: String = ""

  @Field var width: Double? = null

  @Field var height: Double? = null

  fun resized(
    source: Bitmap,
    density: Float,
  ): Bitmap {
    if (width == null && height == null) return source
    val targetWidth = width?.positivePixelSize("image.width", density)
    val targetHeight = height?.positivePixelSize("image.height", density)
    val ratio = source.width.toDouble() / source.height.toDouble()
    val resolvedWidth = targetWidth ?: ((targetHeight ?: return source) * ratio).toInt().coerceAtLeast(1)
    val resolvedHeight = targetHeight ?: (resolvedWidth / ratio).toInt().coerceAtLeast(1)
    return Bitmap.createScaledBitmap(source, resolvedWidth, resolvedHeight, true)
  }
}

class RoadViewMarkerRecord : Record {
  @Field @Required
  var type: String = ""

  @Field var coordinate: RoadViewCoordinateRecord? = null

  @Field var directionAngle: Double? = null

  @Field var pan: Double? = null

  @Field var tilt: Double? = null

  @Field var image: RoadViewImageRecord? = null
}

class RoadViewRequestRecord : Record {
  @Field var coordinate: RoadViewCoordinateRecord? = null

  @Field var panoramaId: String? = null

  @Field var searchRange: RoadViewSearchRangeRecord? = null

  @Field var lookAt: RoadViewLookAtRecord? = null

  @Field var markers: List<RoadViewMarkerRecord>? = null

  fun validate() {
    if (coordinate == null && panoramaId.isNullOrBlank()) {
      throw CodedException(INVALID_ARGUMENT, "Roadview request requires a coordinate or panorama ID.", null)
    }
    coordinate?.native()
    if (panoramaId?.isBlank() == true) throw CodedException(INVALID_ARGUMENT, "Panorama ID must not be blank.", null)
    searchRange?.let { range ->
      if (!range.primary.isFinite() || !range.extended.isFinite() || range.primary < 0 || range.extended < range.primary ||
        range.primary > Int.MAX_VALUE || range.extended > Int.MAX_VALUE || range.primary % 1.0 != 0.0 || range.extended % 1.0 != 0.0
      ) {
        throw CodedException(INVALID_ARGUMENT, "Invalid roadview search range.", null)
      }
    }
    lookAt?.validate()
    markers.orEmpty().forEach { it.validate() }
  }
}

private fun RoadViewLookAtRecord.validate() {
  when (type) {
    "coordinate" -> {
      coordinate?.native("Roadview look-at coordinate")
        ?: throw CodedException(INVALID_ARGUMENT, "Coordinate look-at requires a coordinate.", null)
    }

    "orientation" -> {
      if (pan?.isFinite() != true || tilt?.isFinite() != true) {
        throw CodedException(INVALID_ARGUMENT, "Orientation look-at requires finite angles.", null)
      }
    }

    else -> {
      throw CodedException(INVALID_ARGUMENT, "Unsupported roadview look-at type.", null)
    }
  }
}

private fun RoadViewMarkerRecord.validate() {
  when (type) {
    "coordinate" -> {
      coordinate?.native("Roadview marker coordinate")
        ?: throw CodedException(INVALID_ARGUMENT, "Coordinate marker requires a coordinate.", null)
      if (directionAngle?.isFinite() == false) {
        throw CodedException(INVALID_ARGUMENT, "Marker direction angle must be finite.", null)
      }
    }

    "orientation" -> {
      if (pan?.isFinite() != true || tilt?.isFinite() != true) {
        throw CodedException(INVALID_ARGUMENT, "Orientation marker requires finite angles.", null)
      }
    }

    else -> {
      throw CodedException(INVALID_ARGUMENT, "Unsupported roadview marker type.", null)
    }
  }
  image?.let { source ->
    if (source.uri.isBlank()) throw CodedException(INVALID_ARGUMENT, "Marker image URI must not be blank.", null)
    source.width?.positivePixelSize("image.width", 1f)
    source.height?.positivePixelSize("image.height", 1f)
  }
}

private fun Double.positivePixelSize(
  name: String,
  density: Float,
): Int {
  val pixels = this * density
  if (!pixels.isFinite() || pixels <= 0 || pixels > Int.MAX_VALUE) {
    throw CodedException(INVALID_ARGUMENT, "$name must be positive.", null)
  }
  return pixels.toInt().coerceAtLeast(1)
}

open class KakaoRoadViewBase(
  context: Context,
  appContext: AppContext,
) : ExpoView(context, appContext),
  LifecycleEventListener {
  override val shouldUseAndroidLayout = true

  protected val onRoadViewReady by EventDispatcher()
  protected val onError by EventDispatcher()
  protected val onRoadViewResult by EventDispatcher()
  protected val onRoadViewNoResult by EventDispatcher()
  protected val onRoadViewRequestFailed by EventDispatcher()
  protected val onRoadViewUpdated by EventDispatcher()
  protected val onRoadViewResized by EventDispatcher()
  protected val onRoadViewClick by EventDispatcher()
  protected val onRoadViewFocusChanged by EventDispatcher()

  var pendingInitialRequest: RoadViewRequestRecord? = null
    set(value) {
      field = value
      dispatchInitialRequestIfReady()
    }
  var requestedVisibility = true
  var logo: MapWidgetPositionRecord? = null

  protected open val includesMap = false
  protected var nativeMap: KakaoMap? = null
  protected var roadView: RoadView? = null
  private var mapView: MapView? = null
  private var isStarted = false
  private var isDestroyed = false
  private var didEmitRoadViewReady = false
  private var didUseInitialRequest = false
  private var requestGeneration = 0
  private var lastRoadViewViewport: List<Int>? = null
  private var lastEmittedRoadViewSize: Pair<Int, Int>? = null
  private var pendingRequestPromise: Promise? = null
  private val imageLoader = MapImageLoader(appContext)
  private val imageTokens = mutableListOf<MapImageLoadToken>()
  private val reactContext = appContext.reactContext as? ReactContext

  init {
    reactContext?.addLifecycleEventListener(this)
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    startIfNeeded()
    notifyRoadViewReadyIfAttached()
    didAttachToWindow()
  }

  override fun onLayout(
    changed: Boolean,
    left: Int,
    top: Int,
    right: Int,
    bottom: Int,
  ) {
    super.onLayout(changed, left, top, right, bottom)
    startIfNeeded()
    mapView?.let { view ->
      view.measure(
        MeasureSpec.makeMeasureSpec(right - left, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(bottom - top, MeasureSpec.EXACTLY),
      )
      view.layout(0, 0, right - left, bottom - top)
    }
    layoutNativeViews(right - left, bottom - top)
  }

  override fun onDetachedFromWindow() {
    mapView?.pause()
    super.onDetachedFromWindow()
  }

  private fun startIfNeeded() {
    if (isDestroyed || !isAttachedToWindow || width == 0 || height == 0) return
    if (isStarted) {
      resume()
      return
    }
    isStarted = true
    if (KakaoMapModule.appKey == null) {
      emitError(NOT_INITIALIZED, "Call initializeKakaoMapSDK before mounting roadview.")
      return
    }
    val view = MapView(context)
    mapView = view
    addView(view, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    val lifecycle =
      object : MapLifeCycleCallback() {
        override fun onMapDestroy() {
          nativeMap = null
          roadView = null
        }

        override fun onMapError(error: Exception) {
          if (isDestroyed) return
          val code = if (error is MapAuthException) error.errorCode.toString() else error.javaClass.simpleName
          emitError(code, error.message ?: "Roadview error")
        }
      }
    val callbacks = mutableListOf<com.kakao.vectormap.MapReadyCallback>()
    if (includesMap) callbacks += mapCallback()
    callbacks += roadViewCallback()
    view.start(lifecycle, *callbacks.toTypedArray())
    view.setFinishManually(true)
    resume()
  }

  private fun mapCallback() =
    object : KakaoMapReadyCallback() {
      override fun getPosition() = LatLng.from(37.402001, 127.108678)

      override fun getZoomLevel() = 15

      override fun getViewName() = "roadview-map"

      override fun onMapReady(map: KakaoMap) {
        if (isDestroyed) return
        nativeMap = map
        mapDidBecomeReady(map)
        layoutNativeViews(width, height)
      }
    }

  private fun roadViewCallback() =
    object : RoadViewReadyCallback() {
      override fun getViewName() = "roadview"

      override fun onRoadViewReady(readyRoadView: RoadView) {
        if (isDestroyed) return
        roadView = readyRoadView
        installListeners(readyRoadView)
        applyProperties()
        layoutNativeViews(width, height)
        notifyRoadViewReadyIfAttached()
      }
    }

  protected open fun mapDidBecomeReady(map: KakaoMap) = Unit

  protected open fun roadViewDidBecomeReady(roadView: RoadView) = Unit

  protected open fun didAttachToWindow() = Unit

  protected open fun layoutNativeViews(
    width: Int,
    height: Int,
  ) {
    setRoadViewViewport(0, 0, width, height)
  }

  protected fun setRoadViewViewport(
    x: Int,
    y: Int,
    width: Int,
    height: Int,
  ) {
    val road = roadView ?: return
    val viewport = listOf(x, y, width, height)
    if (lastRoadViewViewport == viewport) return
    lastRoadViewViewport = viewport
    road.setViewport(x, y, width, height)
  }

  fun applyProperties() {
    roadView?.setVisible(requestedVisibility)
    logo?.let { position ->
      position.validate("Roadview logo position")
      roadView?.logo?.setPosition(
        position.nativeGravity(),
        (position.x * resources.displayMetrics.density).toFloat(),
        (position.y * resources.displayMetrics.density).toFloat(),
      )
    }
  }

  fun requestRoadView(
    request: RoadViewRequestRecord,
    promise: Promise?,
    completion: ((Pair<String, String>?) -> Unit)? = null,
  ) {
    val readyRoadView =
      try {
        requireRoadView()
      } catch (error: CodedException) {
        promise?.reject(error)
        completion?.invoke(error.code to (error.message ?: "Roadview is unavailable."))
        return
      }
    try {
      request.validate()
    } catch (error: CodedException) {
      promise?.reject(error)
      completion?.invoke(error.code to (error.message ?: "Invalid roadview request."))
      return
    }
    val generation = beginImageRequest(promise)
    loadMarkerImages(request.markers.orEmpty(), generation) { result ->
      if (isDestroyed || generation != requestGeneration) return@loadMarkerImages
      result.fold(
        onSuccess = { images ->
          try {
            readyRoadView.requestRoadView(request.native(images, resources.displayMetrics.density))
            finishRequest(generation, promise, null)
            completion?.invoke(null)
          } catch (error: CodedException) {
            finishRequest(generation, promise, error)
            completion?.invoke(error.code to (error.message ?: "Invalid roadview request."))
          }
        },
        onFailure = { error ->
          val coded = error as? CodedException ?: CodedException("ERR_KAKAO_MAP_IMAGE_LOAD", error.message, error)
          finishRequest(generation, promise, coded)
          completion?.invoke(coded.code to (coded.message ?: "Could not load roadview marker image."))
        },
      )
    }
  }

  private fun notifyRoadViewReadyIfAttached() {
    val readyRoadView = roadView ?: return
    if (isDestroyed || !isAttachedToWindow || didEmitRoadViewReady) return
    didEmitRoadViewReady = true
    roadViewDidBecomeReady(readyRoadView)
    onRoadViewReady(emptyMap<String, Any>())
    dispatchInitialRequestIfReady()
  }

  private fun dispatchInitialRequestIfReady() {
    val request = pendingInitialRequest ?: return
    if (!didEmitRoadViewReady || didUseInitialRequest) return
    didUseInitialRequest = true
    requestRoadView(request, null) { error -> error?.let(::emitError) }
  }

  fun requestNext(
    request: RoadViewRequestRecord,
    promise: Promise,
  ) {
    val readyRoadView =
      try {
        requireRoadView()
      } catch (error: CodedException) {
        promise.reject(error)
        return
      }
    try {
      request.validate()
    } catch (error: CodedException) {
      promise.reject(error)
      return
    }
    val generation = beginImageRequest(promise)
    loadMarkerImages(request.markers.orEmpty(), generation) { result ->
      if (isDestroyed || generation != requestGeneration) return@loadMarkerImages
      result.fold(
        onSuccess = { images ->
          try {
            readyRoadView.requestNextRoadView(request.native(images, resources.displayMetrics.density))
            finishRequest(generation, promise, null)
          } catch (error: CodedException) {
            finishRequest(generation, promise, error)
          }
        },
        onFailure = { error -> finishRequest(generation, promise, error) },
      )
    }
  }

  fun moveToCapture(index: Int) {
    if (index < 0) throw CodedException(INVALID_ARGUMENT, "Capture index must be non-negative.", null)
    requireRoadView().moveToRoadView(index)
  }

  fun getInfo() =
    requireRoadView().let { view ->
      mapOf(
        "pan" to Math.toDegrees(view.panAngle),
        "tilt" to Math.toDegrees(view.tiltAngle),
        "capabilities" to
          mapOf(
            "coordinateDirectionMarkers" to true,
            "customSearchRange" to true,
            "datedCaptures" to true,
            "focusEvents" to false,
            "nextRequest" to true,
            "noResultEvents" to false,
            "mapLink" to includesMap,
            "refresh" to false,
          ),
      )
    }

  fun refresh(): Unit = throw CodedException(ROADVIEW_UNSUPPORTED, "Refreshing roadview is available on iOS only.", null)

  open fun linkMap(linkId: String): Unit =
    throw CodedException(
      ROADVIEW_UNSUPPORTED,
      "Use KakaoMapRoadView to link a map and roadview in one SDK engine.",
      null,
    )

  open fun unlinkMap(): Unit =
    throw CodedException(
      ROADVIEW_UNSUPPORTED,
      "Use KakaoMapRoadView to link a map and roadview in one SDK engine.",
      null,
    )

  private fun installListeners(view: RoadView) {
    view.setOnRoadViewRequestListener(
      object : RoadView.OnRoadViewRequestListener {
        override fun onRoadViewResultReceived(
          panoramaId: String,
          position: LatLng,
          captures: List<RoadViewByDate>,
        ) {
          if (isDestroyed) return
          onRoadViewResult(
            mapOf(
              "panoramaId" to panoramaId,
              "coordinate" to mapOf("latitude" to position.latitude, "longitude" to position.longitude),
              "captures" to
                captures.map { capture ->
                  mapOf("index" to capture.index, "date" to capture.date, "address" to capture.address)
                },
            ),
          )
        }

        override fun onRoadViewRequestFailed(message: String) {
          if (!isDestroyed) {
            onRoadViewRequestFailed(
              mapOf("code" to "ERR_KAKAO_ROADVIEW_REQUEST_FAILED", "message" to message),
            )
          }
        }
      },
    )
    view.setOnRoadViewUpdateListener { updated ->
      if (!isDestroyed) onRoadViewUpdated(mapOf("pan" to Math.toDegrees(updated.panAngle), "tilt" to Math.toDegrees(updated.tiltAngle)))
    }
    view.setOnRoadViewClickListener { _, point ->
      if (!isDestroyed) {
        val density = resources.displayMetrics.density
        onRoadViewClick(mapOf("x" to point.x / density, "y" to point.y / density))
      }
    }
    view.setOnRoadViewResizeListener { _, viewport ->
      if (!isDestroyed) {
        val size = viewport.width() to viewport.height()
        if (lastEmittedRoadViewSize == size) return@setOnRoadViewResizeListener
        lastEmittedRoadViewSize = size
        val density = resources.displayMetrics.density
        onRoadViewResized(mapOf("width" to viewport.width() / density, "height" to viewport.height() / density))
      }
    }
  }

  private fun RoadViewRequestRecord.native(
    images: List<Bitmap?>,
    density: Float,
  ): RoadViewRequest {
    val native = coordinate?.let { RoadViewRequest(it.native()) } ?: RoadViewRequest(requireNotNull(panoramaId))
    panoramaId?.let(native::setPanoramaId)
    coordinate?.let { native.setPanoramaCoord(it.native()) }
    searchRange?.let { native.setSearchRange(it.primary.toInt(), it.extended.toInt()) }
    lookAt?.let { lookAt ->
      when (lookAt.type) {
        "coordinate" -> {
          native.setLookAtPosition(requireNotNull(lookAt.coordinate).native())
        }

        "orientation" -> {
          native.setLookAtPosition(
            Math.toRadians(requireNotNull(lookAt.pan)),
            Math.toRadians(requireNotNull(lookAt.tilt)),
          )
        }

        else -> {
          throw CodedException(INVALID_ARGUMENT, "Unsupported roadview look-at type.", null)
        }
      }
    }
    markers.orEmpty().forEachIndexed { index, marker -> marker.addTo(native, images[index], density) }
    return native
  }

  private fun RoadViewMarkerRecord.addTo(
    request: RoadViewRequest,
    image: Bitmap?,
    density: Float,
  ) {
    val sizedImage = image?.let { source -> this.image?.resized(source, density) ?: source }
    when (type) {
      "coordinate" -> {
        val point = requireNotNull(coordinate).native()
        val direction = directionAngle?.let(Math::toRadians)
        when {
          sizedImage != null && direction != null -> request.addMarker(sizedImage, point, direction)
          sizedImage != null -> request.addMarker(sizedImage, point)
          direction != null -> request.addMarker(point, direction)
          else -> request.addMarker(point)
        }
      }

      "orientation" -> {
        val nativePan = Math.toRadians(requireNotNull(pan))
        val nativeTilt = Math.toRadians(requireNotNull(tilt))
        if (sizedImage != null) {
          request.addMarker(sizedImage, nativePan, nativeTilt)
        } else {
          request.addMarker(nativePan, nativeTilt)
        }
      }

      else -> {
        throw CodedException(INVALID_ARGUMENT, "Unsupported roadview marker type.", null)
      }
    }
  }

  private fun loadMarkerImages(
    markers: List<RoadViewMarkerRecord>,
    generation: Int,
    completion: (Result<List<Bitmap?>>) -> Unit,
  ) {
    if (markers.isEmpty()) {
      completion(Result.success(emptyList()))
      return
    }
    val images = MutableList<Bitmap?>(markers.size) { null }
    var remaining = markers.size
    var failed = false
    markers.forEachIndexed { index, marker ->
      val uri = marker.image?.uri
      if (uri == null) {
        remaining -= 1
        if (remaining == 0) completion(Result.success(images))
      } else {
        imageTokens +=
          imageLoader.load(uri) { result ->
            if (failed || generation != requestGeneration) return@load
            result.fold(
              onSuccess = { image ->
                images[index] = image
                remaining -= 1
                if (remaining == 0) completion(Result.success(images))
              },
              onFailure = { error ->
                failed = true
                imageTokens.toList().forEach(MapImageLoadToken::cancel)
                imageTokens.clear()
                completion(Result.failure(error))
              },
            )
          }
      }
    }
  }

  private fun requireRoadView(): RoadView {
    if (isDestroyed) throw CodedException(VIEW_DESTROYED, "The roadview was destroyed.", null)
    return roadView
      ?: throw CodedException(ROADVIEW_NOT_READY, "Wait for onRoadViewReady before calling roadview methods.", null)
  }

  private fun beginImageRequest(promise: Promise? = null): Int {
    pendingRequestPromise?.reject(
      CodedException(ROADVIEW_REQUEST_CANCELLED, "The roadview request was replaced by a newer request.", null),
    )
    pendingRequestPromise = promise
    requestGeneration += 1
    imageTokens.toList().forEach(MapImageLoadToken::cancel)
    imageTokens.clear()
    return requestGeneration
  }

  private fun finishRequest(
    generation: Int,
    promise: Promise?,
    error: Throwable?,
  ) {
    if (generation != requestGeneration) return
    if (pendingRequestPromise === promise) pendingRequestPromise = null
    imageTokens.clear()
    if (error == null) {
      promise?.resolve(null)
    } else {
      promise?.reject(
        error as? CodedException
          ?: CodedException("ERR_KAKAO_ROADVIEW", error.message ?: "Roadview request failed.", error),
      )
    }
  }

  private fun emitError(error: Pair<String, String>) = emitError(error.first, error.second)

  private fun emitError(
    code: String,
    message: String,
  ) {
    if (!isDestroyed) onError(mapOf("code" to code, "message" to message))
  }

  private fun resume() {
    if (!isDestroyed && isAttachedToWindow && reactContext?.lifecycleState == LifecycleState.RESUMED) mapView?.resume()
  }

  override fun onHostResume() = resume()

  override fun onHostPause() = mapView?.pause() ?: Unit

  override fun onHostDestroy() = destroy()

  fun destroy() {
    if (isDestroyed) return
    isDestroyed = true
    beginImageRequest()
    imageLoader.dispose()
    reactContext?.removeLifecycleEventListener(this)
    roadView?.setOnRoadViewRequestListener(null)
    roadView?.setOnRoadViewUpdateListener(null)
    roadView?.setOnRoadViewClickListener(null)
    roadView?.setOnRoadViewResizeListener(null)
    roadView?.unlinkMap()
    roadView = null
    nativeMap = null
    val view = mapView
    mapView = null
    view?.finish()
    view?.let(::removeView)
  }
}

class KakaoRoadView(
  context: Context,
  appContext: AppContext,
) : KakaoRoadViewBase(context, appContext)

class KakaoMapRoadView(
  context: Context,
  appContext: AppContext,
) : KakaoRoadViewBase(context, appContext) {
  private val onMapReady by EventDispatcher()
  var layout = "vertical"
  var mapFraction = 0.5
  var shouldLink = true
  var initialCamera: CameraOptions? = null
  private var isMapCreated = false
  private var isMapReady = false
  private var lastMapViewport: List<Int>? = null

  override val includesMap = true

  override fun mapDidBecomeReady(map: KakaoMap) {
    initialCamera?.let { camera ->
      map.moveCamera(CameraUpdateFactory.newCameraPosition(camera.position(map.minZoomLevel, map.maxZoomLevel)))
    }
    isMapCreated = true
    notifyMapReadyIfAttached()
  }

  override fun roadViewDidBecomeReady(roadView: RoadView) = applyLinkState()

  override fun didAttachToWindow() = notifyMapReadyIfAttached()

  override fun layoutNativeViews(
    width: Int,
    height: Int,
  ) {
    val fraction = mapFraction
    if (layout == "horizontal") {
      val mapWidth = (width * fraction).toInt()
      setMapViewport(0, 0, mapWidth, height)
      setRoadViewViewport(mapWidth, 0, width - mapWidth, height)
    } else {
      val mapHeight = (height * fraction).toInt()
      setMapViewport(0, 0, width, mapHeight)
      setRoadViewViewport(0, mapHeight, width, height - mapHeight)
    }
  }

  private fun setMapViewport(
    x: Int,
    y: Int,
    width: Int,
    height: Int,
  ) {
    val map = nativeMap ?: return
    val viewport = listOf(x, y, width, height)
    if (lastMapViewport == viewport) return
    lastMapViewport = viewport
    map.setViewport(x, y, width, height)
  }

  fun validateLayout() {
    if (layout !in setOf("horizontal", "vertical") || !mapFraction.isFinite() || mapFraction <= 0 || mapFraction >= 1) {
      throw CodedException(INVALID_ARGUMENT, "Invalid linked map/roadview layout.", null)
    }
    layoutNativeViews(width, height)
  }

  fun setLinked(linked: Boolean) {
    shouldLink = linked
    requireLinkedViews()
    applyLinkState()
  }

  override fun linkMap(linkId: String) {
    if (linkId !in setOf("map", "roadview-map")) {
      throw CodedException(INVALID_ARGUMENT, "The linked host exposes only its owned map.", null)
    }
    setLinked(true)
  }

  override fun unlinkMap() = setLinked(false)

  fun moveMapCamera(
    camera: CameraOptions,
    duration: Double,
  ) {
    if (!duration.isFinite() || duration < 0 || duration > Int.MAX_VALUE || duration % 1.0 != 0.0) {
      throw CodedException(INVALID_ARGUMENT, "Invalid camera duration.", null)
    }
    val map = requireMap()
    val update = CameraUpdateFactory.newCameraPosition(camera.position(map.minZoomLevel, map.maxZoomLevel))
    if (duration == 0.0) map.moveCamera(update) else map.moveCamera(update, CameraAnimation.from(duration.toInt(), false, false))
  }

  fun getMapCamera() =
    requireMap().cameraPosition?.toPayload()
      ?: throw CodedException(NOT_READY, "The map camera is unavailable.", null)

  private fun applyLinkState() {
    val map = nativeMap ?: return
    val road = roadView ?: return
    if (shouldLink) road.linkMap(map) else road.unlinkMap()
  }

  private fun notifyMapReadyIfAttached() {
    if (!isMapCreated || isMapReady || !isAttachedToWindow || nativeMap == null) return
    isMapReady = true
    onMapReady(emptyMap<String, Any>())
    applyLinkState()
  }

  private fun requireLinkedViews() {
    requireMap()
    if (roadView == null) throw CodedException(ROADVIEW_NOT_READY, "Wait for onRoadViewReady before changing linkage.", null)
  }

  private fun requireMap() =
    nativeMap?.takeIf { isMapReady }
      ?: throw CodedException(NOT_READY, "Wait for onMapReady before calling map methods.", null)
}
