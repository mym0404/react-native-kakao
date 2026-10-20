package net.mjstudio.rnkakao.share

import android.content.ActivityNotFoundException
import android.net.Uri
import android.util.Base64
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.kakao.sdk.common.util.KakaoCustomTabsClient
import com.kakao.sdk.share.ShareClient
import com.kakao.sdk.share.WebSharerClient
import com.kakao.sdk.share.model.SharingResult
import com.kakao.sdk.talk.TalkApiClient
import com.kakao.sdk.talk.model.MessageSendResult
import net.mjstudio.rnkakao.core.util.KakaoApp.TALK
import net.mjstudio.rnkakao.core.util.RNCKakaoAppNotAvailableException
import net.mjstudio.rnkakao.core.util.RNCKakaoResponseNotFoundException
import net.mjstudio.rnkakao.core.util.RNCKakaoUnknownException
import net.mjstudio.rnkakao.core.util.argArr
import net.mjstudio.rnkakao.core.util.argMap
import net.mjstudio.rnkakao.core.util.filterIsInstance
import net.mjstudio.rnkakao.core.util.onMain
import net.mjstudio.rnkakao.core.util.pushStringList
import net.mjstudio.rnkakao.core.util.rejectWith
import net.mjstudio.rnkakao.core.util.toStringMap
import java.io.File
import kotlin.concurrent.thread

class RNCKakaoShareModule internal constructor(
  context: ReactApplicationContext,
) : NativeKakaoShareSpec(context) {
  @ReactMethod
  override fun uploadImage(
    imageUri: String,
    secureResource: Boolean,
    promise: Promise,
  ) {
    thread {
      var temporaryFile: File? = null
      try {
        val maxImageBytes = 5 * 1024 * 1024
        val imageSizeError = "Image must be no larger than 5 MB"

        fun createTemporaryImageFile(): File =
          File.createTempFile("kakao-share-image-", ".tmp", reactApplicationContext.cacheDir).also {
            temporaryFile = it
          }
        val uri = Uri.parse(imageUri)
        val file =
          when (uri.scheme) {
            null -> {
              File(imageUri)
            }

            "file" -> {
              File(requireNotNull(uri.path))
            }

            "content" -> {
              val copiedFile = createTemporaryImageFile()
              requireNotNull(reactApplicationContext.contentResolver.openInputStream(uri)).use { input ->
                copiedFile.outputStream().use { output ->
                  val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
                  var total = 0
                  var count = input.read(buffer)
                  while (count != -1) {
                    total += count
                    require(total <= maxImageBytes) { imageSizeError }
                    output.write(buffer, 0, count)
                    count = input.read(buffer)
                  }
                }
              }
              copiedFile
            }

            "data" -> {
              require(imageUri.startsWith("data:image/") && imageUri.substringBefore(',').endsWith(";base64")) {
                "Expected a base64 image data URI"
              }
              val maxEncodedImageLength = ((maxImageBytes + 2) / 3) * 4
              val encodedImage =
                buildString {
                  for (index in imageUri.indexOf(',') + 1 until imageUri.length) {
                    val character = imageUri[index]
                    if (!character.isWhitespace()) {
                      require(length < maxEncodedImageLength) { imageSizeError }
                      append(character)
                    }
                  }
                }
              val bytes = Base64.decode(encodedImage, Base64.DEFAULT)
              require(bytes.size <= maxImageBytes) { imageSizeError }
              val decodedFile = createTemporaryImageFile()
              decodedFile.writeBytes(bytes)
              decodedFile
            }

            else -> {
              throw IllegalArgumentException("Expected a local file, content, or base64 image data URI")
            }
          }
        require(file.isFile && file.canRead()) { "Image file cannot be read" }
        require(file.length() <= maxImageBytes) { imageSizeError }
        ShareClient.instance.uploadImage(file, secureResource) { result, error ->
          temporaryFile?.delete()
          if (error != null) {
            promise.rejectWith(error)
          } else if (result != null) {
            val original = result.infos.original
            promise.resolve(
              argMap().apply {
                putMap(
                  "infos",
                  argMap().apply {
                    putMap(
                      "original",
                      argMap().apply {
                        putString("url", original.url)
                        putString("contentType", original.contentType)
                        putDouble("length", original.length.toDouble())
                        putDouble("width", original.width.toDouble())
                        putDouble("height", original.height.toDouble())
                      },
                    )
                  },
                )
              },
            )
          } else {
            promise.rejectWith(RNCKakaoResponseNotFoundException("imageUploadResult"))
          }
        }
      } catch (error: Exception) {
        temporaryFile?.delete()
        promise.rejectWith(error)
      }
    }
  }

  @ReactMethod
  override fun scrapImage(
    imageUrl: String,
    secureResource: Boolean,
    promise: Promise,
  ) = onMain {
    ShareClient.instance.scrapImage(imageUrl, secureResource) { result, error ->
      if (error != null) {
        promise.rejectWith(error)
      } else if (result != null) {
        val original = result.infos.original
        promise.resolve(
          argMap().apply {
            putMap(
              "infos",
              argMap().apply {
                putMap(
                  "original",
                  argMap().apply {
                    putString("url", original.url)
                    putString("contentType", original.contentType)
                    putDouble("length", original.length.toDouble())
                    putDouble("width", original.width.toDouble())
                    putDouble("height", original.height.toDouble())
                  },
                )
              },
            )
          },
        )
      } else {
        promise.rejectWith(RNCKakaoResponseNotFoundException("imageUploadResult"))
      }
    }
  }

  @ReactMethod
  override fun shareOrSendMeOrSendFriendOrWhatever(
    sendType: String,
    templateType: String,
    templateId: Double,
    templateJson: ReadableMap,
    receiverUuids: ReadableArray,
    useWebBrowserIfKakaoTalkNotAvailable: Boolean,
    templateArgs: ReadableMap,
    serverCallbackArgs: ReadableMap,
    promise: Promise,
  ) = onMain {
    if (templateType == "custom") {
      shareOrSendCustom(
        sendType,
        templateType,
        templateId,
        receiverUuids = receiverUuids.filterIsInstance<String>(),
        useWebBrowserIfKakaoTalkNotAvailable,
        templateArgs,
        serverCallbackArgs,
        promise,
      )
    } else {
      shareOrSendDefaultTemplate(
        sendType,
        templateType,
        templateJson,
        receiverUuids = receiverUuids.filterIsInstance<String>(),
        useWebBrowserIfKakaoTalkNotAvailable,
        serverCallbackArgs,
        promise,
      )
    }
  }

  private fun shareOrSendCustom(
    sendType: String,
    templateType: String,
    templateId: Double,
    receiverUuids: List<String>,
    useWebBrowserIfKakaoTalkNotAvailable: Boolean,
    templateArgs: ReadableMap?,
    serverCallbackArgs: ReadableMap?,
    promise: Promise,
  ) = when (sendType) {
    "share" -> {
      runShare(
        templateType,
        templateId,
        null,
        useWebBrowserIfKakaoTalkNotAvailable,
        templateArgs,
        serverCallbackArgs,
        promise,
      )
    }

    "send-me" -> {
      runSendToMe(templateType, templateId, null, templateArgs, promise)
    }

    "send-friend" -> {
      runSendToFriends(templateType, receiverUuids, templateId, null, templateArgs, promise)
    }

    else -> {
      promise.rejectWith(RNCKakaoUnknownException("Unknown sendType: $sendType"))
    }
  }

  private fun shareOrSendDefaultTemplate(
    sendType: String,
    templateType: String,
    template: ReadableMap,
    receiverUuids: List<String>,
    useWebBrowserIfKakaoTalkNotAvailable: Boolean,
    serverCallbackArgs: ReadableMap?,
    promise: Promise,
  ) = when (sendType) {
    "share" -> {
      runShare(
        templateType,
        null,
        template,
        useWebBrowserIfKakaoTalkNotAvailable,
        argMap(),
        serverCallbackArgs,
        promise,
      )
    }

    "send-me" -> {
      runSendToMe(templateType, null, template, null, promise)
    }

    "send-friend" -> {
      runSendToFriends(templateType, receiverUuids, null, template, null, promise)
    }

    else -> {
      promise.rejectWith(RNCKakaoUnknownException("Unknown sendType: $sendType"))
    }
  }

  private fun runSendToMe(
    templateType: String,
    templateId: Double? = null,
    defaultTemplate: ReadableMap? = null,
    templateArgs: ReadableMap? = null,
    promise: Promise,
  ) {
    val callback = { e: Throwable? ->
      if (e != null) {
        promise.rejectWith(e)
      } else {
        promise.resolve(42)
      }
    }
    if (templateId != null) {
      TalkApiClient.instance.sendCustomMemo(templateId.toLong(), templateArgs?.toStringMap(), callback)
    } else if (defaultTemplate != null) {
      runCatching {
        TalkApiClient.instance.sendDefaultMemo(
          RNCKakaoShareTemplates.createDefaultTemplate(defaultTemplate, templateType),
          callback,
        )
      }.onFailure { promise.rejectWith(it) }
    } else {
      promise.rejectWith(RNCKakaoUnknownException("one of templateId or defaultTemplate should exist"))
    }
  }

  private fun runSendToFriends(
    templateType: String,
    receiverUuids: List<String>,
    templateId: Double? = null,
    defaultTemplate: ReadableMap? = null,
    templateArgs: ReadableMap? = null,
    promise: Promise,
  ) {
    val callback = { messageSendResult: MessageSendResult?, e: Throwable? ->
      if (e != null) {
        promise.rejectWith(e)
      } else if (messageSendResult == null) {
        promise.rejectWith(RNCKakaoResponseNotFoundException("messageSendResult"))
      } else {
        promise.resolve(argArr().pushStringList(messageSendResult.successfulReceiverUuids ?: listOf()))
      }
    }
    if (templateId != null) {
      TalkApiClient.instance.sendCustomMessage(receiverUuids, templateId.toLong(), templateArgs?.toStringMap(), callback)
    } else if (defaultTemplate != null) {
      runCatching {
        TalkApiClient.instance.sendDefaultMessage(
          receiverUuids,
          RNCKakaoShareTemplates.createDefaultTemplate(defaultTemplate, templateType),
          callback,
        )
      }.onFailure { promise.rejectWith(it) }
    } else {
      promise.rejectWith(RNCKakaoUnknownException("one of templateId or defaultTemplate should exist"))
    }
  }

  private fun runShare(
    templateType: String,
    templateId: Double? = null,
    defaultTemplate: ReadableMap? = null,
    useWebBrowserIfKakaoTalkNotAvailable: Boolean,
    templateArgs: ReadableMap? = null,
    serverCallbackArgs: ReadableMap? = null,
    promise: Promise,
  ) {
    val context = currentActivity
    if (context == null) {
      promise.rejectWith(ActivityNotFoundException())
      return
    }

    val callback = { sharingResult: SharingResult?, error: Throwable? ->
      if (error != null) {
        promise.rejectWith(error)
      } else if (sharingResult != null) {
        context.startActivity(sharingResult.intent)
        promise.resolve(42)
      } else {
        promise.resolve(42)
      }
    }

    if (ShareClient.instance.isKakaoTalkSharingAvailable(context)) {
      if (templateId != null) {
        ShareClient.instance.shareCustom(
          context,
          templateId.toLong(),
          templateArgs = templateArgs?.toStringMap(),
          serverCallbackArgs = serverCallbackArgs?.toStringMap(),
          callback = callback,
        )
      } else if (defaultTemplate != null) {
        runCatching {
          ShareClient.instance.shareDefault(
            context,
            RNCKakaoShareTemplates.createDefaultTemplate(defaultTemplate, templateType),
            serverCallbackArgs = serverCallbackArgs?.toStringMap(),
            callback = callback,
          )
        }.onFailure {
          promise.rejectWith(it)
        }
      }
    } else if (useWebBrowserIfKakaoTalkNotAvailable) {
      runCatching {
        val sharerUrl =
          if (templateId != null) {
            WebSharerClient.instance.makeCustomUrl(
              templateId.toLong(),
              templateArgs = templateArgs?.toStringMap(),
              serverCallbackArgs = serverCallbackArgs?.toStringMap(),
            )
          } else if (defaultTemplate != null) {
            WebSharerClient.instance.makeDefaultUrl(
              RNCKakaoShareTemplates.createDefaultTemplate(defaultTemplate, templateType),
              serverCallbackArgs = serverCallbackArgs?.toStringMap(),
            )
          } else {
            run {
              promise.rejectWith(RNCKakaoUnknownException("one of templateId or template shouldn't be null"))
              return
            }
          }
        try {
          KakaoCustomTabsClient.openWithDefault(context, sharerUrl)
          promise.resolve(42)
          return
        } catch (_: UnsupportedOperationException) {
        }
        try {
          KakaoCustomTabsClient.open(context, sharerUrl)
          promise.resolve(42)
          return
        } catch (_: ActivityNotFoundException) {
        }

        promise.rejectWith(RNCKakaoUnknownException("web url open failed $sharerUrl"))
      }.onFailure {
        promise.rejectWith(it)
      }
    } else {
      promise.rejectWith(RNCKakaoAppNotAvailableException(TALK))
    }
  }
}
