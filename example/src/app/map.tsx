import { useState } from 'react';
import KakaoMapView from '@react-native-kakao/map';
import type { Camera } from '@react-native-kakao/map/src/type/type';

import { Box } from '../component/Box';
import { Btn } from '../component/Btn';
import { px } from '../util/px';

const Cameras = {
  Seolleung: {
    lat: 37.50497126,
    lng: 127.04905021,
    zoomLevel: 14,
  },
  Gangnam: {
    lat: 37.498040483,
    lng: 127.02758183,
    zoomLevel: 14,
  },
  Jeju: {
    lat: 33.39530773,
    lng: 126.54656715029,
    zoomLevel: 8,
  },
} satisfies Record<string, Camera>;

export default function Page() {
  const [camera, setCamera] = useState<Camera>(Cameras.Gangnam);

  return (
    <Box flex={1} gap={8}>
      <KakaoMapView
        style={{ flex: 1 }}
        buildingScale={0.5}
        poiEnabled
        poiScale={'regular'}
        baseMapType={'map'}
        camera={camera}
        cameraAnimationDuration={1500}
      />
      <Box h={px(200)} bg={'white'}>
        <Btn title={'Gangnam'} onPress={() => setCamera(Cameras.Gangnam)} />
        <Btn title={'Seolleung'} onPress={() => setCamera(Cameras.Seolleung)} />
      </Box>
    </Box>
  );
}
