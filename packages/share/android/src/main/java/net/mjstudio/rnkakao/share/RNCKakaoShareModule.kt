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

    //    @ReactMethod
    //    fun shareFeed(serverCallbackArgs: ReadableMap?, promise: Promise) {
    //        val context = currentActivity
    //        if (context == null) {
    //            promise.rejectWith(ActivityNotFoundException())
    //            return
    //        }
    //        ShareClient.instance.shareDefault(context, serverCallbackArgs = serverCallbackArgs) {
    //
    //        }
    //    }

    private fun runShare(
        templateId: Double? = null,
        defaultTemplate: DefaultTemplate? = null,
        useWebBrowserIfKakaoTalkNotAvailable: Boolean,
        templateArgs: ReadableMap?,
        serverCallbackArgs: ReadableMap?,
        promise: Promise,
    ) {
        val context = currentActivity
        if (context == null) {
            promise.rejectWith(ActivityNotFoundException())
            return
        }

        if (ShareClient.instance.isKakaoTalkSharingAvailable(context)) {
            val callback = { sharingResult: SharingResult?, error: Throwable? ->
                if (error != null) {
                    promise.rejectWith(error)
                } else if (sharingResult != null) {
                    context.startActivity(sharingResult.intent)
                    promise.resolve(42)
                }
            }

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
            val sharerUrl = if (templateId != null) WebSharerClient.instance.makeCustomUrl(
                templateId.toLong(),
                templateArgs = templateArgs?.toStringMap(),
                serverCallbackArgs = serverCallbackArgs?.toStringMap()
            ) else if (defaultTemplate != null) WebSharerClient.instance.makeDefaultUrl(
                defaultTemplate, serverCallbackArgs = serverCallbackArgs?.toStringMap()
            ) else run {
                promise.rejectWith("one of templateId or template shouldn't be null")
                return
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

            promise.rejectWith("web url open failed $sharerUrl")
        } else {
            promise.rejectWith("kakaotalk not available")
        }
    }

    companion object {
        const val NAME = "RNCKakaoShare"
    }
}
