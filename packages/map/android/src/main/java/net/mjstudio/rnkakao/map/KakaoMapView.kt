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
import com.kakao.vectormap.MapAuthException
import com.kakao.vectormap.MapLifeCycleCallback
import com.kakao.vectormap.MapView
import com.kakao.vectormap.camera.CameraAnimation
import com.kakao.vectormap.camera.CameraUpdateFactory
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.lang.ref.WeakReference

private const val CAMERA_REQUEST_TIMEOUT_MILLIS = 3_000L
private const val CAMERA_TIMEOUT = "ERR_KAKAO_MAP_CAMERA_TIMEOUT"
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
  private var mapView: MapView? = null
  private var map: KakaoMap? = null
  private var isDestroyed = false
  private var isStarted = false
  private var hasInitialProps = false
  private var initialCamera: CameraOptions? = null
  private var lastCameraValues: List<Double>? = null
  private val mainHandler = Handler(Looper.getMainLooper())
  private val pendingCameraRequests = mutableMapOf<Any, PendingCameraRequest>()
  private val reactContext = appContext.reactContext as? ReactContext
  var pendingInitialCamera: CameraOptions? = null
  var camera: CameraOptions? = null

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
          map = null
          rejectPendingCameraRequests(NOT_READY, "The map was destroyed before returning its camera position.")
        }

        override fun onMapError(error: Exception) {
          if (isDestroyed) return
          map = null
          val code = if (error is MapAuthException) error.errorCode.toString() else error.javaClass.simpleName
          val message = error.message ?: "Map error"
          rejectPendingCameraRequests(code, message)
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
          (camera ?: initialCamera)?.let { applyCameraProp(it) }
          lastCameraValues = camera?.values()
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
    if (!duration.isFinite() || duration < 0 || duration > Int.MAX_VALUE || duration % 1.0 != 0.0) {
      throw CodedException(INVALID_ARGUMENT, "Duration must be an integer between 0 and 2147483647 milliseconds.", null)
    }
    val update = CameraUpdateFactory.newCameraPosition(camera.position(map.minZoomLevel, map.maxZoomLevel))
    if (duration == 0.0) map.moveCamera(update) else map.moveCamera(update, CameraAnimation.from(duration.toInt(), false, false))
  }

  fun getCamera(promise: Promise) {
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
    pendingCameraRequests[requestId] = PendingCameraRequest(promise, timeout)
    mainHandler.postDelayed(timeout, CAMERA_REQUEST_TIMEOUT_MILLIS)
    readyMap.getCameraPosition { position ->
      viewReference.get()?.resolveCameraRequest(requestId, position.toPayload())
    }
  }

  private fun resolveCameraRequest(
    requestId: Any,
    camera: Map<String, Any>,
  ) {
    val request = pendingCameraRequests.remove(requestId) ?: return
    mainHandler.removeCallbacks(request.timeout)
    request.promise.resolve(camera)
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
    rejectPendingCameraRequests(VIEW_DESTROYED, VIEW_DESTROYED_MESSAGE)
    reactContext?.removeLifecycleEventListener(this)
    map?.setOnCameraMoveStartListener(null)
    map?.setOnCameraMoveEndListener(null)
    map?.setOnMapClickListener(null)
    map = null
    val view = mapView
    mapView = null
    view?.finish()
    view?.let(::removeView)
  }

  private fun reason(gesture: GestureType) = if (gesture == GestureType.Unknown) "developer" else "gesture"

  private data class PendingCameraRequest(
    val promise: Promise,
    val timeout: Runnable,
  )
}
