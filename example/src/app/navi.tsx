import { navigateTo, shareTo } from '@react-native-kakao/navi';

import { Btn } from '../component/Btn';
import { StyledScrollView } from '../component/StyledScrollView';

export default function Page() {
  return (
    <StyledScrollView
      flex={1}
      contentContainerSx={{ pt: 12, pb: 48, alignItems: 'center', px: 4, gap: 4 }}
    >
      <Btn
        title={'Navigate to Gangnam Station'}
        onPress={() => {
          navigateTo({
            option: {
              coordType: 'WGS84',
            },
            destination: {
              x: 129.340842223,
              y: 35.5449848249,
              name: 'Gangnam',
            },
          }).then(console.log);
        }}
      />
      <Btn
        title={'Share to Gangnam Station'}
        onPress={() => {
          shareTo({
            option: {
              coordType: 'WGS84',
            },
            destination: {
              x: 129.340842223,
              y: 35.5449848249,
              name: 'Gangnam',
            },
            viaList: [
              {
                x: 126.340842223,
                y: 34.5449848249,
                name: 'Gangnam',
              },
            ],
            openWebInstallUrlIfNaviAppNotAvailable: false,
          }).then(console.log);
        }}
      />
    </StyledScrollView>
  );
}
