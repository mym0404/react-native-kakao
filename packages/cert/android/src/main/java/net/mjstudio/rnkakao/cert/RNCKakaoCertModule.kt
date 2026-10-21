package net.mjstudio.rnkakao.cert

import android.content.ActivityNotFoundException
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.kakao.sdk.auth.AuthCodeClient
import com.kakao.sdk.auth.model.CertTokenInfo
import com.kakao.sdk.auth.model.CertType
import com.kakao.sdk.auth.model.IdentifyItem
import com.kakao.sdk.auth.model.OAuthToken
import com.kakao.sdk.auth.model.Prompt
import com.kakao.sdk.cert.CertApiClient
import com.kakao.sdk.cert.model.SessionInfo
import net.mjstudio.rnkakao.core.util.RNCKakaoResponseNotFoundException
import net.mjstudio.rnkakao.core.util.RNCKakaoUnsupportedPlatformException
import net.mjstudio.rnkakao.core.util.argArr
import net.mjstudio.rnkakao.core.util.argMap
import net.mjstudio.rnkakao.core.util.filterIsInstance
import net.mjstudio.rnkakao.core.util.getIntElseNull
import net.mjstudio.rnkakao.core.util.onMain
import net.mjstudio.rnkakao.core.util.pushStringList
import net.mjstudio.rnkakao.core.util.putD
import net.mjstudio.rnkakao.core.util.putL
import net.mjstudio.rnkakao.core.util.rejectWith
import net.mjstudio.rnkakao.core.util.unix
import java.util.Date

private const val TX_ID = "txId"
private const val MILLISECONDS_PER_SECOND = 1000.0

class RNCKakaoCertModule internal constructor(
  context: ReactApplicationContext,
) : NativeKakaoCertSpec(context) {
  @ReactMethod
  override fun certLoginWithKakaoTalk(
    options: ReadableMap,
    promise: Promise,
  ) = login(options, true, promise)

  @ReactMethod
  override fun certLoginWithKakaoAccount(
    options: ReadableMap,
    promise: Promise,
  ) = login(options, false, promise)

  @ReactMethod
  override fun issueCertTokenWithCode(
    code: String,
    codeVerifier: String?,
    redirectUri: String?,
    promise: Promise,
  ) {
    promise.rejectWith(RNCKakaoUnsupportedPlatformException("issueCertTokenWithCode", "iOS"))
  }

  private fun login(
    options: ReadableMap,
    isTalk: Boolean,
    promise: Promise,
  ) = withCert(promise) { client ->
    val activity =
      reactApplicationContext.currentActivity ?: run {
        promise.rejectWith(ActivityNotFoundException())
        return@withCert
      }
    val certType = CertType.valueOf(requireNotNull(options.getString("certType")))
    val prompts =
      options
        .getArray("prompts")
        ?.filterIsInstance<String>()
        ?.map {
          when (it) {
            "Login" -> Prompt.LOGIN
            "Create" -> Prompt.CREATE
            "SelectAccount" -> Prompt.SELECT_ACCOUNT
            else -> throw IllegalArgumentException("Unsupported certification prompt: $it")
          }
        }?.ifEmpty { null }
    val identifyItems =
      options
        .getArray("identifyItems")
        ?.filterIsInstance<String>()
        ?.map {
          when (it) {
            "ci" -> IdentifyItem.CI
            "name" -> IdentifyItem.NAME
            "birthday" -> IdentifyItem.BIRTHDAY
            "phone_number" -> IdentifyItem.PHONE_NUMBER
            else -> throw IllegalArgumentException("Unsupported signer information: $it")
          }
        }?.ifEmpty { null }
    val signData = options.getString("signData")
    val settleId = options.getString("settleId")
    val nonce = options.getString("nonce")
    val android = options.getMap("android")
    val channelOptions = if (isTalk) options else android
    val channelPublicIds = channelOptions?.getArray("channelPublicIds")?.filterIsInstance<String>()?.ifEmpty { null }
    val serviceTerms = channelOptions?.getArray("serviceTerms")?.filterIsInstance<String>()?.ifEmpty { null }
    val callback: (CertTokenInfo?, Throwable?) -> Unit = { info, error ->
      if (error != null) {
        promise.rejectWith(error)
      } else if (info == null) {
        promise.rejectWith(RNCKakaoResponseNotFoundException("certTokenInfo"))
      } else {
        promise.resolve(
          argMap().apply {
            putString(TX_ID, info.txId)
            putMap("token", mapToken(info.token))
          },
        )
      }
    }
    if (isTalk) {
      client.certLoginWithKakaoTalk(
        context = activity,
        certType = certType,
        signData = signData,
        settleId = settleId,
        txId = options.getString(TX_ID),
        prompts = prompts,
        identifyItems = identifyItems,
        requestCode = android?.getIntElseNull("requestCode") ?: AuthCodeClient.DEFAULT_REQUEST_CODE,
        nonce = nonce,
        channelPublicIds = channelPublicIds,
        serviceTerms = serviceTerms,
        callback = callback,
      )
    } else {
      client.certLoginWithKakaoAccount(
        context = activity,
        certType = certType,
        prompts = prompts,
        identifyItems = identifyItems,
        signData = signData,
        settleId = settleId,
        nonce = nonce,
        loginHint = options.getString("loginHint"),
        channelPublicIds = channelPublicIds,
        serviceTerms = serviceTerms,
        callback = callback,
      )
    }
  }

  @ReactMethod
  override fun publicKey(
    certType: String,
    promise: Promise,
  ) = withCert(promise) {
    promise.resolve(it.publicKey(CertType.valueOf(certType)))
  }

  @ReactMethod
  override fun sessionInfo(
    certType: String,
    promise: Promise,
  ) = withCert(promise) {
    promise.resolve(it.sessionInfo(CertType.valueOf(certType))?.let(::mapSession))
  }

  @ReactMethod
  override fun fetchSessionInfo(
    certType: String,
    txId: String,
    promise: Promise,
  ) = withCert(promise) {
    it.sessionInfo(CertType.valueOf(certType), txId, sessionCallback(promise))
  }

  @ReactMethod
  override fun fetchSessionInfoByAppKey(
    certType: String,
    txId: String,
    targetAppKey: String?,
    promise: Promise,
  ) = withCert(promise) {
    it.sessionInfoByAppKey(CertType.valueOf(certType), txId, targetAppKey, sessionCallback(promise))
  }

  @ReactMethod
  override fun isValidSession(
    certType: String,
    promise: Promise,
  ) = withCert(promise) {
    promise.resolve(it.isValidSession(CertType.valueOf(certType)))
  }

  @ReactMethod
  override fun deleteKeyPair(
    certType: String,
    promise: Promise,
  ) = withCert(promise) {
    it.deleteKeyPair(CertType.valueOf(certType))
    promise.resolve(null)
  }

  @ReactMethod
  override fun reducedSign(
    certType: String,
    data: String,
    promise: Promise,
  ) = withCert(promise) {
    it.reducedSign(CertType.valueOf(certType), data) { signature, error ->
      if (error != null) {
        promise.rejectWith(error)
      } else if (signature == null) {
        promise.rejectWith(RNCKakaoResponseNotFoundException("signature"))
      } else {
        promise.resolve(signature)
      }
    }
  }

  @ReactMethod
  override fun isKakaoTalkSignAvailable(promise: Promise) =
    withCert(promise) {
      promise.resolve(it.isKakaoTalkSignAvailable(reactApplicationContext))
    }

  @ReactMethod
  override fun signWithKakaoTalk(
    txId: String,
    targetAppKey: String?,
    promise: Promise,
  ) = withCert(promise) {
    val activity =
      reactApplicationContext.currentActivity ?: run {
        promise.rejectWith(ActivityNotFoundException())
        return@withCert
      }
    it.signWithKakaoTalk(activity, CertType.K3220, txId, targetAppKey) { status, error ->
      if (error != null) {
        promise.rejectWith(error)
      } else if (status == null) {
        promise.rejectWith(RNCKakaoResponseNotFoundException("signStatusInfo"))
      } else {
        promise.resolve(
          argMap().apply {
            putString(TX_ID, status.txId)
            putD("requestedAt", status.requestedAt?.time?.div(MILLISECONDS_PER_SECOND))
            putD("requestExpiredAt", status.requestExpiredAt?.time?.div(MILLISECONDS_PER_SECOND))
            putD("signedAt", status.signedAt?.time?.div(MILLISECONDS_PER_SECOND))
          },
        )
      }
    }
  }

  private fun withCert(
    promise: Promise,
    operation: (CertApiClient) -> Unit,
  ) = onMain {
    try {
      operation(CertApiClient.instance)
    } catch (error: Exception) {
      promise.rejectWith(error)
    }
  }

  private fun sessionCallback(promise: Promise): (SessionInfo?, Throwable?) -> Unit =
    { info, error ->
      if (error != null) {
        promise.rejectWith(error)
      } else if (info == null) {
        promise.rejectWith(RNCKakaoResponseNotFoundException("sessionInfo"))
      } else {
        promise.resolve(mapSession(info))
      }
    }

  private fun mapSession(info: SessionInfo) =
    argMap().apply {
      putL("userId", info.userId)
      putDouble("sessionStartAt", info.sessionStartAt.time / MILLISECONDS_PER_SECOND)
      putDouble("sessionEndAt", info.sessionEndAt.time / MILLISECONDS_PER_SECOND)
    }

  private fun mapToken(token: OAuthToken) =
    argMap().apply {
      putString("accessToken", token.accessToken)
      putString("refreshToken", token.refreshToken)
      token.idToken?.let { putString("idToken", it) }
      putDouble("accessTokenExpiresAt", token.accessTokenExpiresAt.unix.toDouble())
      putDouble("refreshTokenExpiresAt", token.refreshTokenExpiresAt.unix.toDouble())
      val now = Date().time
      putDouble("accessTokenExpiresIn", (token.accessTokenExpiresAt.time - now) / MILLISECONDS_PER_SECOND)
      putDouble("refreshTokenExpiresIn", (token.refreshTokenExpiresAt.time - now) / MILLISECONDS_PER_SECOND)
      putArray("scopes", argArr().pushStringList(token.scopes.orEmpty()))
    }
}
