import type { Camera } from '../type/type';

import { Const } from './Const';

export const nullCamera: Required<Camera> = {
  lat: Const.nullNumber,
  lng: Const.nullNumber,
  tilt: Const.nullNumber,
  rotation: Const.nullNumber,
  zoomLevel: Const.nullNumber,
};
