import { useState } from 'react';
import { login } from '@react-native-kakao/user';
import { Redirect, Stack } from 'expo-router';

import { Btn } from '../component/Btn';
import { StyledScrollView } from '../component/StyledScrollView';
import { Txt } from '../component/Txt';
import { px } from '../util/px';

const scenarioPrefix = 'rnkakao-e2e:';
const serviceTerms = ['e2e-term'];

const getErrorDetails = (error: unknown) => {
  if (typeof error !== 'object' || error === null) {
    return { code: '', message: String(error) };
  }

  return {
    code: 'code' in error && typeof error.code === 'string' ? error.code : '',
    message: 'message' in error && typeof error.message === 'string' ? error.message : '',
  };
};

export default function Page() {
  const [result, setResult] = useState('ready');

  if (process.env.EXPO_PUBLIC_RNKAKAO_E2E !== '1') {
    return <Redirect href={'/'} />;
  }

  const runTokenScenario = async ({
    name,
    expectedAccessToken,
    useKakaoAccountLogin = false,
  }: {
    name: string;
    expectedAccessToken: string;
    useKakaoAccountLogin?: boolean;
  }) => {
    setResult(`${name}: running`);

    try {
      const nonce = `${scenarioPrefix}${name}`;

      const token = await login({
        nonce,
        serviceTerms,
        useKakaoAccountLogin,
        prompts: useKakaoAccountLogin ? ['Login'] : undefined,
      });

      setResult(
        token.accessToken === expectedAccessToken && token.idToken === nonce
          ? `${name}: passed`
          : `${name}: failed token`,
      );
    } catch (error) {
      const details = getErrorDetails(error);
      setResult(`${name}: failed ${details.code} ${details.message}`.trim());
    }
  };

  const runErrorScenario = async ({
    name,
    matches,
  }: {
    name: string;
    matches: (error: { code: string; message: string }) => boolean;
  }) => {
    setResult(`${name}: running`);

    try {
      await login({ nonce: `${scenarioPrefix}${name}`, serviceTerms });
      setResult(`${name}: failed resolved`);
    } catch (error) {
      const details = getErrorDetails(error);
      setResult(
        matches(details) ? `${name}: passed` : `${name}: failed ${details.code} ${details.message}`,
      );
    }
  };

  return (
    <StyledScrollView flex={1} contentContainerSx={{ pb: 48, alignItems: 'center', px: 4, gap: 4 }}>
      <Stack.Screen options={{ title: 'Login E2E' }} />
      <Txt testID={'login-e2e-result'}>{result}</Txt>
      <Btn
        testID={'login-e2e-talk-success'}
        minW={px(240)}
        title={'Talk success'}
        onPress={() => runTokenScenario({ name: 'talk-success', expectedAccessToken: 'e2e-talk' })}
      />
      <Btn
        testID={'login-e2e-fallback-success'}
        minW={px(240)}
        title={'Fallback success'}
        onPress={() =>
          runTokenScenario({
            name: 'talk-error-account-success',
            expectedAccessToken: 'e2e-account',
          })
        }
      />
      <Btn
        testID={'login-e2e-talk-cancel'}
        minW={px(240)}
        title={'Talk cancel'}
        onPress={() =>
          runErrorScenario({
            name: 'talk-cancel',
            matches: ({ code }) => code.includes('Cancelled') || code.includes('AccessDenied'),
          })
        }
      />
      <Btn
        testID={'login-e2e-account-error'}
        minW={px(240)}
        title={'Account error'}
        onPress={() =>
          runErrorScenario({
            name: 'talk-error-account-error',
            matches: ({ message }) => message.includes('E2E_ACCOUNT_FAILED'),
          })
        }
      />
      <Btn
        testID={'login-e2e-talk-consent-cancel'}
        minW={px(240)}
        title={'Talk consent cancel'}
        onPress={() =>
          runErrorScenario({
            name: 'talk-consent-cancel',
            matches: ({ code }) => code.includes('Cancelled') || code.includes('AccessDenied'),
          })
        }
      />
      <Btn
        testID={'login-e2e-direct-account'}
        minW={px(240)}
        title={'Direct account'}
        onPress={() =>
          runTokenScenario({
            name: 'direct-account',
            expectedAccessToken: 'e2e-account',
            useKakaoAccountLogin: true,
          })
        }
      />
    </StyledScrollView>
  );
}
