import { insertContentsInsideSwiftFunctionBlock } from '@expo/config-plugins/build/ios/codeMod';
import { type ConfigPlugin, withAppDelegate, withInfoPlist } from 'expo/config-plugins';

import type { KakaoIosConfig } from './type';

const withIos: ConfigPlugin<{
  nativeAppKey: string;
  ios: KakaoIosConfig;
}> = (config, { nativeAppKey, ios: { handleKakaoOpenUrl, naviApplicationQuerySchemes } }) => {
  if (!nativeAppKey) {
    throw new Error(
      "[@react-native-kakao/core] 'nativeAppKey' missing in expo config plugin value",
    );
  }

  config = withInfoPlist(config, (config) => {
    if (!config.modResults.LSApplicationQueriesSchemes) {
      config.modResults.LSApplicationQueriesSchemes = [];
    }

    if (!config.modResults.CFBundleURLTypes) {
      config.modResults.CFBundleURLTypes = [];
    }

    // core
    if (
      config.modResults.CFBundleURLTypes?.findIndex((t) =>
        t.CFBundleURLSchemes.some((s) => s === `kakao${nativeAppKey}`),
      ) === -1
    ) {
      config.modResults.CFBundleURLTypes = [
        ...config.modResults.CFBundleURLTypes,
        {
          CFBundleURLSchemes: [`kakao${nativeAppKey}`],
          CFBundleURLName: 'Kakao',
        },
      ];
    }

    config.modResults.LSApplicationQueriesSchemes = [
      ...new Set([
        ...config.modResults.LSApplicationQueriesSchemes,
        'kakaokompassauth',
        'kakaolink',
        'kakaoplus',
      ]),
    ];

    // kakao navi
    if (naviApplicationQuerySchemes) {
      config.modResults.LSApplicationQueriesSchemes = [
        ...new Set([...config.modResults.LSApplicationQueriesSchemes, 'kakaonavi-sdk']),
      ];
    }

    return config;
  });

  if (handleKakaoOpenUrl) {
    config = withKakaoUserSdkAppDelegate(config);
  }

  return config;
};

const withKakaoUserSdkAppDelegate: ConfigPlugin = (config) => {
  const modifyObjcContents = (contents: string): string => {
    const importRctLinkingManager = '#import <React/RCTLinkingManager.h>';
    const importMod = '#import <RNCKakaoUser/RNCKakaoUserUtil.h>';

    if (!contents.includes(importRctLinkingManager)) {
      contents = `${importRctLinkingManager}\n${contents}`;
    }

    if (!contents.includes(importMod)) {
      contents = contents.replace(
        importRctLinkingManager,
        importRctLinkingManager + '\n' + importMod,
      );
    }

    if (!contents.includes('RNCKakaoUserUtil handleOpenUrl')) {
      contents = contents.replace(
        'options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {',
        `options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
        if([RNCKakaoUserUtil isKakaoTalkLoginUrl:url]) { return [RNCKakaoUserUtil handleOpenUrl:url]; }
        `,
      );
    }

    return contents;
  };

  const modifySwiftContents = (contents: string): string => {
    const importAnchor = 'import Expo';
    const importMod = 'import RNCKakaoUser';

    if (!contents.includes(importAnchor)) {
      contents = `${importAnchor}\n${contents}`;
    }

    if (!contents.includes(importMod)) {
      contents = contents.replace(importAnchor, importAnchor + '\n' + importMod);
    }

    if (!contents.includes('RNCKakaoUserUtil.handleOpen(url)')) {
      contents = insertContentsInsideSwiftFunctionBlock(
        contents,
        'application(_:open:options:)',
        'if(RNCKakaoUserUtil.isKakaoTalkLoginUrl(url)) { return RNCKakaoUserUtil.handleOpen(url) }',
        { position: 'head' },
      );
    }

    return contents;
  };

  return withAppDelegate(config, (props) => {
    const { modResults } = props;
    if (['objc', 'objcpp'].includes(modResults.language)) {
      modResults.contents = modifyObjcContents(modResults.contents);
    } else if (modResults.language === 'swift') {
      modResults.contents = modifySwiftContents(modResults.contents);
    }

    return props;
  });
};

export { withIos };
