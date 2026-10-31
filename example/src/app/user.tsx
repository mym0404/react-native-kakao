import { useState } from 'react';
import { Platform } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { formatJson } from '@mj-studio/js-util';
import { useMount } from '@mj-studio/react-util';
import {
  getAccessToken,
  hasToken,
  isKakaoTalkLoginAvailable,
  isLogined,
  issueAccessTokenWithCode,
  type KakaoLoginToken,
  login,
  loginWithKakao,
  logout,
  me,
  refreshToken,
  revokeServiceTerms,
  scopes,
  selectShippingAddress,
  serviceTerms,
  shippingAddresses,
  signup,
  unlink,
  updateProfile,
} from '@react-native-kakao/user';

import { Btn } from '../component/Btn';
import { E2EApiAction } from '../component/E2EApiAction';
import { PrettyResult } from '../component/PrettyResult';
import { StyledScrollView } from '../component/StyledScrollView';
import { Txt } from '../component/Txt';
import { px } from '../util/px';

const buttonMinWidth = px(240);
const allServiceTermsResult = 'app_service_terms';
const profileVerificationKey = 'rn_kakao_verification';
const tokenVerificationLifetimeSeconds = 3600;
const testServiceTermTag = 'rnc_example_optional_service_term';

function getTokenSummary(token: KakaoLoginToken) {
  return {
    hasAccessToken: token.accessToken.length > 0,
    hasRefreshToken: token.refreshToken.length > 0,
    accessTokenExpiresIn: token.accessTokenExpiresIn,
    refreshTokenExpiresIn: token.refreshTokenExpiresIn,
    scopeCount: token.scopes.length,
  };
}

async function getProfileImageProtocols(secureResource: boolean) {
  const user = await me({ secureResource });
  const urls = [user.profileImageUrl, user.thumbnailImageUrl].filter(
    (url): url is string => typeof url === 'string',
  );

  return { imageCount: urls.length, protocols: urls.map((url) => url.split('://')[0]) };
}

export default function Page() {
  const [isKakaoTalkEnable, setKakaoTalkEnable] = useState(false);
  const [result, setResult] = useState<object>();
  const [scopesResult, setScopesResult] = useState<object>();
  const [serviceTermsResult, setServiceTermsResult] = useState<object>();
  const [shippingResult, setShippingResult] = useState<object>();
  const [meResult, setMeResult] = useState<object>();

  useMount(() => {
    isKakaoTalkLoginAvailable().then(setKakaoTalkEnable);
  });

  return (
    <StyledScrollView flex={1} contentContainerSx={{ pb: 48, alignItems: 'center', px: 4, gap: 4 }}>
      <Txt>{`Kakao Talk Available: ${isKakaoTalkEnable}`}</Txt>
      <E2EApiAction
        id={'talk-available'}
        title={'Check Kakao Talk Availability'}
        action={isKakaoTalkLoginAvailable}
        onSuccess={setKakaoTalkEnable}
      />
      <Btn
        minW={buttonMinWidth}
        title={'Login'}
        onPress={() => {
          login({
            web: {
              redirectUri: 'http://localhost',
              prompt: ['select_account'],
            },
          })
            .then((ret) => {
              showMessage({
                type: 'success',
                message: 'Login Success',
              });
              setResult(ret);
            })
            .catch((e) =>
              showMessage({
                type: 'warning',
                message: e.message,
              }),
            );
        }}
      />
      <Btn
        minW={buttonMinWidth}
        title={'Log Out'}
        onPress={() => {
          logout()
            .then(() => {
              showMessage({
                type: 'success',
                message: 'Logout Success',
              });
            })
            .catch((e) =>
              showMessage({
                type: 'warning',
                message: e.message,
              }),
            );
        }}
      />
      {Platform.OS === 'web' ? null : (
        <>
          <E2EApiAction
            id={'login-android-request-code'}
            title={'Login With Android Request Code'}
            action={async () => getTokenSummary(await login({ android: { requestCode: 20001 } }))}
          />
          <E2EApiAction
            id={'login-invalid-android-request-code'}
            title={'Reject Invalid Android Request Code'}
            action={async () =>
              getTokenSummary(await login({ android: { requestCode: 2147483648 } }))
            }
          />
          {(['auto', 'light', 'dark'] as const).map((uiMode) => (
            <E2EApiAction
              key={uiMode}
              id={`login-chooser-${uiMode}`}
              title={`Login Chooser (${uiMode})`}
              action={async () => getTokenSummary(await loginWithKakao({ uiMode }))}
            />
          ))}
          <E2EApiAction
            id={'refresh-token'}
            title={'Refresh Stored Token'}
            action={async () => getTokenSummary(await refreshToken())}
          />
        </>
      )}
      {[true, false].map((loggingEnabled) => (
        <E2EApiAction
          key={String(loggingEnabled)}
          id={loggingEnabled ? 'token-refresh-explicit' : 'token-refresh-no-ios-logs'}
          title={
            loggingEnabled
              ? 'Refresh Invalid External Token'
              : 'Refresh Invalid Token Without iOS Logs'
          }
          minW={buttonMinWidth}
          action={async () => {
            const now = Math.floor(Date.now() / 1000);

            return getTokenSummary(
              await refreshToken({
                ios: { loggingEnabled },
                token: {
                  accessToken: 'not-a-native-access-token',
                  refreshToken: 'not-a-native-refresh-token',
                  accessTokenExpiresAt: now - tokenVerificationLifetimeSeconds,
                  refreshTokenExpiresAt: now + tokenVerificationLifetimeSeconds,
                  accessTokenExpiresIn: -tokenVerificationLifetimeSeconds,
                  refreshTokenExpiresIn: tokenVerificationLifetimeSeconds,
                  scopes: [],
                },
              }),
            );
          }}
        />
      ))}
      <E2EApiAction
        id={'token-code-exchange'}
        title={'Exchange Invalid Authorization Code'}
        minW={buttonMinWidth}
        action={async () =>
          getTokenSummary(
            await issueAccessTokenWithCode({
              code: 'not-an-authorization-code',
              redirectUri: Platform.OS === 'web' ? 'http://localhost' : undefined,
            }),
          )
        }
      />
      <E2EApiAction
        id={'login-channels'}
        title={'Login With Channel Selection'}
        minW={buttonMinWidth}
        action={async () => {
          await login({
            useKakaoAccountLogin: true,
            channelPublicIds: ['_hJhxbj'],
            web: { redirectUri: 'http://localhost', throughTalk: false },
          });

          return { loggedIn: true };
        }}
      />
      <E2EApiAction
        id={'login-hint'}
        title={'Login With ID Hint'}
        minW={buttonMinWidth}
        action={async () => {
          await login({
            useKakaoAccountLogin: true,
            prompts: ['Login'],
            loginHint: 'rn_kakao_verification',
            web: {
              redirectUri: 'http://localhost',
              prompt: ['login'],
              throughTalk: false,
            },
          });

          return { loggedIn: true };
        }}
      />
      <E2EApiAction
        id={'profile-metadata-login'}
        title={'Login For Profile Metadata'}
        action={async () => {
          await login({
            useKakaoAccountLogin: true,
            web: { redirectUri: 'http://localhost', throughTalk: false },
          });

          return { loggedIn: true };
        }}
      />
      <Btn
        minW={buttonMinWidth}
        title={'Unlink'}
        onPress={() => {
          unlink()
            .then(() => {
              showMessage({
                type: 'success',
                message: 'Unlink Success',
              });
            })
            .catch((e) =>
              showMessage({
                type: 'warning',
                message: e.message,
              }),
            );
        }}
      />
      <E2EApiAction
        id={'login-state'}
        minW={buttonMinWidth}
        title={'Check Logined'}
        action={isLogined}
        onSuccess={(value) => showMessage({ type: 'success', message: `Logined: ${value}` })}
      />
      <E2EApiAction
        id={'token-presence'}
        minW={buttonMinWidth}
        title={'Check Stored Token'}
        action={hasToken}
      />
      <Btn
        minW={buttonMinWidth}
        title={'Scopes'}
        onPress={() => {
          scopes()
            .then((ret) => {
              showMessage({
                type: 'success',
                message: 'Success',
              });
              setScopesResult(ret);
            })
            .catch((e) =>
              showMessage({
                type: 'warning',
                message: e.message,
              }),
            );
        }}
      />
      <Btn
        minW={buttonMinWidth}
        title={'Service Terms'}
        onPress={() => {
          serviceTerms()
            .then((ret) => {
              showMessage({
                type: 'success',
                message: 'Success',
              });
              setServiceTermsResult(ret);
            })
            .catch((e) =>
              showMessage({
                type: 'warning',
                message: e.message,
              }),
            );
        }}
      />
      <Btn
        minW={buttonMinWidth}
        title={'Shipping Addresses'}
        onPress={() => {
          shippingAddresses()
            .then((ret) => {
              showMessage({
                type: 'success',
                message: 'Success',
              });
              setShippingResult(ret);
            })
            .catch((e) => {
              console.log(e);
              showMessage({
                type: 'warning',
                message: e.message,
              });
            });
        }}
      />
      <E2EApiAction
        id={'service-terms-all'}
        minW={buttonMinWidth}
        title={'Get All Service Terms'}
        action={() => serviceTerms({ result: allServiceTermsResult })}
      />
      <E2EApiAction
        id={'service-terms-by-tag'}
        minW={buttonMinWidth}
        title={'Get Service Terms by Tag'}
        action={async () => {
          const [term] = await serviceTerms({ result: allServiceTermsResult });

          if (!term) {
            return { hasRegisteredTerms: false };
          }

          const terms = await serviceTerms({ result: allServiceTermsResult, tags: [term.tag] });

          return { requestedTag: term.tag, terms };
        }}
      />
      <E2EApiAction
        id={'service-terms-invalid-tag'}
        minW={buttonMinWidth}
        title={'Get Unregistered Service Term'}
        action={() => serviceTerms({ tags: ['rnc_example_missing_service_term'] })}
      />
      <E2EApiAction
        id={'revoke-service-term'}
        minW={buttonMinWidth}
        title={'Revoke Test Service Term'}
        action={() => revokeServiceTerms([testServiceTermTag])}
      />
      <E2EApiAction
        id={'revoked-service-term'}
        minW={buttonMinWidth}
        title={'Get Test Service Term'}
        action={() => serviceTerms({ result: allServiceTermsResult, tags: [testServiceTermTag] })}
      />
      <E2EApiAction
        id={'shipping-address-by-id'}
        minW={buttonMinWidth}
        title={'Get Shipping Address by ID'}
        action={async () => {
          const { shippingAddresses: addresses } = await shippingAddresses();
          const address = addresses[0];

          if (!address) {
            return { hasAddress: false };
          }

          const { shippingAddresses: matches } = await shippingAddresses({ addressId: address.id });

          return {
            count: matches.length,
            didMatchAddress: matches.length === 1 && matches[0]?.id === address.id,
          };
        }}
      />
      <E2EApiAction
        id={'shipping-address-page'}
        minW={buttonMinWidth}
        title={'Get Shipping Address Page'}
        action={async () => {
          const pageSize = 2;
          const result = await shippingAddresses({ fromUpdatedAt: 0, pageSize });

          return {
            count: result.shippingAddresses.length,
            needsAgreement: result.needsAgreement ?? false,
            isWithinPageSize: result.shippingAddresses.length <= pageSize,
          };
        }}
      />
      <E2EApiAction
        id={'user-https-profile-images'}
        title={'Get HTTPS Profile Images'}
        action={() => getProfileImageProtocols(true)}
      />
      <E2EApiAction
        id={'user-http-profile-images'}
        title={'Get HTTP Profile Images'}
        action={() => getProfileImageProtocols(false)}
      />
      <E2EApiAction
        id={'user-signup'}
        title={'Manual Signup'}
        action={async () => {
          await signup();

          return { connected: true };
        }}
      />
      <E2EApiAction
        id={'user-connection-state'}
        title={'Get Connection State'}
        action={async () => ({ hasSignedUp: (await me()).hasSignedUp ?? null })}
      />
      <E2EApiAction
        id={'user-profile'}
        minW={buttonMinWidth}
        title={'Get Profile'}
        action={me}
        onSuccess={(value) => {
          setMeResult(value);
          showMessage({ type: 'success', message: 'Success' });
        }}
      />
      <E2EApiAction
        id={'user-profile-metadata'}
        title={'Get Profile Metadata'}
        action={async () => {
          const { isDefaultImage, isLeapMonth, uuid } = await me();

          return {
            isDefaultImage,
            isLeapMonth,
            hasUuid: typeof uuid === 'string' && uuid.length > 0,
          };
        }}
      />
      <E2EApiAction
        id={'user-profile-enum-shapes'}
        title={'Get Profile Enum Shapes'}
        action={async () => {
          const { ageRange, gender, birthdayType } = await me();

          return {
            hasAgeRange: ageRange != null,
            isAgeRangeFormatValid: ageRange == null || /^\d{1,2}~\d{0,2}$/.test(ageRange),
            hasGender: gender != null,
            isGenderValid: gender == null || ['female', 'male'].includes(gender),
            hasBirthdayType: birthdayType != null,
            isBirthdayTypeValid: birthdayType == null || ['SOLAR', 'LUNAR'].includes(birthdayType),
          };
        }}
      />
      <E2EApiAction
        id={'user-legal-identity'}
        title={'Get Legal Identity Availability'}
        action={async () => {
          const user = await me();

          return {
            hasLegalName: user.legalName != null,
            hasLegalBirthDate: user.legalBirthDate != null,
            hasLegalGender: user.legalGender != null,
            legalNameNeedsAgreement: user.legalNameNeedsAgreement,
            legalBirthDateNeedsAgreement: user.legalBirthDateNeedsAgreement,
            legalGenderNeedsAgreement: user.legalGenderNeedsAgreement,
          };
        }}
      />
      <E2EApiAction
        id={'user-group-token'}
        title={'Get Group User Token Availability'}
        action={async () => {
          const { groupUserToken } = await me();

          return {
            hasGroupUserToken: typeof groupUserToken === 'string' && groupUserToken.length > 0,
            isGroupUserTokenNull: groupUserToken === null,
          };
        }}
      />
      <E2EApiAction
        id={'shipping-address-picker'}
        minW={buttonMinWidth}
        title={'Select Shipping Address'}
        action={async () => {
          const addressId = await selectShippingAddress();

          return { hasAddressId: Number.isSafeInteger(addressId) && addressId > 0 };
        }}
      />
      <E2EApiAction
        id={'update-profile'}
        minW={buttonMinWidth}
        title={'Update Test User Property'}
        action={async () => {
          await updateProfile({ properties: { [profileVerificationKey]: Platform.OS } });

          return { didComplete: true };
        }}
      />
      <E2EApiAction
        id={'clear-profile-property'}
        minW={buttonMinWidth}
        title={'Clear Test User Property'}
        action={async () => {
          await updateProfile({ properties: { [profileVerificationKey]: '' } });

          return { didComplete: true };
        }}
      />
      <Btn
        minW={buttonMinWidth}
        title={'Get Access Token'}
        onPress={() => {
          getAccessToken()
            .then((ret) => {
              showMessage({
                type: 'success',
                message: formatJson(ret),
              });
            })
            .catch((e) => {
              showMessage({
                type: 'warning',
                message: e.message,
              });
            });
        }}
      />
      <PrettyResult label={'Login Result'} result={result} />
      <PrettyResult label={'Scopes Result'} result={scopesResult} />
      <PrettyResult label={'Service Terms Result'} result={serviceTermsResult} />
      <PrettyResult label={'Shipping Addresses Result'} result={shippingResult} />
      <PrettyResult label={'Get Profile Result'} result={meResult} />
    </StyledScrollView>
  );
}
