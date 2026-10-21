import {
  getNavigateUrl,
  getShareUrl,
  isKakaoNaviInstalled,
  type KakaoNaviRouteParams,
  navigateTo,
  shareTo,
} from '@react-native-kakao/navi';

import { Btn } from '../component/Btn';
import { E2EApiAction } from '../component/E2EApiAction';
import { StyledScrollView } from '../component/StyledScrollView';

const routeParams = {
  destination: { name: '강남역 & 테스트', x: 127.02758, y: 37.49771, rpflag: '1' },
  option: {
    coordType: 'WGS84',
    vehicleType: 'TwoWheel',
    rpOption: 'Recommended',
    routeInfo: false,
    startX: 127.01,
    startY: 37.5,
    startAngle: 123,
    returnUri: 'rnkakao-verification://navi?source=url-builder',
  },
  viaList: [
    { name: '경유지 1', x: 127.02, y: 37.5, rpflag: '1' },
    { name: '경유지 2', x: 127.03, y: 37.51 },
    { name: '경유지 3', x: 127.04, y: 37.52 },
  ],
} satisfies KakaoNaviRouteParams;

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
      <E2EApiAction
        id={'navi-share'}
        title={'Share to Gangnam Station'}
        action={() =>
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
          })
        }
        onSuccess={console.log}
      />
      <E2EApiAction
        id={'navi-availability'}
        title={'Is Kakao Navi Installed'}
        action={isKakaoNaviInstalled}
      />
      <E2EApiAction
        id={'navi-navigate-url'}
        title={'Get navigation URL'}
        action={() => getNavigateUrl(routeParams)}
      />
      <E2EApiAction
        id={'navi-share-url'}
        title={'Get destination sharing URL'}
        action={() => getShareUrl(routeParams)}
      />
      <E2EApiAction
        id={'navi-navigate-url-minimal'}
        title={'Get navigation URL without options'}
        action={() => getNavigateUrl({ destination: routeParams.destination })}
      />
      <E2EApiAction
        id={'navi-share-url-minimal'}
        title={'Get destination sharing URL without options'}
        action={() => getShareUrl({ destination: routeParams.destination })}
      />
      <E2EApiAction
        id={'navi-url-invalid-stops'}
        title={'Reject four navigation stops'}
        action={() =>
          getNavigateUrl({
            ...routeParams,
            viaList: [...routeParams.viaList, routeParams.destination],
          })
        }
      />
    </StyledScrollView>
  );
}
