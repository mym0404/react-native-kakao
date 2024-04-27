import { formatJson, is } from '@mj-studio/js-util';
import { type SxProps, useSx } from '@react-native-styled-system/core';

import { Box } from './Box';
import { Txt } from './Txt';

type PrettyResultProps = { label: string; result?: any } & SxProps;

const PrettyResult = (props: PrettyResultProps) => {
  const { getStyle, filteredProps } = useSx(props);
  const { result, label } = filteredProps;

  return (
    <Box w={'100%'}>
      <Txt>{label}</Txt>
      <Txt
        w={'100%'}
        t={'c2'}
        p={4}
        borderWidth={1}
        borderColor={'text'}
        color={'primary100'}
        style={getStyle()}
      >
        {!result ? 'No data' : is.object(result) ? formatJson(result) : `${result}`}
      </Txt>
    </Box>
  );
};

export { PrettyResult };
export type { PrettyResultProps };
