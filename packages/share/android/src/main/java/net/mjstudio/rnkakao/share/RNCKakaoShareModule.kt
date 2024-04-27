package net.mjstudio.rnkakao.share

import android.content.ActivityNotFoundException
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.kakao.sdk.common.util.KakaoCustomTabsClient
import com.kakao.sdk.share.ShareClient
import com.kakao.sdk.share.WebSharerClient
import com.kakao.sdk.share.model.SharingResult
import com.kakao.sdk.template.model.DefaultTemplate
import net.mjstudio.rnkakao.core.util.RNCKakaoUnknownException
import net.mjstudio.rnkakao.core.util.onMain
import net.mjstudio.rnkakao.core.util.rejectWith
import net.mjstudio.rnkakao.core.util.toStringMap

class RNCKakaoShareModule internal constructor(context: ReactApplicationContext) :
  KakaoShareSpec(context) {
    override fun getName(): String {
      return NAME
    }

    @ReactMethod
    override fun shareCustom(
      templateId: Double,
      useWebBrowserIfKakaoTalkNotAvailable: Boolean,
      templateArgs: ReadableMap?,
      serverCallbackArgs: ReadableMap?,
      promise: Promise,
    ) = onMain {
      runShare(
        templateId = templateId,
        useWebBrowserIfKakaoTalkNotAvailable = useWebBrowserIfKakaoTalkNotAvailable,
        templateArgs = templateArgs,
        serverCallbackArgs = serverCallbackArgs,
        promise = promise,
      )
    }

    @ReactMethod
    override fun shareFeedTemplate(
      value: ReadableMap,
      useWebBrowserIfKakaoTalkNotAvailable: Boolean,
      serverCallbackArgs: ReadableMap?,
      promise: Promise,
    ) = onMain {
      runShare(
        defaultTemplate = RNCKakaoShareTemplates.createFeedTemplate(value),
        useWebBrowserIfKakaoTalkNotAvailable = useWebBrowserIfKakaoTalkNotAvailable,
        serverCallbackArgs = serverCallbackArgs,
        promise = promise,
      )
    }

    @ReactMethod
    override fun shareListTemplate(
      value: ReadableMap,
      useWebBrowserIfKakaoTalkNotAvailable: Boolean,
      serverCallbackArgs: ReadableMap?,
      promise: Promise,
    ) = onMain {
      runShare(
        defaultTemplate = RNCKakaoShareTemplates.createListTemplate(value),
        useWebBrowserIfKakaoTalkNotAvailable = useWebBrowserIfKakaoTalkNotAvailable,
        serverCallbackArgs = serverCallbackArgs,
        promise = promise,
      )
    }

    @ReactMethod
    override fun shareLocationTemplate(
      value: ReadableMap,
      useWebBrowserIfKakaoTalkNotAvailable: Boolean,
      serverCallbackArgs: ReadableMap?,
      promise: Promise,
    ) = onMain {
      runShare(
        defaultTemplate = RNCKakaoShareTemplates.createLocationTemplate(value),
        useWebBrowserIfKakaoTalkNotAvailable = useWebBrowserIfKakaoTalkNotAvailable,
        serverCallbackArgs = serverCallbackArgs,
        promise = promise,
      )
    }

    @ReactMethod
    override fun shareCommerceTemplate(
      value: ReadableMap,
      useWebBrowserIfKakaoTalkNotAvailable: Boolean,
      serverCallbackArgs: ReadableMap?,
      promise: Promise,
    ) = onMain {
      runShare(
        defaultTemplate = RNCKakaoShareTemplates.createCommerceTemplate(value),
        useWebBrowserIfKakaoTalkNotAvailable = useWebBrowserIfKakaoTalkNotAvailable,
        serverCallbackArgs = serverCallbackArgs,
        promise = promise,
      )
    }

    @ReactMethod
    override fun shareTextTemplate(
      value: ReadableMap,
      useWebBrowserIfKakaoTalkNotAvailable: Boolean,
      serverCallbackArgs: ReadableMap?,
      promise: Promise,
    ) = onMain {
      runShare(
        defaultTemplate = RNCKakaoShareTemplates.createTextTemplate(value),
        useWebBrowserIfKakaoTalkNotAvailable = useWebBrowserIfKakaoTalkNotAvailable,
        serverCallbackArgs = serverCallbackArgs,
        promise = promise,
      )
    }

    @ReactMethod
    override fun shareCalendarTemplate(
      value: ReadableMap,
      useWebBrowserIfKakaoTalkNotAvailable: Boolean,
      serverCallbackArgs: ReadableMap?,
      promise: Promise,
    ) = onMain {
      runShare(
        defaultTemplate = RNCKakaoShareTemplates.createCalendarTemplate(value),
        useWebBrowserIfKakaoTalkNotAvailable = useWebBrowserIfKakaoTalkNotAvailable,
        serverCallbackArgs = serverCallbackArgs,
        promise = promise,
      )
    }

    private fun runShare(
      templateId: Double? = null,
      defaultTemplate: DefaultTemplate? = null,
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
          ShareClient.instance.shareDefault(
            context,
            defaultTemplate,
            serverCallbackArgs = serverCallbackArgs?.toStringMap(),
            callback = callback,
          )
        }
      } else if (useWebBrowserIfKakaoTalkNotAvailable) {
        val sharerUrl =
          if (templateId != null) {
            WebSharerClient.instance.makeCustomUrl(
              templateId.toLong(),
              templateArgs = templateArgs?.toStringMap(),
              serverCallbackArgs = serverCallbackArgs?.toStringMap(),
            )
          } else if (defaultTemplate != null) {
            WebSharerClient.instance.makeDefaultUrl(
              defaultTemplate,
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
      } else {
        promise.rejectWith(RNCKakaoUnknownException("kakaotalk not available"))
      }
    }

    companion object {
      const val NAME = "RNCKakaoShare"
    }
  }
