import { shareCustom } from '@react-native-kakao/share';

import { Btn } from '../component/Btn';
import { StyledScrollView } from '../component/StyledScrollView';

export default function Page() {
  return (
    <StyledScrollView
      flex={1}
      contentContainerSx={{ pt: 12, pb: 48, alignItems: 'center', px: 4, gap: 4 }}
    >
      <Btn
        title={'Share Custom Template'}
        onPress={() => {
          shareCustom({
            templateId: 107179,
            templateArgs: {
              price: '20000',
            },
            serverCallbackArgs: {},
          });
        }}
      />
    </StyledScrollView>
  );
}
