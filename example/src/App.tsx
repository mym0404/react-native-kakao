import * as React from 'react';

import { StyleSheet, View, Text } from 'react-native';
import { add } from '@react-native-kakao/share';
import { initializeKakaoSDK } from '@react-native-kakao/core';

// console.log(M);
export default function App() {
  const [result, setResult] = React.useState<number | undefined>();

  React.useEffect(() => {
    initializeKakaoSDK('5a9383961eadba5496cb4ff895e91a89');
    setResult(add(3, 7) + add(1, 222));
  }, []);

  return (
    <View style={styles.container}>
      <Text>Result: {result}</Text>
      <Text>Result: {result}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
