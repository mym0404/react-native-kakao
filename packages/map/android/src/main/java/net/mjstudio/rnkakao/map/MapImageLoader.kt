package net.mjstudio.rnkakao.map

import android.graphics.Bitmap
import android.graphics.Canvas
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.LruCache
import com.facebook.common.executors.CallerThreadExecutor
import com.facebook.common.references.CloseableReference
import com.facebook.datasource.BaseDataSubscriber
import com.facebook.datasource.DataSource
import com.facebook.drawee.backends.pipeline.Fresco
import com.facebook.imagepipeline.common.RotationOptions
import com.facebook.imagepipeline.image.CloseableBitmap
import com.facebook.imagepipeline.image.CloseableImage
import com.facebook.imagepipeline.request.ImageRequestBuilder
import com.facebook.react.views.imagehelper.ImageSource
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import java.lang.ref.WeakReference
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicBoolean

private const val MAP_IMAGE_LOAD_ERROR = "ERR_KAKAO_MAP_IMAGE_LOAD"
private const val MAP_IMAGE_CACHE_KILOBYTES = 16 * 1_024
private val supportedMapImageSchemes = setOf("asset", "content", "data", "file", "http", "https")

internal class MapImageLoadException(
  message: String,
  cause: Throwable? = null,
) : CodedException(MAP_IMAGE_LOAD_ERROR, message, cause)

internal class MapImageLoadToken internal constructor(
  private val cancellation: () -> Unit,
) {
  private val isFinished = AtomicBoolean(false)

  fun cancel() {
    if (isFinished.compareAndSet(false, true)) cancellation()
  }

  internal fun finish() = isFinished.compareAndSet(false, true)
}

internal class MapImageLoader(
  appContext: AppContext,
) {
  private data class Request(
    val completion: (Result<Bitmap>) -> Unit,
    var source: DataSource<CloseableReference<CloseableImage>>? = null,
  )

  private val reactContext = appContext.reactContext?.let(::WeakReference)
  private val mainHandler = Handler(Looper.getMainLooper())
  private val requests = ConcurrentHashMap<MapImageLoadToken, Request>()
  private val cache =
    object : LruCache<String, Bitmap>(MAP_IMAGE_CACHE_KILOBYTES) {
      override fun sizeOf(
        key: String,
        value: Bitmap,
      ) = (value.byteCount / 1_024).coerceAtLeast(1)
    }
  private val isDisposed = AtomicBoolean(false)

  fun load(
    uri: String,
    completion: (Result<Bitmap>) -> Unit,
  ): MapImageLoadToken {
    check(Looper.myLooper() == Looper.getMainLooper()) { "Map images must be requested on the main thread." }
    lateinit var token: MapImageLoadToken
    val loaderReference = WeakReference(this)
    token = MapImageLoadToken { loaderReference.get()?.cancel(token) }
    if (isDisposed.get()) {
      mainHandler.post {
        if (token.finish()) completion(Result.failure(MapImageLoadException("The map image loader was destroyed.")))
      }
      return token
    }
    val request = Request(completion)
    requests[token] = request

    val resolvedUri =
      try {
        resolveUri(uri)
      } catch (error: MapImageLoadException) {
        mainHandler.post { finish(token, Result.failure(error)) }
        return token
      }
    cache.get(resolvedUri)?.let { image ->
      mainHandler.post { finish(token, Result.success(image)) }
      return token
    }
    val source =
      try {
        val imageRequest =
          ImageRequestBuilder
            .newBuilderWithSource(Uri.parse(resolvedUri))
            .setRotationOptions(RotationOptions.autoRotate())
            .build()
        Fresco.getImagePipeline().fetchDecodedImage(imageRequest, this)
      } catch (error: Exception) {
        mainHandler.post {
          finish(
            token,
            Result.failure(MapImageLoadException(error.message ?: "Could not load the map image.", error)),
          )
        }
        return token
      }
    request.source = source
    try {
      source.subscribe(
        object : BaseDataSubscriber<CloseableReference<CloseableImage>>() {
          override fun onNewResultImpl(dataSource: DataSource<CloseableReference<CloseableImage>>) {
            if (!dataSource.isFinished) return
            val imageReference = dataSource.result
            if (imageReference == null) {
              mainHandler.post {
                finish(token, Result.failure(MapImageLoadException("Could not decode the map image.")))
              }
              return
            }
            val result =
              try {
                val image =
                  imageReference.get() as? CloseableBitmap
                    ?: throw MapImageLoadException("Could not decode the map image as a bitmap.")
                val sourceBitmap =
                  image.underlyingBitmap
                    ?: throw MapImageLoadException("The decoded map image does not contain a bitmap.")
                Result.success(copyBitmap(sourceBitmap))
              } catch (error: Exception) {
                Result.failure(
                  if (error is MapImageLoadException) {
                    error
                  } else {
                    MapImageLoadException(error.message ?: "Could not decode the map image.", error)
                  },
                )
              } finally {
                CloseableReference.closeSafely(imageReference)
              }
            mainHandler.post { finish(token, result, resolvedUri) }
          }

          override fun onFailureImpl(dataSource: DataSource<CloseableReference<CloseableImage>>) {
            val error = dataSource.failureCause
            mainHandler.post {
              finish(
                token,
                Result.failure(MapImageLoadException(error?.message ?: "Could not load the map image.", error)),
              )
            }
          }

          override fun onCancellation(dataSource: DataSource<CloseableReference<CloseableImage>>) {
            mainHandler.post {
              finish(token, Result.failure(MapImageLoadException("The map image load was cancelled.")))
            }
          }
        },
        CallerThreadExecutor.getInstance(),
      )
    } catch (error: Exception) {
      source.close()
      mainHandler.post {
        finish(
          token,
          Result.failure(MapImageLoadException(error.message ?: "Could not schedule the map image load.", error)),
        )
      }
    }
    return token
  }

  private fun copyBitmap(source: Bitmap): Bitmap {
    val copy = Bitmap.createBitmap(source.width, source.height, Bitmap.Config.ARGB_8888)
    copy.density = source.density
    Canvas(copy).drawBitmap(source, 0f, 0f, null)
    return copy
  }

  fun dispose() {
    check(Looper.myLooper() == Looper.getMainLooper()) { "Map images must be disposed on the main thread." }
    if (!isDisposed.compareAndSet(false, true)) return
    requests.keys.toList().forEach(MapImageLoadToken::cancel)
    cache.evictAll()
  }

  private fun resolveUri(uri: String): String {
    if (isDisposed.get()) throw MapImageLoadException("The map image loader was destroyed.")
    val scheme = Uri.parse(uri).scheme?.lowercase()
    if (scheme != null) {
      if (scheme !in supportedMapImageSchemes) {
        throw MapImageLoadException("Image URI must use a supported scheme.")
      }
      return uri
    }

    val context =
      reactContext?.get()
        ?: throw MapImageLoadException("The React context is unavailable.")
    val resourceUri = ImageSource(context, uri).uri
    val resourceId =
      resourceUri.path?.removePrefix("/")?.toIntOrNull()
        ?: throw MapImageLoadException("Image URI must use a supported scheme or identify a bundled drawable.")
    val isDrawable =
      runCatching { context.resources.getResourceTypeName(resourceId) == "drawable" }.getOrDefault(false)
    if (resourceUri.scheme != "res" || !isDrawable) {
      throw MapImageLoadException("Image URI must use a supported scheme or identify a bundled drawable.")
    }
    return resourceUri.toString()
  }

  private fun cancel(token: MapImageLoadToken) {
    val request = requests.remove(token) ?: return
    request.source?.close()
  }

  private fun finish(
    token: MapImageLoadToken,
    result: Result<Bitmap>,
    cacheUri: String? = null,
  ) {
    if (isDisposed.get()) return
    val request = requests.remove(token) ?: return
    if (!token.finish()) return
    if (cacheUri != null) result.getOrNull()?.let { image -> cache.put(cacheUri, image) }
    request.completion(result)
  }
}
