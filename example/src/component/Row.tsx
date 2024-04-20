import type { PropsWithChildren } from 'react';
import type { ViewProps } from 'react-native';
import type { SxProps } from '@react-native-styled-system/core';

import { Box } from './Box';

type RowProps = { reverse?: boolean } & PropsWithChildren<ViewProps & SxProps>;

const Row = (props: RowProps) => {
  return <Box flexDirection={props.reverse ? 'row-reverse' : 'row'} {...props} />;
};

export const RowCenter = (props: RowProps) => {
  return <Row alignItems={'center'} {...props} />;
};

export { Row };
export type { RowProps };
