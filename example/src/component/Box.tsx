import { forwardRef, type PropsWithChildren, type Ref } from 'react';
import type { ViewProps } from 'react-native';
import { View } from 'react-native';
import type { SxProps } from '@react-native-styled-system/core';
import { useSx } from '@react-native-styled-system/core';

type BoxProps = PropsWithChildren<ViewProps & SxProps>;

const Box = forwardRef((props: BoxProps, ref: Ref<View>) => {
  const { getStyle, filteredProps } = useSx(props);

  return <View ref={ref} style={getStyle()} {...filteredProps} />;
});

export { Box };
export type { BoxProps };
