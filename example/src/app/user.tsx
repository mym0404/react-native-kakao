import { useState } from 'react';
import { showMessage } from 'react-native-flash-message';
import { formatJson } from '@mj-studio/js-util';
import { useMount } from '@mj-studio/react-util';
import {
  getAccessToken,
  isKakaoTalkLoginAvailable,
  isLogined,
  login,
  logout,
  me,
  scopes,
  serviceTerms,
  shippingAddresses,
  unlink,
} from '@react-native-kakao/user';

import { Btn } from '../component/Btn';
import { E2EApiAction } from '../component/E2EApiAction';
import { PrettyResult } from '../component/PrettyResult';
import { StyledScrollView } from '../component/StyledScrollView';
import { Txt } from '../component/Txt';
import { px } from '../util/px';

const buttonMinWidth = px(240);

async function getProfileImageProtocols(secureResource: boolean) {
  const user = await me({ propertyKeys: ['kakao_account.profile'], secureResource });
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
