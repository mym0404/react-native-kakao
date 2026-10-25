import { Fragment } from 'react';
import {
  certLoginWithKakaoAccount,
  deleteKeyPair,
  fetchSessionInfo,
  fetchSessionInfoByAppKey,
  getPublicKey,
  getSessionInfo,
  isKakaoTalkSignAvailable,
  isValidSession,
  reducedSign,
  signWithKakaoTalk,
} from '@react-native-kakao/cert';

import { E2EApiAction } from '../component/E2EApiAction';
import { StyledScrollView } from '../component/StyledScrollView';

const verificationData = 'rn-kakao-cert-verification';

export default function Page() {
  return (
    <StyledScrollView contentContainerSx={{ px: 4, gap: 3, pt: 4, pb: 10 }}>
      <E2EApiAction
        id={'cert-talk-available'}
        title={'Check Signing Availability'}
        action={isKakaoTalkSignAvailable}
      />
      {(['K2220', 'K3220'] as const).map((certType) => (
        <Fragment key={certType}>
          <E2EApiAction
            id={`cert-session-${certType}`}
            title={`Read ${certType} Session`}
            action={async () => ({
              hasSession: (await getSessionInfo({ certType })) != null,
              isValid: await isValidSession({ certType }),
            })}
          />
          <E2EApiAction
            id={`cert-key-${certType}`}
            title={`Create ${certType} Public Key`}
            action={async () => {
              const first = await getPublicKey({ certType });
              const second = await getPublicKey({ certType });

              return { hasPublicKey: !!first, isSameKey: !!first && first === second };
            }}
          />
          <E2EApiAction
            id={`cert-sign-${certType}`}
            title={`Sign ${certType} Without Session`}
            action={async () => ({
              hasSignature: !!(await reducedSign({ certType, data: verificationData })),
            })}
          />
          <E2EApiAction
            id={`cert-delete-${certType}`}
            title={`Delete ${certType} Key Pair`}
            action={async () => {
              await deleteKeyPair({ certType });

              return {
                hasSession: (await getSessionInfo({ certType })) != null,
                isValid: await isValidSession({ certType }),
              };
            }}
          />
        </Fragment>
      ))}
      <E2EApiAction
        id={'cert-fetch-session'}
        title={'Fetch Invalid K2220 Session'}
        action={() => fetchSessionInfo({ certType: 'K2220', txId: verificationData })}
      />
      <E2EApiAction
        id={'cert-fetch-session-app-key'}
        title={'Fetch Invalid K3220 Session'}
        action={() => fetchSessionInfoByAppKey({ certType: 'K3220', txId: verificationData })}
      />
      <E2EApiAction
        id={'cert-talk-sign'}
        title={'Request Signing Without KakaoTalk'}
        action={() => signWithKakaoTalk({ txId: verificationData })}
      />
      <E2EApiAction
        id={'cert-account-login'}
        title={'Check Unconfigured Certification Login'}
        action={async () => {
          const info = await certLoginWithKakaoAccount({
            certType: 'K2100',
            settleId: verificationData,
            signData: verificationData,
          });

          return { hasTransaction: !!info.txId, hasAccessToken: !!info.token.accessToken };
        }}
      />
    </StyledScrollView>
  );
}
