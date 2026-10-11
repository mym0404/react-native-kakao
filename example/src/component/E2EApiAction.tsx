import { useState } from 'react';
import { showMessage } from 'react-native-flash-message';

import { Btn, type BtnProps } from './Btn';
import { Txt } from './Txt';

export function E2EApiAction<T>({
  id,
  title,
  action,
  onSuccess,
  minW,
}: {
  minW?: BtnProps['minW'];
  id: string;
  title: string;
  action: () => Promise<T>;
  onSuccess?: (value: T) => void;
}) {
  const [result, setResult] = useState('idle');
  const isRunning = result === 'running';

  return (
    <>
      <Btn
        testID={`${id}-button`}
        title={title}
        minW={minW}
        disabled={isRunning}
        onPress={async () => {
          setResult('running');
          try {
            const value = await action();
            setResult(`success: ${JSON.stringify(value)}`);
            onSuccess?.(value);
          } catch (error) {
            const code =
              error && typeof error === 'object' && 'code' in error
                ? String(error.code)
                : 'Unknown';
            const message = error instanceof Error ? error.message : String(error);
            setResult(`error: ${code}`);
            showMessage({ type: 'warning', message });
          }
        }}
      />
      <Txt testID={`${id}-result`}>{result}</Txt>
    </>
  );
}
