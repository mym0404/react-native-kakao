export type KakaoAndroidConfig = {
  authCodeHandlerActivity?: boolean;
  followChannelHandlerActivity?: boolean;
  shippingAddressHandlerActivity?: boolean;
  certServiceHandlerActivity?: boolean;
  forwardKakaoLinkIntentFilterToMainActivity?: boolean;
};
export type KakaoIosConfig = {
  handleKakaoOpenUrl?: boolean;
  handleKakaoCertOpenUrl?: boolean;
  naviApplicationQuerySchemes?: boolean;
};
