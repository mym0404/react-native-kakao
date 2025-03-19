import { forwardRef, type PropsWithChildren } from 'react';
import type { TouchableOpacityProps } from 'react-native';
import { TouchableOpacity } from 'react-native';
import type { SxProps } from '@react-native-styled-system/core';
import { useSx } from '@react-native-styled-system/core';

import { Txt } from './Txt';

type BtnProps = PropsWithChildren<TouchableOpacityProps & SxProps & { title: string }>;

const Btn = forwardRef((props: BtnProps, ref: any) => {
  const { getStyle, filteredProps } = useSx(props, {
    fallback: {
      bg: 'primary600',
      p: 2,
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  const { title, ...rest } = filteredProps;

  return (
    <TouchableOpacity accessibilityRole={'button'} ref={ref} style={getStyle()} {...rest}>
      <Txt weight={'500'}>{title}</Txt>
    </TouchableOpacity>
  );
});

export { Btn };
export type { BtnProps };
