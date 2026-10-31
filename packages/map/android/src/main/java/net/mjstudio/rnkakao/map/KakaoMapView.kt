package net.mjstudio.rnkakao.map

import android.content.Context
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.LifecycleState
import com.kakao.vectormap.GestureType
import com.kakao.vectormap.KakaoMap
import com.kakao.vectormap.KakaoMapReadyCallback
import com.kakao.vectormap.LatLng
import com.kakao.vectormap.MapAuthException
import com.kakao.vectormap.MapLifeCycleCallback
import com.kakao.vectormap.MapView
import com.kakao.vectormap.MapViewInfo
import com.kakao.vectormap.camera.CameraAnimation
import com.kakao.vectormap.camera.CameraPosition
import com.kakao.vectormap.camera.CameraUpdate
import com.kakao.vectormap.camera.CameraUpdateFactory
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.lang.ref.WeakReference

private const val CAMERA_REQUEST_TIMEOUT_MILLIS = 3_000L
private const val CAMERA_TIMEOUT = "ERR_KAKAO_MAP_CAMERA_TIMEOUT"
private const val CAMERA_SUPERSEDED = "ERR_KAKAO_MAP_CAMERA_SUPERSEDED"
private const val SHAPE_INVALID_ARGUMENT = "ERR_KAKAO_MAP_SHAPE_INVALID_ARGUMENT"
private const val ROUTE_INVALID_ARGUMENT = "ERR_KAKAO_MAP_ROUTE_INVALID_ARGUMENT"
private const val VIEW_DESTROYED = "ERR_KAKAO_MAP_VIEW_DESTROYED"
private const val VIEW_DESTROYED_MESSAGE = "The map view was destroyed."

class KakaoMapView(
  context: Context,
  appContext: AppContext,
) : ExpoView(context, appContext),
  LifecycleEventListener {
  override val shouldUseAndroidLayout = true

  private val onMapReady by EventDispatcher()
  private val onError by EventDispatcher()
  private val onCameraMoveStart by EventDispatcher()
  private val onCameraIdle by EventDispatcher()
  private val onMapClick by EventDispatcher()
  private val onMapLongClick by EventDispatcher()
  private val onTerrainClick by EventDispatcher()
  private val onViewportClick by EventDispatcher()
  private val onVisibilityChanged by EventDispatcher()
  private val onFocusChanged by EventDispatcher()
  private val onPoiClick by EventDispatcher()
  private val onCompassClick by EventDispatcher()
  private val onMapTypeChanged by EventDispatcher()
  private val onPaddingChanged by EventDispatcher()
  private val onViewportChanged by EventDispatcher()
  private val onLabelClick by EventDispatcher()
  private val onLabelAnimationStopped by EventDispatcher()
  private val onLabelsChanged by EventDispatcher()
  private val onShapeAnimationStop by EventDispatcher()
  private val onShapesChanged by EventDispatcher()
  private val onRoutesChanged by EventDispatcher()
  private val onRouteProgress by EventDispatcher()
  private val onRouteAnimationStop by EventDispatcher()
  private val onGuiEvent by EventDispatcher()
  private var labels: MapLabels? = null
  private var shapes: MapShapes? = null
  private var routes: MapRoutes? = null
  private var gui: MapGui? = null
  private var cameraCommands: MapCameraCommands? = null
  private var imageLoader: MapImageLoader? = null
  private var pendingLabels: MapLabelSceneRecord? = null
  private var pendingShapes: Map<String, Any?>? = null
  private var pendingRoutes: Map<String, Any?>? = null
  private var hasUsedRoutes = false
  private var routeGeneration = 0L
  private var labelGeneration = 0L
  private var mapView: MapView? = null
  private var map: KakaoMap? = null
  private var isDestroyed = false
  private var isStarted = false
  private var hasInitialProps = false
  private var initialCamera: CameraOptions? = null
  private var lastCameraValues: List<Double>? = null
  private var queuedOptions: MapOptionsRecord? = null
  private val appliedOptions = MapOptionsRecord()
  private val activeOverlays = mutableSetOf<String>()
  private val activeCustomOverlays = mutableSetOf<String>()
  private val mainHandler = Handler(Looper.getMainLooper())
  private val pendingCameraRequests = mutableMapOf<Any, PendingCameraRequest>()
  private val pendingCameraDispatches = mutableMapOf<Any, PendingCameraRequest>()
  private var cameraCommandGeneration = 0L
  private val reactContext = appContext.reactContext as? ReactContext
  var pendingInitialCamera: CameraOptions? = null
  var camera: CameraOptions? = null
  var pendingOptions: MapOptionsRecord? = null

  init {
    reactContext?.addLifecycleEventListener(this)
  }

  fun updateProps() {
    if (!hasInitialProps) {
      hasInitialProps = true
      initialCamera = pendingInitialCamera
    }
    if (map != null) {
      val values = camera?.values()
      if (values != lastCameraValues) {
        camera?.let { applyCameraProp(it) }
        lastCameraValues = values
      }
    }
    pendingOptions?.let { options ->
      if (options.mapType != null && options.viewInfo != null) {
        reportError(CodedException(INVALID_ARGUMENT, "Map type and view info are mutually exclusive.", null))
      } else if (map == null) {
        queuedOptions = mergeMapOptions(queuedOptions, options)
      } else {
        applyOptionsSafely(options)
      }
      pendingOptions = null
    }
    applyPendingShapesIfReady()
    applyPendingRoutesIfReady()
    applyPendingLabelsIfReady()
  }

  fun queueLabels(scene: MapLabelSceneRecord?) {
    if (scene == null && labels == null) {
      pendingLabels = null
      return
    }
    pendingLabels = scene ?: MapLabelSceneRecord()
  }

  fun queueShapes(scene: Map<String, Any?>?) {
    if (scene == null && shapes == null) {
      pendingShapes = null
      return
    }
    try {
      pendingShapes = normalizeShapeObject(scene ?: emptyMap<String, Any?>(), "shapes")
    } catch (error: Exception) {
      pendingShapes = null
      if (!isDestroyed) reportError(error)
    }
  }

  fun queueRoutes(scene: Map<String, Any?>?) {
    if (scene == null && !hasUsedRoutes) return
    hasUsedRoutes = true
    try {
      pendingRoutes = normalizeShapeObject(scene ?: emptyMap<String, Any?>(), "routes", ROUTE_INVALID_ARGUMENT)
    } catch (error: Exception) {
      pendingRoutes = null
      if (!isDestroyed) reportError(error)
    }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    startIfNeeded()
  }

  private fun startIfNeeded() {
    if (isDestroyed || !isAttachedToWindow || width == 0 || height == 0) return
    if (isStarted) {
      resume()
      return
    }
    isStarted = true
    if (KakaoMapModule.appKey == null) {
      onError(mapOf("code" to NOT_INITIALIZED, "message" to "Call initializeKakaoMapSDK before mounting the map."))
      return
    }
    val view = MapView(context)
    mapView = view
    addView(view, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    view.start(
      object : MapLifeCycleCallback() {
        override fun onMapDestroy() {
          releaseMapObjects()
          map = null
          rejectPendingCameraRequests(NOT_READY, "The map was destroyed before returning its camera position.")
          rejectPendingCameraDispatches(NOT_READY, "The map was destroyed before dispatching the camera update.")
        }

        override fun onMapError(error: Exception) {
          if (isDestroyed) return
          releaseMapObjects()
          map = null
          val code = if (error is MapAuthException) error.errorCode.toString() else error.javaClass.simpleName
          val message = error.message ?: "Map error"
          rejectPendingCameraRequests(code, message)
          rejectPendingCameraDispatches(code, message)
          onError(
            mapOf(
              "code" to code,
              "message" to message,
            ),
          )
        }
      },
      object : KakaoMapReadyCallback() {
        override fun onMapReady(readyMap: KakaoMap) {
          if (isDestroyed) return
          map = readyMap
          readyMap.setOnCameraMoveStartListener { _, gesture ->
            if (!isDestroyed) onCameraMoveStart(mapOf("reason" to reason(gesture)))
          }
          readyMap.setOnCameraMoveEndListener { _, position, gesture ->
            if (!isDestroyed) onCameraIdle(mapOf("reason" to reason(gesture), "camera" to position.toPayload()))
          }
          readyMap.setOnMapClickListener { _, position, point, _ ->
            if (!isDestroyed) {
              onMapClick(
                mapOf(
                  "latitude" to position.latitude,
                  "longitude" to position.longitude,
                  "x" to point.x / resources.displayMetrics.density,
                  "y" to point.y / resources.displayMetrics.density,
                ),
              )
            }
          }
          readyMap.setOnTerrainClickListener { _, position, _ ->
            if (!isDestroyed) onTerrainClick(mapOf("latitude" to position.latitude, "longitude" to position.longitude))
          }
          readyMap.setOnViewportClickListener { _, position, point ->
            if (!isDestroyed) {
              val density = resources.displayMetrics.density
              onViewportClick(
                mapOf(
                  "latitude" to position.latitude,
                  "longitude" to position.longitude,
                  "x" to point.x / density,
                  "y" to point.y / density,
                ),
              )
            }
          }
          readyMap.setOnVisibleChangeListener { _, visible ->
            if (!isDestroyed) onVisibilityChanged(mapOf("visible" to visible))
          }
          readyMap.setOnTerrainLongClickListener { _, position, _ ->
            if (!isDestroyed) {
              onMapLongClick(mapOf("latitude" to position.latitude, "longitude" to position.longitude))
            }
          }
          readyMap.setOnPoiClickListener { _, position, layerId, id ->
            if (!isDestroyed) {
              onPoiClick(
                mapOf(
                  "latitude" to position.latitude,
                  "longitude" to position.longitude,
                  "id" to id,
                  "layerId" to layerId,
                ),
              )
            }
          }
          readyMap.setOnCompassClickListener { _, _ ->
            if (!isDestroyed) onCompassClick(emptyMap<String, Any>())
          }
          readyMap.setOnMapViewInfoChangeListener(
            object : KakaoMap.OnMapViewInfoChangeListener {
              override fun onMapViewInfoChanged(mapViewInfo: MapViewInfo) {
                if (!isDestroyed) onMapTypeChanged(mapOf("viewInfoName" to mapViewInfo.mapType))
              }

              override fun onMapViewInfoChangeFailed() {
                if (!isDestroyed) {
                  onError(
                    mapOf(
                      "code" to "ERR_KAKAO_MAP_VIEW_INFO_CHANGE_FAILED",
                      "message" to "Kakao Maps could not change the map view information.",
                    ),
                  )
                }
              }
            },
          )
          readyMap.setOnPaddingChangeListener { changedMap ->
            if (!isDestroyed) {
              val density = resources.displayMetrics.density
              val padding = changedMap.padding
              onPaddingChanged(
                mapOf(
                  "top" to padding.top / density,
                  "right" to padding.right / density,
                  "bottom" to padding.bottom / density,
                  "left" to padding.left / density,
                ),
              )
            }
          }
          readyMap.setOnViewportChangeListener { _, viewport ->
            if (!isDestroyed) {
              val density = resources.displayMetrics.density
              onViewportChanged(
                mapOf(
                  "width" to viewport.width() / density,
                  "height" to viewport.height() / density,
                  "x" to viewport.left / density,
                  "y" to viewport.top / density,
                ),
              )
            }
          }
          queuedOptions?.let(::applyOptionsSafely)
          queuedOptions = null
          (camera ?: initialCamera)?.let { applyCameraProp(it) }
          lastCameraValues = camera?.values()
          applyPendingShapesIfReady()
          applyPendingRoutesIfReady()
          applyPendingLabelsIfReady()
          onMapReady(emptyMap<String, Any>())
          if (!isAttachedToWindow || reactContext?.lifecycleState != LifecycleState.RESUMED) view.pause()
        }
      },
    )
    view.setFinishManually(true)
    if (reactContext?.lifecycleState == LifecycleState.RESUMED && isAttachedToWindow) {
      view.resume()
    } else {
      view.pause()
    }
  }

  fun moveCamera(
    camera: CameraOptions,
    duration: Double,
  ) {
    val map = requireMap()
    val durationMillis = validateDuration(duration)
    val update = CameraUpdateFactory.newCameraPosition(camera.position(map.cameraMinLevel, map.cameraMaxLevel))
    beginCameraCommand()
    dispatchCameraUpdate(map, update, durationMillis)
  }

  fun updateCamera(
    update: CameraUpdateRecord,
    duration: Double,
    promise: Promise,
  ) {
    try {
      val map = requireMap()
      val durationMillis = validateDuration(duration)
      if (update.type == "orientation") {
        updateOrientation(map, update, durationMillis, promise)
        return
      }
      val cameraUpdate =
        when (update.type) {
          "position" -> {
            val position = update.position ?: throw invalidCameraUpdate("position")
            position.validate("Camera position")
            requireOnlyCameraFields(update, "position")
            CameraUpdateFactory.newCenterPosition(LatLng.from(position.latitude, position.longitude))
          }

          "zoom" -> {
            val zoomLevel = update.zoomLevel ?: throw invalidCameraUpdate("zoomLevel")
            if (!zoomLevel.isFinite() || zoomLevel % 1.0 != 0.0 || zoomLevel < map.cameraMinLevel || zoomLevel > map.cameraMaxLevel) {
              throw CodedException(INVALID_ARGUMENT, "Camera zoom level is outside the configured zoom range.", null)
            }
            requireOnlyCameraFields(update, "zoom")
            CameraUpdateFactory.zoomTo(zoomLevel.toInt())
          }

          "fit" -> {
            val coordinates = update.coordinates ?: throw invalidCameraUpdate("coordinates")
            if (coordinates.isEmpty()) {
              throw CodedException(INVALID_ARGUMENT, "Camera fit requires at least one coordinate.", null)
            }
            coordinates.forEachIndexed { index, coordinate -> coordinate.validate("Camera fit coordinate $index") }
            requireOnlyCameraFields(update, "fit")
            CameraUpdateFactory.fitMapPoints(
              coordinates.map { LatLng.from(it.latitude, it.longitude) }.toTypedArray(),
            )
          }

          else -> {
            throw CodedException(INVALID_ARGUMENT, "Unsupported camera update type: ${update.type}.", null)
          }
        }
      beginCameraCommand()
      dispatchCameraUpdate(map, cameraUpdate, durationMillis)
      promise.resolve(null)
    } catch (error: CodedException) {
      promise.reject(error)
    } catch (error: Exception) {
      promise.reject(error.javaClass.simpleName, error.message ?: "Camera update failed.", error)
    }
  }

  fun getMapInfo(): Map<String, Any> {
    val map = requireMap()
    val density = resources.displayMetrics.density
    val padding = map.padding
    val viewport = map.viewport
    val mapViewInfo =
      map.mapViewInfo
        ?: throw CodedException("ERR_KAKAO_MAP_VIEW_INFO_UNAVAILABLE", "Kakao Maps did not return map view information.", null)
    return mapOf(
      "mapType" to mapTypePayload(mapViewInfo.mapType),
      "viewInfoName" to mapViewInfo.mapType,
      "zoomRange" to mapOf("min" to map.cameraMinLevel, "max" to map.cameraMaxLevel),
      "padding" to
        mapOf(
          "top" to padding.top / density,
          "right" to padding.right / density,
          "bottom" to padding.bottom / density,
          "left" to padding.left / density,
        ),
      "size" to mapOf("width" to viewport.width() / density, "height" to viewport.height() / density),
      "viewport" to
        mapOf(
          "x" to viewport.left / density,
          "y" to viewport.top / density,
          "width" to viewport.width() / density,
          "height" to viewport.height() / density,
        ),
      "language" to (map.poiLanguage ?: ""),
      "supportedLanguages" to (map.supportedLanguages?.toList() ?: emptyList<String>()),
      "capabilities" to mapOf("coordinateToScreen" to true),
    )
  }

  fun screenToCoordinate(point: ScreenPointRecord): Map<String, Double> {
    val map = requireMap()
    point.validate()
    validatePixelValue(point.x)
    validatePixelValue(point.y)
    val density = resources.displayMetrics.density
    val x = (point.x * density).toInt()
    val y = (point.y * density).toInt()
    if (!map.viewport.contains(x, y)) {
      throw CodedException(INVALID_ARGUMENT, "Screen point must be inside the map viewport.", null)
    }
    val coordinate =
      map.fromScreenPoint(x, y)
        ?: throw CodedException("ERR_KAKAO_MAP_PROJECTION_FAILED", "The screen point could not be projected to a coordinate.", null)
    return mapOf("latitude" to coordinate.latitude, "longitude" to coordinate.longitude)
  }

  fun coordinateToScreen(coordinate: CoordinateRecord): Map<String, Double> {
    val map = requireMap()
    coordinate.validate()
    val density = resources.displayMetrics.density
    val point =
      map.toScreenPoint(LatLng.from(coordinate.latitude, coordinate.longitude))
        ?: throw CodedException("ERR_KAKAO_MAP_PROJECTION_FAILED", "The coordinate could not be projected to a screen point.", null)
    return mapOf("x" to point.x / density.toDouble(), "y" to point.y / density.toDouble())
  }

  fun clearCache() {
    requireMap().clearAllCache()
  }

  fun executeCameraCommand(
    command: Map<String, Any?>,
    promise: Promise,
  ) {
    if (command["type"] == "getState") {
      getCamera(promise, isAdvancedState = true)
      return
    }
    val result = requireCameraCommands().command(command)
    if (result["type"] == "dispatched") beginCameraCommand()
    promise.resolve(result)
  }

  private fun requireCameraCommands(): MapCameraCommands {
    val readyMap = requireMap()
    return cameraCommands ?: MapCameraCommands(readyMap, resources.displayMetrics.density).also { cameraCommands = it }
  }

  fun runLabelCommand(command: MapLabelCommandRecord) {
    requireLabels().command(command)
  }

  fun getLabelCapabilities() = requireLabels().capabilities()

  fun getLabelState() = requireLabels().state()

  fun applyShapes(scene: Map<String, Any?>): Map<String, Any> {
    pendingShapes = null
    val counts = requireShapes().apply(normalizeShapeObject(scene, "scene"))
    if (!isDestroyed) onShapesChanged(counts)
    return counts
  }

  fun executeShapeCommand(command: Map<String, Any?>): Map<String, Any?> = requireShapes().command(normalizeShapeObject(command, "command"))

  private fun requireShapes(): MapShapes {
    val readyMap = requireMap()
    shapes?.let { return it }
    val viewReference = WeakReference(this)
    lateinit var manager: MapShapes
    manager =
      MapShapes(readyMap, resources.displayMetrics.density) { event, payload ->
        viewReference.get()?.let { view ->
          if (!view.isDestroyed && view.shapes === manager && event == "onShapeAnimationStop") {
            (payload["animationId"] as? String)?.let { animationId ->
              view.onShapeAnimationStop(mapOf("animationId" to animationId))
            }
          }
        }
      }
    shapes = manager
    return manager
  }

  private fun requireLabels(): MapLabels {
    val readyMap = requireMap()
    labels?.let { return it }
    val loader = requireImageLoader()
    val viewReference = WeakReference(this)
    val manager =
      MapLabels(
        readyMap,
        loader,
        emitClick = { event ->
          viewReference.get()?.let { view -> if (!view.isDestroyed) view.onLabelClick(event) }
        },
        emitAnimationStopped = { event ->
          viewReference.get()?.let { view -> if (!view.isDestroyed) view.onLabelAnimationStopped(event) }
        },
        resolvePolygon = { id -> viewReference.get()?.shapes?.resolvePolygon(id) },
        density = resources.displayMetrics.density,
      )
    labels = manager
    readyMap.setOnLabelClickListener { _, _, label ->
      viewReference.get()?.labels?.handleLabelClick(label)
      true
    }
    readyMap.setOnLodLabelClickListener { _, _, label ->
      viewReference.get()?.labels?.handleLodLabelClick(label)
      true
    }
    return manager
  }

  fun applyRoutes(
    scene: Map<String, Any?>,
    promise: Promise,
  ) {
    pendingRoutes = null
    hasUsedRoutes = true
    val generation = ++routeGeneration
    val viewReference = WeakReference(this)
    requireRoutes().apply(normalizeShapeObject(scene, "scene", ROUTE_INVALID_ARGUMENT)) { result ->
      result.fold(
        onSuccess = { counts ->
          viewReference.get()?.let { view ->
            if (!view.isDestroyed && generation == view.routeGeneration) view.onRoutesChanged(counts)
          }
          promise.resolve(counts)
        },
        onFailure = { error ->
          if (error is CodedException) {
            promise.reject(error)
          } else {
            promise.reject("ERR_KAKAO_MAP_ROUTE", error.message, error)
          }
        },
      )
    }
  }

  fun executeRouteCommand(command: Map<String, Any?>): Map<String, Any?> =
    requireRoutes().command(normalizeShapeObject(command, "command", ROUTE_INVALID_ARGUMENT))

  private fun requireRoutes(): MapRoutes {
    val readyMap = requireMap()
    routes?.let { return it }
    val viewReference = WeakReference(this)
    val manager =
      MapRoutes(readyMap, resources.displayMetrics.density, requireImageLoader()) { event, payload ->
        viewReference.get()?.let { view ->
          if (!view.isDestroyed) {
            when (event) {
              "onRouteProgress" -> view.onRouteProgress(payload)
              "onRouteAnimationStop" -> view.onRouteAnimationStop(payload)
            }
          }
        }
      }
    routes = manager
    return manager
  }

  internal fun requireGui(): MapGui {
    val readyMap = requireMap()
    gui?.let { return it }
    val viewReference = WeakReference(this)
    val manager =
      MapGui(readyMap, resources.displayMetrics.density, requireImageLoader()) { payload ->
        viewReference.get()?.let { view -> if (!view.isDestroyed) view.onGuiEvent(payload) }
      }
    gui = manager
    return manager
  }

  private fun requireImageLoader(): MapImageLoader = imageLoader ?: MapImageLoader(appContext).also { imageLoader = it }

  private fun applyPendingRoutesIfReady() {
    if (map == null) return
    val scene = pendingRoutes ?: return
    pendingRoutes = null
    val generation = ++routeGeneration
    val viewReference = WeakReference(this)
    try {
      requireRoutes().apply(scene) { result ->
        viewReference.get()?.let { view ->
          if (!view.isDestroyed && generation == view.routeGeneration) {
            result.fold(
              onSuccess = { view.onRoutesChanged(it) },
              onFailure = { view.reportError(it as? Exception ?: Exception(it)) },
            )
          }
        }
      }
    } catch (error: Exception) {
      reportError(error)
    }
  }

  private fun applyPendingLabelsIfReady() {
    if (map == null) return
    val scene = pendingLabels ?: return
    pendingLabels = null
    val previousGeneration = labelGeneration
    val generation = ++labelGeneration
    try {
      val viewReference = WeakReference(this)
      requireLabels().apply(scene) { result ->
        viewReference.get()?.let { view ->
          if (!view.isDestroyed && generation == view.labelGeneration) {
            result.fold(
              onSuccess = { view.labels?.let { view.onLabelsChanged(it.state()) } },
              onFailure = { error -> view.reportError(error as? Exception ?: Exception(error)) },
            )
          }
        }
      }
    } catch (error: Exception) {
      if (labelGeneration == generation) labelGeneration = previousGeneration
      reportError(error)
    }
  }

  private fun applyPendingShapesIfReady() {
    if (map == null) return
    val scene = pendingShapes ?: return
    pendingShapes = null
    try {
      val counts = requireShapes().apply(scene)
      if (!isDestroyed) onShapesChanged(counts)
    } catch (error: Exception) {
      reportError(error)
    }
  }

  private fun releaseMapObjects() {
    labelGeneration++
    routeGeneration++
    cameraCommands?.dispose()
    cameraCommands = null
    val manager = labels
    labels = null
    try {
      manager?.dispose()
    } catch (error: Exception) {
      if (!isDestroyed) reportError(error)
    }
    val guiManager = gui
    gui = null
    try {
      guiManager?.dispose()
    } catch (error: Exception) {
      if (!isDestroyed) reportError(error)
    }
    val routeManager = routes
    routes = null
    try {
      routeManager?.dispose()
    } catch (error: Exception) {
      if (!isDestroyed) reportError(error)
    }
    val shapeManager = shapes
    shapes = null
    try {
      shapeManager?.dispose()
    } catch (error: Exception) {
      if (!isDestroyed) reportError(error)
    }
    val loader = imageLoader
    imageLoader = null
    try {
      loader?.dispose()
    } catch (error: Exception) {
      if (!isDestroyed) reportError(error)
    }
  }

  private fun applyOptionsSafely(options: MapOptionsRecord) {
    try {
      val map = requireMap()
      validateOptions(map, options)
      val changed = changedMapOptions(appliedOptions, options)
      if (changed.isEmpty()) return
      applyOptions(map, changed)
      mergeMapOptions(appliedOptions, changed)
    } catch (error: Exception) {
      if (!isDestroyed) reportError(error)
    }
  }

  private fun applyOptions(
    map: KakaoMap,
    options: MapOptionsRecord,
  ) {
    options.viewInfo?.let { viewInfo ->
      val nativeViewInfo =
        options.mapType?.let { MapViewInfo.from(viewInfo.appName ?: "openmap", nativeMapType(it)) }
          ?: MapViewInfo.from(viewInfo.appName ?: "openmap", viewInfo.name)
      map.changeMapViewInfo(nativeViewInfo)
    } ?: options.mapType?.let { map.changeMapType(nativeMapType(it)) }

    options.overlays?.let { overlays ->
      (activeOverlays - overlays.toSet()).forEach { map.hideOverlay(nativeMapOverlay(it)) }
      (overlays.toSet() - activeOverlays).forEach { map.showOverlay(nativeMapOverlay(it)) }
      activeOverlays.clear()
      activeOverlays += overlays
    }
    options.customOverlays?.let { overlays ->
      (activeCustomOverlays - overlays.toSet()).forEach(map::hideOverlay)
      (overlays.toSet() - activeCustomOverlays).forEach(map::showOverlay)
      activeCustomOverlays.clear()
      activeCustomOverlays += overlays
    }
    options.language?.let { language ->
      if (!map.setPoiLanguage(language)) {
        throw CodedException("ERR_KAKAO_MAP_LANGUAGE_CHANGE_FAILED", "Kakao Maps could not change the POI language to $language.", null)
      }
    }
    options.poi?.let { poi ->
      poi.visible?.let(map::setPoiVisible)
      poi.clickable?.let(map::setPoiClickable)
      poi.scale?.let { map.poiScale = nativePoiScale(it) }
    }
    options.buildingScale?.let { map.buildingHeightScale = it.toFloat() }
    options.padding?.let { padding ->
      map.setPadding(toPixels(padding.left), toPixels(padding.top), toPixels(padding.right), toPixels(padding.bottom))
    }
    options.zoomRange?.let { range ->
      val min = range.min.toInt()
      val max = range.max.toInt()
      if (max < map.cameraMinLevel) {
        map.cameraMinLevel = min
        map.cameraMaxLevel = max
      } else {
        map.cameraMaxLevel = max
        map.cameraMinLevel = min
      }
    }
    options.gestures?.forEach { (gesture, enabled) -> map.setGestureEnable(nativeGesture(gesture), enabled) }
    options.compass?.let { compassOptions ->
      val compass =
        map.compass
          ?: throw CodedException("ERR_KAKAO_MAP_WIDGET_UNAVAILABLE", "The compass is unavailable.", null)
      compassOptions.visible?.let { if (it) compass.show() else compass.hide() }
      compassOptions.position?.let { compass.setPosition(it.nativeGravity(), toPixelsFloat(it.x), toPixelsFloat(it.y)) }
    }
    options.scaleBar?.let { scaleBarOptions ->
      val scaleBar =
        map.scaleBar
          ?: throw CodedException("ERR_KAKAO_MAP_WIDGET_UNAVAILABLE", "The scale bar is unavailable.", null)
      scaleBarOptions.visible?.let { if (it) scaleBar.show() else scaleBar.hide() }
      scaleBarOptions.position?.let { scaleBar.setPosition(it.nativeGravity(), toPixelsFloat(it.x), toPixelsFloat(it.y)) }
      scaleBarOptions.autoHide?.let { scaleBar.isAutoHide = it }
      scaleBarOptions.fade?.let { fade ->
        scaleBar.setFadeInOutTime(
          fade.inDuration.toInt(),
          fade.outDuration.toInt(),
          fade.retentionDuration.toInt(),
        )
      }
    }
    options.logo?.let { position ->
      val logo = map.logo ?: throw CodedException("ERR_KAKAO_MAP_WIDGET_UNAVAILABLE", "The Kakao logo is unavailable.", null)
      logo.setPosition(position.nativeGravity(), toPixelsFloat(position.x), toPixelsFloat(position.y))
    }
  }

  private fun validateOptions(
    map: KakaoMap,
    options: MapOptionsRecord,
  ) {
    if (options.mapType != null && options.viewInfo != null) {
      throw CodedException(INVALID_ARGUMENT, "Map type and view info are mutually exclusive.", null)
    }
    options.mapType?.let(::nativeMapType)
    options.viewInfo?.validate()
    options.overlays?.forEach(::nativeMapOverlay)
    options.customOverlays?.let { overlays ->
      if (overlays.any(String::isBlank)) {
        throw CodedException(INVALID_ARGUMENT, "Custom overlay IDs must not be blank.", null)
      }
    }
    options.language?.let { language ->
      if (language.isBlank() || language !in (map.supportedLanguages?.toList() ?: emptyList())) {
        throw CodedException(INVALID_ARGUMENT, "Unsupported POI language: $language.", null)
      }
    }
    options.poi?.scale?.let(::nativePoiScale)
    options.buildingScale?.let { scale ->
      if (!scale.isFinite() || scale !in 0.0..1.0) {
        throw CodedException(INVALID_ARGUMENT, "Building scale must be between 0 and 1.", null)
      }
    }
    options.padding?.let { padding ->
      padding.validate()
      listOf(padding.top, padding.right, padding.bottom, padding.left).forEach(::validatePixelValue)
    }
    options.zoomRange?.let { range ->
      if (
        !range.min.isFinite() ||
        !range.max.isFinite() ||
        range.min % 1.0 != 0.0 ||
        range.max % 1.0 != 0.0 ||
        range.min > range.max ||
        range.min < map.minZoomLevel ||
        range.max > map.maxZoomLevel
      ) {
        throw CodedException(INVALID_ARGUMENT, "Zoom range must contain integer levels within the SDK limits.", null)
      }
    }
    options.gestures?.keys?.forEach(::nativeGesture)
    options.compass?.position?.validate("Compass position")
    options.scaleBar?.let { scaleBar ->
      scaleBar.position?.validate("Scale bar position")
      scaleBar.fade?.let { fade ->
        validateDuration(fade.inDuration)
        validateDuration(fade.outDuration)
        validateDuration(fade.retentionDuration)
      }
    }
    options.logo?.validate("Logo position")
    listOfNotNull(options.compass?.position, options.scaleBar?.position, options.logo).forEach { position ->
      validatePixelValue(position.x)
      validatePixelValue(position.y)
    }
  }

  private fun dispatchCameraUpdate(
    map: KakaoMap,
    update: CameraUpdate,
    durationMillis: Int,
  ) {
    if (durationMillis == 0) map.moveCamera(update) else map.moveCamera(update, CameraAnimation.from(durationMillis, false, false))
  }

  private fun updateOrientation(
    map: KakaoMap,
    update: CameraUpdateRecord,
    durationMillis: Int,
    promise: Promise,
  ) {
    val rotation = update.rotation ?: throw invalidCameraUpdate("rotation")
    val tilt = update.tilt ?: throw invalidCameraUpdate("tilt")
    if (!rotation.isFinite() || !tilt.isFinite() || tilt !in 0.0..90.0) {
      throw CodedException(INVALID_ARGUMENT, "Camera orientation must contain a finite rotation and tilt from 0 to 90 degrees.", null)
    }
    requireOnlyCameraFields(update, "orientation")
    val commandGeneration = beginCameraCommand()
    val requestId = Any()
    val viewReference = WeakReference(this)
    val timeout =
      Runnable {
        viewReference.get()?.rejectCameraDispatch(
          requestId,
          CAMERA_TIMEOUT,
          "Kakao Maps did not return a settled camera position within $CAMERA_REQUEST_TIMEOUT_MILLIS milliseconds.",
        )
      }
    pendingCameraDispatches[requestId] = PendingCameraRequest(promise, timeout)
    mainHandler.postDelayed(timeout, CAMERA_REQUEST_TIMEOUT_MILLIS)
    val callbackHandler = mainHandler
    val mapReference = WeakReference(map)
    try {
      map.getCameraPosition { position ->
        callbackHandler.post {
          viewReference.get()?.resolveCameraDispatch(
            requestId,
            mapReference.get(),
            position,
            rotation,
            tilt,
            durationMillis,
            commandGeneration,
          )
        }
      }
    } catch (error: Exception) {
      val code = if (error is CodedException) error.code else error.javaClass.simpleName
      rejectCameraDispatch(requestId, code, error.message ?: "Camera update failed.")
    }
  }

  private fun resolveCameraDispatch(
    requestId: Any,
    expectedMap: KakaoMap?,
    position: CameraPosition,
    rotation: Double,
    tilt: Double,
    durationMillis: Int,
    commandGeneration: Long,
  ) {
    val request = pendingCameraDispatches.remove(requestId) ?: return
    mainHandler.removeCallbacks(request.timeout)
    if (isDestroyed || expectedMap == null || map !== expectedMap) {
      request.promise.reject(VIEW_DESTROYED, VIEW_DESTROYED_MESSAGE, null)
      return
    }
    if (commandGeneration != cameraCommandGeneration) {
      request.promise.reject(
        CAMERA_SUPERSEDED,
        "The orientation update was superseded by a newer camera command before dispatch.",
        null,
      )
      return
    }
    try {
      val cameraUpdate =
        CameraUpdateFactory.newCameraPosition(
          CameraPosition.from(
            CameraPosition
              .Builder()
              .setPosition(position.position)
              .setZoomLevel(position.zoomLevel)
              .setTiltAngle(Math.toRadians(tilt))
              .setRotationAngle(rotation.toNativeCameraRotation()),
          ),
        )
      dispatchCameraUpdate(expectedMap, cameraUpdate, durationMillis)
      request.promise.resolve(null)
    } catch (error: Exception) {
      val code = if (error is CodedException) error.code else error.javaClass.simpleName
      request.promise.reject(code, error.message ?: "Camera update failed.", error)
    }
  }

  private fun rejectCameraDispatch(
    requestId: Any,
    code: String,
    message: String,
  ) {
    val request = pendingCameraDispatches.remove(requestId) ?: return
    mainHandler.removeCallbacks(request.timeout)
    request.promise.reject(code, message, null)
  }

  private fun rejectPendingCameraDispatches(
    code: String,
    message: String,
  ) {
    pendingCameraDispatches.keys.toList().forEach { rejectCameraDispatch(it, code, message) }
  }

  private fun validateDuration(duration: Double): Int {
    if (!duration.isFinite() || duration < 0 || duration > Int.MAX_VALUE || duration % 1.0 != 0.0) {
      throw CodedException(INVALID_ARGUMENT, "Duration must be an integer between 0 and 2147483647 milliseconds.", null)
    }
    return duration.toInt()
  }

  private fun beginCameraCommand(): Long {
    cameraCommandGeneration += 1
    return cameraCommandGeneration
  }

  private fun validatePixelValue(value: Double) {
    val pixels = value * resources.displayMetrics.density
    if (!pixels.isFinite() || pixels < Int.MIN_VALUE || pixels > Int.MAX_VALUE) {
      throw CodedException(INVALID_ARGUMENT, "Screen point values exceed the supported pixel range.", null)
    }
  }

  private fun toPixels(value: Double) = (value * resources.displayMetrics.density).toInt()

  private fun toPixelsFloat(value: Double) = (value * resources.displayMetrics.density).toFloat()

  private fun requireOnlyCameraFields(
    update: CameraUpdateRecord,
    type: String,
  ) {
    val isValid =
      when (type) {
        "position" -> update.zoomLevel == null && update.rotation == null && update.tilt == null && update.coordinates == null
        "zoom" -> update.position == null && update.rotation == null && update.tilt == null && update.coordinates == null
        "orientation" -> update.position == null && update.zoomLevel == null && update.coordinates == null
        "fit" -> update.position == null && update.zoomLevel == null && update.rotation == null && update.tilt == null
        else -> false
      }
    if (!isValid) {
      throw CodedException(INVALID_ARGUMENT, "Camera update type $type contains fields for another update type.", null)
    }
  }

  private fun invalidCameraUpdate(field: String) =
    CodedException(INVALID_ARGUMENT, "Camera update is missing required field: $field.", null)

  private fun reportError(error: Exception) {
    val code = if (error is CodedException) error.code else error.javaClass.simpleName
    onError(mapOf("code" to code, "message" to (error.message ?: "Map error")))
  }

  fun getCamera(
    promise: Promise,
    isAdvancedState: Boolean = false,
  ) {
    val readyMap =
      try {
        requireMap()
      } catch (error: CodedException) {
        promise.reject(error)
        return
      }
    val requestId = Any()
    val viewReference = WeakReference(this)
    val timeout =
      Runnable {
        viewReference.get()?.rejectCameraRequest(
          requestId,
          CAMERA_TIMEOUT,
          "Kakao Maps did not return a camera position within $CAMERA_REQUEST_TIMEOUT_MILLIS milliseconds.",
        )
      }
    pendingCameraRequests[requestId] = PendingCameraRequest(promise, timeout, isAdvancedState)
    mainHandler.postDelayed(timeout, CAMERA_REQUEST_TIMEOUT_MILLIS)
    val callbackHandler = mainHandler
    try {
      readyMap.getCameraPosition { position ->
        callbackHandler.post {
          viewReference.get()?.resolveCameraRequest(requestId, position)
        }
      }
    } catch (error: Exception) {
      val code = if (error is CodedException) error.code else error.javaClass.simpleName
      rejectCameraRequest(requestId, code, error.message ?: "Camera query failed.")
    }
  }

  private fun resolveCameraRequest(
    requestId: Any,
    position: CameraPosition,
  ) {
    val request = pendingCameraRequests.remove(requestId) ?: return
    mainHandler.removeCallbacks(request.timeout)
    try {
      request.promise.resolve(if (request.isAdvancedState) requireCameraCommands().stateResult(position) else position.toPayload())
    } catch (error: Exception) {
      if (error is CodedException) {
        request.promise.reject(error)
      } else {
        request.promise.reject("ERR_KAKAO_MAP_CAMERA", error.message, error)
      }
    }
  }

  private fun rejectCameraRequest(
    requestId: Any,
    code: String,
    message: String,
  ) {
    val request = pendingCameraRequests.remove(requestId) ?: return
    mainHandler.removeCallbacks(request.timeout)
    request.promise.reject(code, message, null)
  }

  private fun rejectPendingCameraRequests(
    code: String,
    message: String,
  ) {
    pendingCameraRequests.keys.toList().forEach { rejectCameraRequest(it, code, message) }
  }

  private fun applyCameraProp(camera: CameraOptions) {
    try {
      moveCamera(camera, 0.0)
    } catch (error: CodedException) {
      onError(mapOf("code" to error.code, "message" to error.localizedMessage))
    }
  }

  private fun requireMap(): KakaoMap {
    if (isDestroyed) throw CodedException(VIEW_DESTROYED, VIEW_DESTROYED_MESSAGE, null)
    if (KakaoMapModule.appKey == null) throw CodedException(NOT_INITIALIZED, "Initialize the map SDK first.", null)
    return map ?: throw CodedException(NOT_READY, "Wait for onMapReady before calling map methods.", null)
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
      // A map created during layout needs measurement before its surface can start.
      view.measure(
        MeasureSpec.makeMeasureSpec(right - left, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(bottom - top, MeasureSpec.EXACTLY),
      )
      view.layout(0, 0, right - left, bottom - top)
    }
  }

  private fun resume() {
    if (!isDestroyed && isAttachedToWindow && reactContext?.lifecycleState == LifecycleState.RESUMED) mapView?.resume()
  }

  override fun onDetachedFromWindow() {
    mapView?.pause()
    super.onDetachedFromWindow()
  }

  override fun onHostResume() {
    resume()
  }

  override fun onHostPause() {
    mapView?.pause()
  }

  override fun onHostDestroy() {
    destroy()
  }

  fun destroy() {
    if (isDestroyed) return
    isDestroyed = true
    releaseMapObjects()
    beginCameraCommand()
    rejectPendingCameraRequests(VIEW_DESTROYED, VIEW_DESTROYED_MESSAGE)
    rejectPendingCameraDispatches(VIEW_DESTROYED, VIEW_DESTROYED_MESSAGE)
    reactContext?.removeLifecycleEventListener(this)
    map?.setOnCameraMoveStartListener(null)
    map?.setOnCameraMoveEndListener(null)
    map?.setOnMapClickListener(null)
    map?.setOnTerrainClickListener(null)
    map?.setOnViewportClickListener(null)
    map?.setOnVisibleChangeListener(null)
    map?.setOnTerrainLongClickListener(null)
    map?.setOnPoiClickListener(null)
    map?.setOnCompassClickListener(null)
    map?.setOnMapViewInfoChangeListener(null)
    map?.setOnPaddingChangeListener(null)
    map?.setOnViewportChangeListener(null)
    map?.setOnLabelClickListener(null)
    map?.setOnLodLabelClickListener(null)
    map = null
    queuedOptions = null
    pendingShapes = null
    pendingRoutes = null
    activeOverlays.clear()
    activeCustomOverlays.clear()
    val view = mapView
    mapView = null
    view?.finish()
    view?.let(::removeView)
  }

  private fun reason(gesture: GestureType) = if (gesture == GestureType.Unknown) "developer" else "gesture"

  private data class PendingCameraRequest(
    val promise: Promise,
    val timeout: Runnable,
    val isAdvancedState: Boolean = false,
  )
}

private fun normalizeShapeObject(
  value: Map<*, *>,
  path: String,
  errorCode: String = SHAPE_INVALID_ARGUMENT,
): Map<String, Any?> =
  value.entries.associate { (rawKey, rawValue) ->
    val key = rawKey as? String ?: throw CodedException(errorCode, "$path must use string object keys.", null)
    key to normalizeShapeValue(rawValue, "$path.$key", errorCode)
  }

private fun normalizeShapeValue(
  value: Any?,
  path: String,
  errorCode: String,
): Any? =
  when (value) {
    null, is String, is Boolean -> {
      value
    }

    is Number -> {
      if (!value.toDouble().isFinite()) {
        throw CodedException(errorCode, "$path must be a finite JSON number.", null)
      }
      value
    }

    is Map<*, *> -> {
      normalizeShapeObject(value, path, errorCode)
    }

    is List<*> -> {
      value.mapIndexed { index, item -> normalizeShapeValue(item, "$path[$index]", errorCode) }
    }

    else -> {
      throw CodedException(errorCode, "$path contains an unsupported JSON value.", null)
    }
  }
