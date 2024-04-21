import { useState } from 'react';
import { showMessage } from 'react-native-flash-message';
import { formatJson } from '@mj-studio/js-util';
import { useMount } from '@mj-studio/react-util';
import {
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
import { StyledScrollView } from '../component/StyledScrollView';
import { Txt } from '../component/Txt';
import { px } from '../util/px';

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
    <StyledScrollView
      flex={1}
      contentContainerSx={{ pt: 12, pb: 48, alignItems: 'center', px: 4, gap: 4 }}
    >
      <Txt>{`Kakao Talk Available: ${isKakaoTalkEnable}`}</Txt>
      <Btn
        minW={px(240)}
        title={'Login'}
        onPress={() => {
          login()
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
        minW={px(240)}
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
        minW={px(240)}
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
      <Btn
        minW={px(240)}
        title={'Check Logined'}
        onPress={() => {
          isLogined()
            .then((ret) => {
              showMessage({
                type: 'success',
                message: `Logined: ${ret}`,
              });
            })
            .catch((e) =>
              showMessage({
                type: 'warning',
                message: `Failed - ${e.message}`,
              }),
            );
        }}
      />
      <Btn
        minW={px(240)}
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
        minW={px(240)}
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
        minW={px(240)}
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
      <Btn
        minW={px(240)}
        title={'Get Profile'}
        onPress={() => {
          me()
            .then((ret) => {
              showMessage({
                type: 'success',
                message: 'Success',
              });
              setMeResult(ret);
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
      <Txt mt={6}>{'Login Result'}</Txt>
      <Txt w={'100%'} t={'c2'} p={4} borderWidth={1} borderColor={'text'} color={'primary100'}>
        {!result ? 'No data' : formatJson(result)}
      </Txt>
      <Txt>{'Scopes Result'}</Txt>
      <Txt w={'100%'} t={'c2'} p={4} borderWidth={1} borderColor={'text'} color={'primary100'}>
        {!scopesResult ? 'No data' : formatJson(scopesResult)}
      </Txt>
      <Txt>{'Service Terms Result'}</Txt>
      <Txt w={'100%'} t={'c2'} p={4} borderWidth={1} borderColor={'text'} color={'primary100'}>
        {!serviceTermsResult ? 'No data' : formatJson(serviceTermsResult)}
      </Txt>
      <Txt>{'Shipping Addresses Result'}</Txt>
      <Txt w={'100%'} t={'c2'} p={4} borderWidth={1} borderColor={'text'} color={'primary100'}>
        {!shippingResult ? 'No data' : formatJson(shippingResult)}
      </Txt>
      <Txt>{'Get Profile Result'}</Txt>
      <Txt w={'100%'} t={'c2'} p={4} borderWidth={1} borderColor={'text'} color={'primary100'}>
        {!meResult ? 'No data' : formatJson(meResult)}
      </Txt>
    </StyledScrollView>
  );
}
