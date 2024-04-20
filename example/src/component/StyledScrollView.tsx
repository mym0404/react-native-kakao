import type { PropsWithChildren, Ref } from 'react';
import { forwardRef } from 'react';
import type { ScrollViewProps } from 'react-native';
import { ScrollView } from 'react-native';
import type { SxProps } from '@react-native-styled-system/core';
import { useSx } from '@react-native-styled-system/core';

type StyledScrollViewProps = PropsWithChildren<
  {
    contentContainerSx?: SxProps;
  } & Omit<ScrollViewProps, 'contentContainerStyle'> &
    SxProps
>;

const StyledScrollView = forwardRef((props: StyledScrollViewProps, ref: Ref<ScrollView>) => {
  const { getStyle, filteredProps } = useSx(props);
  const { getStyle: contentContainerStyle } = useSx(props.contentContainerSx);

  return (
    <ScrollView
      ref={ref}
      style={getStyle()}
      contentContainerStyle={contentContainerStyle()}
      {...filteredProps}
    />
  );
});

export { StyledScrollView };
export type { StyledScrollViewProps };
