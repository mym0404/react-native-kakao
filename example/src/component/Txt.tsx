import type { TextProps } from 'react-native';
import { Text } from 'react-native';
import type { TextSxProps } from '@react-native-styled-system/core';
import { useSx } from '@react-native-styled-system/core';

type TxtProps = {} & TextSxProps & TextProps;

const Txt = (props: TxtProps) => {
  const { getStyle, filteredProps } = useSx(props, {
    styleType: 'TextStyle',
    fallback: {
      color: 'text',
      t: 'b2',
    },
  });

  return <Text style={getStyle()} {...filteredProps} />;
};

export { Txt };
export type { TxtProps };
