package net.mjstudio.rnkakao.user

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.kakao.sdk.auth.AuthApiClient
import com.kakao.sdk.auth.model.OAuthToken
import com.kakao.sdk.auth.model.Prompt.CERT
import com.kakao.sdk.auth.model.Prompt.CREATE
import com.kakao.sdk.auth.model.Prompt.LOGIN
import com.kakao.sdk.auth.model.Prompt.SELECT_ACCOUNT
import com.kakao.sdk.auth.model.Prompt.UNIFY_DAUM
import com.kakao.sdk.common.model.KakaoSdkError
import com.kakao.sdk.user.UserApiClient
import net.mjstudio.rnkakao.core.util.RNCKakaoUtil
import net.mjstudio.rnkakao.core.util.argArr
import net.mjstudio.rnkakao.core.util.argMap
import net.mjstudio.rnkakao.core.util.filterIsInstance
import net.mjstudio.rnkakao.core.util.pushMapList
import net.mjstudio.rnkakao.core.util.pushStringList
import net.mjstudio.rnkakao.core.util.putBooleanIfNotNull
import net.mjstudio.rnkakao.core.util.putDoubleIfNotNull
import net.mjstudio.rnkakao.core.util.putIntIfNotNull
import net.mjstudio.rnkakao.core.util.rejectWith
import java.util.*

class RNCKakaoUserModule internal constructor(context: ReactApplicationContext) :
    KakaoUserSpec(context) {

    override fun getName(): String {
        return NAME
    }

    @ReactMethod
    override fun login(
        serviceTerms: ReadableArray?,
        prompts: ReadableArray?,
        useKakaoAccountLogin: Boolean,
        scopes: ReadableArray?,
        promise: Promise
    ) {
        val callback: (OAuthToken?, Throwable?) -> Unit = { token, error ->
            if (error != null) {
                promise.rejectWith(error)
            } else if (token == null) {
                promise.rejectWith("token not found")
            } else {
                promise.resolve(argMap().apply {
                    putString("accessToken", token.accessToken)
                    putString("refreshToken", token.refreshToken)
                    putString("tokenType", null)
                    putString("idToken", token.idToken)
                    putDouble(
                        "accessTokenExpiresAt", token.accessTokenExpiresAt.time.toDouble()
                    )
                    putDouble(
                        "refreshTokenExpiresAt", token.refreshTokenExpiresAt.time.toDouble()
                    )
                    putDouble(
                        "accessTokenExpiresIn",
                        RNCKakaoUtil.diffSec(token.accessTokenExpiresAt, Date()).toDouble()
                    )
                    putDouble(
                        "refreshTokenExpiresIn",
                        RNCKakaoUtil.diffSec(token.refreshTokenExpiresAt, Date()).toDouble()
                    )
                    putArray("scopes", argArr().apply {
                        pushStringList(token.scopes ?: listOf())
                    })
                })
            }
        }

        if (scopes?.filterIsInstance<String>()?.isEmpty() == false) {
            UserApiClient.instance.loginWithNewScopes(
                reactApplicationContext,
                scopes = scopes.filterIsInstance<String>(),
                callback = callback
            )
        } else if (UserApiClient.instance.isKakaoTalkLoginAvailable(reactApplicationContext) && !useKakaoAccountLogin && scopes?.filterIsInstance<String>()
                ?.isEmpty() == true
        ) {
            UserApiClient.instance.loginWithKakaoTalk(
                reactApplicationContext,
                serviceTerms = serviceTerms?.filterIsInstance<String>()?.ifEmpty { null },
                callback = callback
            )
        } else {
            UserApiClient.instance.loginWithKakaoAccount(
                reactApplicationContext,
                prompts = prompts?.filterIsInstance<String>()?.mapNotNull {
                    when (it) {
                        "Login" -> LOGIN
                        "Create" -> CREATE
                        "Cert" -> CERT
                        "UnifyDaum" -> UNIFY_DAUM
                        "SelectAccount" -> SELECT_ACCOUNT
                        else -> null
                    }
                }?.ifEmpty { null },
                serviceTerms = serviceTerms?.filterIsInstance<String>()?.ifEmpty { null },
                callback = callback
            )
        }
    }

    @ReactMethod
    override fun isKakaoTalkLoginAvailable(promise: Promise) {
        promise.resolve(UserApiClient.instance.isKakaoTalkLoginAvailable(reactApplicationContext))
    }

    @ReactMethod
    override fun logout(promise: Promise) {
        UserApiClient.instance.logout {
            if (it != null) {
                promise.rejectWith(it)
            } else {
                promise.resolve(42)
            }
        }
    }

    @ReactMethod
    override fun unlink(promise: Promise) {
        UserApiClient.instance.unlink {
            if (it != null) {
                promise.rejectWith(it)
            } else {
                promise.resolve(42)
            }
        }
    }

    @ReactMethod
    override fun isLogined(promise: Promise) {
        if (AuthApiClient.instance.hasToken()) {
            UserApiClient.instance.accessTokenInfo { _, error ->
                if (error != null) {
                    if (error is KakaoSdkError && error.isInvalidTokenError()) {
                        promise.resolve(false)
                    } else {
                        promise.rejectWith(error)
                    }
                } else {
                    promise.resolve(true)
                }
            }
        } else {
            promise.resolve(false)
        }
    }

    @ReactMethod
    override fun scopes(scopes: ReadableArray?, promise: Promise) {
        UserApiClient.instance.scopes { scopeInfo, error ->
            if (error != null) {
                promise.rejectWith(error)
            } else if (scopeInfo?.scopes == null) {
                promise.rejectWith("scopes not found")
            } else {
                promise.resolve(argArr().also { arr ->
                    scopeInfo.scopes!!.forEach { scope ->
                        arr.pushMap(argMap().also { map ->
                            map.putString("id", scope.id)
                            map.putString("displayName", scope.displayName)
                            map.putString("type", scope.type.name)
                            map.putBoolean("using", scope.using)
                            map.putBooleanIfNotNull("delegated", scope.delegated)
                            map.putBoolean("agreed", scope.agreed)
                            map.putBooleanIfNotNull("revocable", scope.revocable)
                        })
                    }
                })
            }
        }
    }

    @ReactMethod
    override fun revokeScopes(scopes: ReadableArray, promise: Promise) {
        UserApiClient.instance.revokeScopes(
            scopes = scopes.filterIsInstance<String>()
        ) { scopeInfo, error ->
            if (error != null) {
                promise.rejectWith(error)
            } else if (scopeInfo == null) {
                promise.rejectWith("scopeInfo not found")
            } else {
                promise.resolve(42)
            }
        }
    }

    @ReactMethod
    override fun serviceTerms(promise: Promise) {
        UserApiClient.instance.serviceTerms { serviceTerms, error ->
            if (error != null) {
                promise.rejectWith(error)
            } else if (serviceTerms?.serviceTerms == null) {
                promise.rejectWith("serviceTerms not found")
            } else {
                promise.resolve(argMap().apply {
                    putArray("allowedServiceTerms", argArr().apply {
                        serviceTerms.serviceTerms?.forEach { term ->
                            pushMap(argMap().apply {
                                putString("tag", term.tag)
                                putDoubleIfNotNull("agreedAt", term.agreedAt?.time?.toDouble())
                            })
                        }
                    })
                })
            }
        }
    }

    @ReactMethod
    override fun shippingAddresses(promise: Promise) {
        UserApiClient.instance.shippingAddresses { addrs, error ->
            if (error != null) {
                promise.rejectWith(error)
            } else if (addrs == null) {
                promise.rejectWith("shipping addresses not found")
            } else {
                promise.resolve(argMap().apply {
                    putIntIfNotNull("userId", addrs.userId?.toInt())
                    putBooleanIfNotNull("needsAgreement", addrs.needsAgreement)
                    putArray("shippingAddresses", argArr().apply {
                        pushMapList(addrs.shippingAddresses?.map { addr ->
                            argMap().apply {
                                putInt("id", addr.id.toInt())
                                putString("name", addr.name)
                                putBoolean("isDefault", addr.isDefault)
                                putDoubleIfNotNull("updatedAt", addr.updatedAt?.time?.toDouble())
                                putString("type", addr.type?.name)
                                putString("baseAddress", addr.baseAddress)
                                putString("detailAddress", addr.detailAddress)
                                putString("receiverName", addr.receiverName)
                                putString("receiverPhoneNumber1", addr.receiverPhoneNumber1)
                                putString("receiverPhoneNumber2", addr.receiverPhoneNumber2)
                                putString("zoneNumber", addr.zoneNumber)
                                putString("zipCode", addr.zipCode)
                            }
                        } ?: listOf())
                    })
                })
            }
        }
    }

    @ReactMethod
    override fun me(promise: Promise) {
        UserApiClient.instance.me { user, error ->
            if (error != null) {
                promise.rejectWith(error)
            } else if (user == null) {
                promise.rejectWith("user not found")
            } else {
                promise.resolve(argMap().apply {
                    putIntIfNotNull("id", user.id?.toInt())
                    putString("name", user.kakaoAccount?.name)

                    putString("email", user.kakaoAccount?.email)
                    putString("nickname", user.kakaoAccount?.profile?.nickname)
                    putString("profileImageUrl", user.kakaoAccount?.profile?.profileImageUrl)
                    putString("thumbnailImageUrl", user.kakaoAccount?.profile?.thumbnailImageUrl)
                    putString("phoneNumber", user.kakaoAccount?.phoneNumber)
                    putString("ageRange", user.kakaoAccount?.ageRange?.name)
                    putString("birthday", user.kakaoAccount?.birthday)
                    putString("birthdayType", user.kakaoAccount?.birthdayType?.name)
                    putString("birthyear", user.kakaoAccount?.birthyear)
                    putString("gender", user.kakaoAccount?.gender?.name)
                    putBooleanIfNotNull("isEmailValid", user.kakaoAccount?.isEmailValid)
                    putBooleanIfNotNull("isEmailVerified", user.kakaoAccount?.isEmailVerified)
                    putBooleanIfNotNull("isKorean", user.kakaoAccount?.isKorean)
                    putBooleanIfNotNull(
                        "ageRangeNeedsAgreement", user.kakaoAccount?.ageRangeNeedsAgreement
                    )
                    putBooleanIfNotNull(
                        "birthdayNeedsAgreement", user.kakaoAccount?.birthdayNeedsAgreement
                    )
                    putBooleanIfNotNull(
                        "birthyearNeedsAgreement", user.kakaoAccount?.birthyearNeedsAgreement
                    )
                    putBooleanIfNotNull(
                        "emailNeedsAgreement", user.kakaoAccount?.emailNeedsAgreement
                    )
                    putBooleanIfNotNull(
                        "genderNeedsAgreement", user.kakaoAccount?.genderNeedsAgreement
                    )
                    putBooleanIfNotNull(
                        "isKoreanNeedsAgreement", user.kakaoAccount?.isKoreanNeedsAgreement
                    )
                    putBooleanIfNotNull(
                        "phoneNumberNeedsAgreement", user.kakaoAccount?.phoneNumberNeedsAgreement
                    )
                    putBooleanIfNotNull(
                        "profileNeedsAgreement", user.kakaoAccount?.profileNeedsAgreement
                    )
                    putBooleanIfNotNull(
                        "ciNeedsAgreement", user.kakaoAccount?.ciNeedsAgreement
                    )
                    putBooleanIfNotNull(
                        "nameNeedsAgreement", user.kakaoAccount?.nameNeedsAgreement
                    )
                    putBooleanIfNotNull(
                        "profileImageNeedsAgreement", user.kakaoAccount?.profileImageNeedsAgreement
                    )
                    putBooleanIfNotNull(
                        "profileNicknameNeedsAgreement",
                        user.kakaoAccount?.profileNicknameNeedsAgreement
                    )
                    putBooleanIfNotNull(
                        "legalBirthDateNeedsAgreement",
                        user.kakaoAccount?.legalBirthDateNeedsAgreement
                    )
                })
            }
        }
    }

    companion object {
        const val NAME = "RNCKakaoUser"
    }
}
