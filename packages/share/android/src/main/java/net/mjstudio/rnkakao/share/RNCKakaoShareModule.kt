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
import com.kakao.sdk.share.model.ShareType
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
  override fun isKakaoTalkSharingAvailable(promise: Promise) =
    onMain {
      promise.resolve(ShareClient.instance.isKakaoTalkSharingAvailable(reactApplicationContext))
    }

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
  override fun shareScrapTemplate(
    requestUrl: String,
    useWebBrowserIfKakaoTalkNotAvailable: Boolean,
    templateId: Double?,
    templateArgs: ReadableMap?,
    serverCallbackArgs: ReadableMap?,
    pickerSettings: ReadableMap?,
    promise: Promise,
  ) = onMain {
    runShare(
      templateType = "scrap",
      templateId = templateId,
      useWebBrowserIfKakaoTalkNotAvailable = useWebBrowserIfKakaoTalkNotAvailable,
      templateArgs = templateArgs,
      serverCallbackArgs = serverCallbackArgs,
      pickerSettings = pickerSettings,
      requestUrl = requestUrl,
      promise = promise,
    )
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
    pickerSettings: ReadableMap?,
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
        pickerSettings,
        promise,
      )
    } else if (templateType == "scrap") {
      val requestUrl = templateJson.toHashMap()["requestUrl"] as? String
      if (requestUrl == null) {
        promise.rejectWith(RNCKakaoUnknownException("requestUrl is required for scrap messages"))
        return@onMain
      }
      val customTemplateId = templateId.takeUnless { it == -1.0 }
      when (sendType) {
        "send-me" -> {
          runSendToMe(templateType, customTemplateId, templateArgs = templateArgs, promise = promise, requestUrl = requestUrl)
        }

        "send-friend" -> {
          runSendToFriends(
            templateType,
            receiverUuids.filterIsInstance<String>(),
            customTemplateId,
            templateArgs = templateArgs,
            promise = promise,
            requestUrl = requestUrl,
          )
        }

        else -> {
          promise.rejectWith(RNCKakaoUnknownException("Unknown sendType for scrap messages: $sendType"))
        }
      }
    } else {
      shareOrSendDefaultTemplate(
        sendType,
        templateType,
        templateJson,
        receiverUuids = receiverUuids.filterIsInstance<String>(),
        useWebBrowserIfKakaoTalkNotAvailable,
        serverCallbackArgs,
        pickerSettings,
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
    pickerSettings: ReadableMap?,
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
        pickerSettings,
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
    pickerSettings: ReadableMap?,
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
        pickerSettings,
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
    requestUrl: String? = null,
  ) {
    val callback = { e: Throwable? ->
      if (e != null) {
        promise.rejectWith(e)
      } else {
        promise.resolve(null)
      }
    }
    if (requestUrl != null) {
      TalkApiClient.instance.sendScrapMemo(requestUrl, templateId?.toLong(), templateArgs?.toStringMap(), callback)
    } else if (templateId != null) {
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
    requestUrl: String? = null,
  ) {
    val callback = { messageSendResult: MessageSendResult?, e: Throwable? ->
      if (e != null) {
        promise.rejectWith(e)
      } else if (messageSendResult == null) {
        promise.rejectWith(RNCKakaoResponseNotFoundException("messageSendResult"))
      } else {
        promise.resolve(
          argMap().apply {
            putArray("successfulReceiverUuids", argArr().pushStringList(messageSendResult.successfulReceiverUuids ?: listOf()))
            putArray(
              "failureInfos",
              argArr().apply {
                messageSendResult.failureInfos?.forEach { failure ->
                  pushMap(
                    argMap().apply {
                      putInt("code", failure.code)
                      putString("msg", failure.msg)
                      putArray("receiverUuids", argArr().pushStringList(failure.receiverUuids))
                    },
                  )
                }
              },
            )
          },
        )
      }
    }
    if (requestUrl != null) {
      TalkApiClient.instance.sendScrapMessage(receiverUuids, requestUrl, templateId?.toLong(), templateArgs?.toStringMap(), callback)
    } else if (templateId != null) {
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
    pickerSettings: ReadableMap?,
    promise: Promise,
    requestUrl: String? = null,
  ) {
    val context = reactApplicationContext.currentActivity
    if (context == null) {
      promise.rejectWith(ActivityNotFoundException())
      return
    }

    val callback = { sharingResult: SharingResult?, error: Throwable? ->
      if (error != null) {
        promise.rejectWith(error)
      } else if (sharingResult != null) {
        context.startActivity(sharingResult.intent)
        promise.resolve(null)
      } else {
        promise.rejectWith(RNCKakaoResponseNotFoundException("sharingResult"))
      }
    }

    if (ShareClient.instance.isKakaoTalkSharingAvailable(context)) {
      val pickerType = pickerSettings?.takeIf { it.hasKey("type") }?.getString("type")
      val shareType = ShareType.entries.firstOrNull { it.value == pickerType }
      val limit = pickerSettings?.takeIf { it.hasKey("limit") }?.getDouble("limit")?.toInt()
      if (requestUrl != null) {
        ShareClient.instance.shareScrap(
          context,
          requestUrl,
          templateId = templateId?.toLong(),
          templateArgs = templateArgs?.toStringMap(),
          serverCallbackArgs = serverCallbackArgs?.toStringMap(),
          shareType = shareType,
          limit = limit,
          callback = callback,
        )
      } else if (templateId != null) {
        ShareClient.instance.shareCustom(
          context,
          templateId.toLong(),
          templateArgs = templateArgs?.toStringMap(),
          serverCallbackArgs = serverCallbackArgs?.toStringMap(),
          shareType = shareType,
          limit = limit,
          callback = callback,
        )
      } else if (defaultTemplate != null) {
        runCatching {
          ShareClient.instance.shareDefault(
            context,
            RNCKakaoShareTemplates.createDefaultTemplate(defaultTemplate, templateType),
            serverCallbackArgs = serverCallbackArgs?.toStringMap(),
            shareType = shareType,
            limit = limit,
            callback = callback,
          )
        }.onFailure {
          promise.rejectWith(it)
        }
      }
    } else if (useWebBrowserIfKakaoTalkNotAvailable) {
      runCatching {
        val sharerUrl =
          if (requestUrl != null) {
            WebSharerClient.instance.makeScrapUrl(
              requestUrl,
              templateId = templateId?.toLong(),
              templateArgs = templateArgs?.toStringMap(),
              serverCallbackArgs = serverCallbackArgs?.toStringMap(),
            )
          } else if (templateId != null) {
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
          promise.resolve(null)
          return
        } catch (_: UnsupportedOperationException) {
        }
        try {
          KakaoCustomTabsClient.open(context, sharerUrl)
          promise.resolve(null)
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
