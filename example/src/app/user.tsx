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
  login,
  logout,
  me,
  revokeServiceTerms,
  scopes,
  selectShippingAddress,
  serviceTerms,
  shippingAddresses,
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
const testServiceTermTag = 'rnc_example_optional_service_term';

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
        id={'user-properties'}
        minW={buttonMinWidth}
        title={'Get User Properties'}
        action={async () => {
          const { properties } = await me({ propertyKeys: ['properties.'] });

          return {
            keys: Object.keys(properties),
            hasNickname: typeof properties.nickname === 'string',
            hasProfileImage: typeof properties.profile_image === 'string',
            hasThumbnailImage: typeof properties.thumbnail_image === 'string',
          };
        }}
      />
      <E2EApiAction
        id={'user-property-nickname'}
        minW={buttonMinWidth}
        title={'Get Nickname Property'}
        action={async () => {
          const { properties } = await me({ propertyKeys: ['properties.nickname'] });

          return { keys: Object.keys(properties) };
        }}
      />
      <E2EApiAction
        id={'user-properties-empty'}
        minW={buttonMinWidth}
        title={'Get Profile Without Properties'}
        action={async () => {
          const { properties } = await me({ propertyKeys: ['kakao_account.email'] });

          return { keys: Object.keys(properties) };
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
        id={'updated-profile'}
        minW={buttonMinWidth}
        title={'Get Test User Property'}
        action={async () => {
          const { properties } = await me({
            propertyKeys: [`properties.${profileVerificationKey}`],
          });

          return {
            matchesPlatform: properties[profileVerificationKey] === Platform.OS,
            isEmpty: !properties[profileVerificationKey],
          };
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
