package net.mjstudio.rnkakao.share

import android.content.ActivityNotFoundException
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.kakao.sdk.common.util.KakaoCustomTabsClient
import com.kakao.sdk.share.ShareClient
import com.kakao.sdk.share.WebSharerClient
import net.mjstudio.rnkakao.core.util.rejectWith

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
    ) {
        val context = currentActivity
        if (context == null) {
            promise.rejectWith(ActivityNotFoundException())
            return
        }
        if (ShareClient.instance.isKakaoTalkSharingAvailable(context)) {
            ShareClient.instance.shareCustom(context, templateId.toLong()) { sharingResult, error ->
                if (error != null) {
                    promise.rejectWith(error)
                } else if (sharingResult != null) {
                    context.startActivity(sharingResult.intent)
                    promise.resolve(42)
                }
            }
        } else if (useWebBrowserIfKakaoTalkNotAvailable) {
            val sharerUrl = WebSharerClient.instance.makeCustomUrl(templateId.toLong())

            // CustomTabs으로 웹 브라우저 열기

            // 1. CustomTabsServiceConnection 지원 브라우저 열기
            // ex) Chrome, 삼성 인터넷, FireFox, 웨일 등
            try {
                KakaoCustomTabsClient.openWithDefault(context, sharerUrl)
                promise.resolve(42)
                return
            } catch (e: UnsupportedOperationException) { // CustomTabsServiceConnection 지원 브라우저가 없을 때 예외처리
            }

            // 2. CustomTabsServiceConnection 미지원 브라우저 열기
            // ex) 다음, 네이버 등
            try {
                KakaoCustomTabsClient.open(context, sharerUrl)
                promise.resolve(42)
                return
            } catch (e: ActivityNotFoundException) { // 디바이스에 설치된 인터넷 브라우저가 없을 때 예외처리
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
