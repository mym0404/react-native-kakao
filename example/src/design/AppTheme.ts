import type { ThemedDict } from '@react-native-styled-system/core';

import { C } from './token/C';
import { Sp } from './token/Sp';

const StyledSystemAppTheme: ThemedDict = {
  colors: C,
  space: {
    ...Sp,
  },
  sizes: { ...Sp },
  radii: {},
  typography: {
    display: {
      fontSize: 48,
      fontWeight: 'bold',
    },
    h1: {
      fontSize: 28,
      fontWeight: 'bold',
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    h3: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    b1: {
      fontSize: 18,
    },
    b2: {
      fontSize: 16,
    },
    b3: {
      fontSize: 14,
    },
    c1: {
      fontSize: 12,
    },
    c2: {
      fontSize: 11,
    },
    c3: {
      fontSize: 10,
    },
  },
};

export default StyledSystemAppTheme;
