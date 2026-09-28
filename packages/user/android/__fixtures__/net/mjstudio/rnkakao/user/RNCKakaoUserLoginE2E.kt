package net.mjstudio.rnkakao.user

import com.kakao.sdk.auth.model.OAuthToken
import com.kakao.sdk.auth.model.Prompt
import com.kakao.sdk.auth.model.Prompt.LOGIN
import com.kakao.sdk.common.model.ClientError
import com.kakao.sdk.common.model.ClientErrorCause
import java.util.Date

private const val TALK_ERROR_ACCOUNT_SUCCESS = "rnkakao-e2e:talk-error-account-success"
private const val TALK_CANCEL = "rnkakao-e2e:talk-cancel"
private const val TALK_CONSENT_CANCEL = "rnkakao-e2e:talk-consent-cancel"
private const val TALK_ERROR_ACCOUNT_ERROR = "rnkakao-e2e:talk-error-account-error"
private const val DIRECT_ACCOUNT = "rnkakao-e2e:direct-account"
private const val TALK_SUCCESS = "rnkakao-e2e:talk-success"
private const val ACCOUNT_ACCESS_TOKEN = "e2e-account"
private const val UNEXPECTED_ACCOUNT_OPTIONS = "E2E_UNEXPECTED_ACCOUNT_OPTIONS"

private val scenarios =
  setOf(
    TALK_ERROR_ACCOUNT_SUCCESS,
    TALK_CANCEL,
    TALK_CONSENT_CANCEL,
    TALK_ERROR_ACCOUNT_ERROR,
    DIRECT_ACCOUNT,
    TALK_SUCCESS,
  )

private val expectedServiceTerms = listOf("e2e-term")

internal class RNCKakaoUserLoginE2E(
  private val scenario: String,
) : RNCKakaoUserLoginE2EContract {
  init {
    require(scenario in scenarios)
  }

  override fun isKakaoTalkLoginAvailable() = true

  override fun loginWithKakaoTalk(
    nonce: String?,
    serviceTerms: List<String>?,
    callback: (OAuthToken?, Throwable?) -> Unit,
  ) {
    if (nonce != scenario || serviceTerms != expectedServiceTerms) {
      callback(null, ClientError(ClientErrorCause.BadParameter, "E2E_UNEXPECTED_TALK_OPTIONS"))
      return
    }

    when (scenario) {
      TALK_ERROR_ACCOUNT_SUCCESS, TALK_ERROR_ACCOUNT_ERROR -> {
        callback(null, ClientError(ClientErrorCause.Unknown, "E2E_TALK_FAILED"))
      }

      TALK_CANCEL, TALK_CONSENT_CANCEL -> {
        callback(null, ClientError(ClientErrorCause.Cancelled, "E2E_TALK_CANCELLED"))
      }

      TALK_SUCCESS -> {
        callback(token("e2e-talk", nonce), null)
      }

      DIRECT_ACCOUNT -> {
        callback(null, ClientError(ClientErrorCause.IllegalState, "E2E_UNEXPECTED_TALK"))
      }
    }
  }

  override fun loginWithKakaoAccount(
    prompts: List<Prompt>?,
    nonce: String?,
    serviceTerms: List<String>?,
    callback: (OAuthToken?, Throwable?) -> Unit,
  ) {
    when (scenario) {
      TALK_ERROR_ACCOUNT_SUCCESS -> {
        if (nonce == scenario && serviceTerms == expectedServiceTerms) {
          callback(token(ACCOUNT_ACCESS_TOKEN, nonce), null)
        } else {
          callback(null, ClientError(ClientErrorCause.BadParameter, UNEXPECTED_ACCOUNT_OPTIONS))
        }
      }

      DIRECT_ACCOUNT -> {
        if (nonce == scenario && prompts == listOf(LOGIN) && serviceTerms == expectedServiceTerms) {
          callback(token(ACCOUNT_ACCESS_TOKEN, nonce), null)
        } else {
          callback(null, ClientError(ClientErrorCause.BadParameter, UNEXPECTED_ACCOUNT_OPTIONS))
        }
      }

      TALK_ERROR_ACCOUNT_ERROR -> {
        if (nonce == scenario && serviceTerms == expectedServiceTerms) {
          callback(null, ClientError(ClientErrorCause.Unknown, "E2E_ACCOUNT_FAILED"))
        } else {
          callback(null, ClientError(ClientErrorCause.BadParameter, UNEXPECTED_ACCOUNT_OPTIONS))
        }
      }

      TALK_CANCEL, TALK_CONSENT_CANCEL, TALK_SUCCESS -> {
        callback(null, ClientError(ClientErrorCause.IllegalState, "E2E_UNEXPECTED_ACCOUNT"))
      }
    }
  }

  private fun token(
    accessToken: String,
    nonce: String?,
  ): OAuthToken {
    val now = Date().time

    return OAuthToken(
      accessToken = accessToken,
      accessTokenExpiresAt = Date(now + 60_000),
      refreshToken = "e2e-refresh",
      refreshTokenExpiresAt = Date(now + 120_000),
      idToken = nonce,
      scopes = listOf(),
    )
  }
}
