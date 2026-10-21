import { insertContentsInsideSwiftClassBlock } from '@expo/config-plugins/build/ios/codeMod';
import { type ConfigPlugin, withAppDelegate, withInfoPlist } from 'expo/config-plugins';

import type { KakaoIosConfig } from './type';

const kakaoUrlTypeName = 'Kakao';

const withIos: ConfigPlugin<{
  scheme: string;
  ios: KakaoIosConfig;
}> = (
  config,
  { scheme, ios: { handleKakaoOpenUrl, handleKakaoCertOpenUrl, naviApplicationQuerySchemes } },
) => {
  config = withInfoPlist(config, (config) => {
    if (!config.modResults.LSApplicationQueriesSchemes) {
      config.modResults.LSApplicationQueriesSchemes = [];
    }

    if (!config.modResults.CFBundleURLTypes) {
      config.modResults.CFBundleURLTypes = [];
    }

    // core
    const kakaoUrlType = config.modResults.CFBundleURLTypes.find(
      (type) => type.CFBundleURLName === kakaoUrlTypeName,
    );

    if (kakaoUrlType) {
      kakaoUrlType.CFBundleURLSchemes = [scheme];
    } else if (
      !config.modResults.CFBundleURLTypes.some((type) => type.CFBundleURLSchemes.includes(scheme))
    ) {
      config.modResults.CFBundleURLTypes = [
        ...config.modResults.CFBundleURLTypes,
        {
          CFBundleURLSchemes: [scheme],
          CFBundleURLName: kakaoUrlTypeName,
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

    if (handleKakaoCertOpenUrl) {
      config.modResults.LSApplicationQueriesSchemes = [
        ...new Set([...config.modResults.LSApplicationQueriesSchemes, 'kakaotalk']),
      ];
    }

    // kakao navi
    if (naviApplicationQuerySchemes) {
      config.modResults.LSApplicationQueriesSchemes = [
        ...new Set([...config.modResults.LSApplicationQueriesSchemes, 'kakaonavi-sdk']),
      ];
    }

    return config;
  });

  if (handleKakaoOpenUrl) {
    config = withKakaoSdkAppDelegate(config, { module: 'User' });
  }

  if (handleKakaoCertOpenUrl) {
    config = withKakaoSdkAppDelegate(config, { module: 'Cert' });
  }

  return config;
};

const withKakaoSdkAppDelegate: ConfigPlugin<{ module: 'User' | 'Cert' }> = (config, { module }) => {
  const bridgeName = `RNCKakao${module}Util`;
  const urlCheck = module === 'User' ? 'isKakaoTalkLoginUrl' : 'isKakaoTalkSignReturnUrl';
  const modifyObjcContents = (contents: string): string => {
    const importRctLinkingManager = '#import <React/RCTLinkingManager.h>';
    const importMod = `#import <RNCKakao${module}/${bridgeName}.h>`;

    if (!contents.includes(importRctLinkingManager)) {
      contents = `${importRctLinkingManager}\n${contents}`;
    }

    if (!contents.includes(importMod)) {
      contents = contents.replace(
        importRctLinkingManager,
        importRctLinkingManager + '\n' + importMod,
      );
    }

    if (!contents.includes(`${bridgeName} handleOpenUrl`)) {
      contents = contents.replace(
        'options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {',
        `options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
        if([${bridgeName} ${urlCheck}:url]) { return [${bridgeName} handleOpenUrl:url]; }
        `,
      );
    }

    return contents;
  };

  const modifySwiftContents = (contents: string): string => {
    const importAnchor = 'import Expo';
    const importMod = `import RNCKakao${module}`;
    // Match the full signature because AppDelegate has multiple three-parameter application callbacks.
    const openUrlFunctionPattern =
      /\bfunc\s+application\s*\(\s*_\s+[^\s:]+\s*:\s*UIApplication\s*,\s*open\s+([^\s:]+)\s*:\s*URL\s*,\s*options(?:\s+[^\s:]+)?\s*:\s*\[UIApplication\.OpenURLOptionsKey\s*:\s*Any\]\s*(?:=\s*\[:\])?\s*\)\s*->\s*Bool\s*\{/m;
    const openUrlFunction = contents.match(openUrlFunctionPattern);
    const localUrlParameter = openUrlFunction?.[1];
    let urlParameter = localUrlParameter ?? 'url';
    if (urlParameter === '_') {
      urlParameter = 'kakaoUrl';
      while (contents.includes(urlParameter)) {
        urlParameter += '_';
      }
    }

    const kakaoOpenUrlCall = `${bridgeName}.handleOpen(${urlParameter})`;
    const kakaoOpenUrlHandler = `if(${bridgeName}.${urlCheck}(${urlParameter})) { return ${kakaoOpenUrlCall} }`;

    if (!contents.includes(importAnchor)) {
      contents = `${importAnchor}\n${contents}`;
    }

    if (!contents.includes(importMod)) {
      contents = contents.replace(importAnchor, importAnchor + '\n' + importMod);
    }

    if (!contents.includes(kakaoOpenUrlCall)) {
      if (openUrlFunction) {
        contents = contents.replace(
          openUrlFunctionPattern,
          (declaration) =>
            `${declaration.replace(/\bopen\s+_\s*:/, `open ${urlParameter}:`)}\n    ${kakaoOpenUrlHandler}`,
        );
      } else {
        contents = insertContentsInsideSwiftClassBlock(
          contents,
          'class AppDelegate',
          `
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    ${kakaoOpenUrlHandler}
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }
`,
          { position: 'tail' },
        );
      }
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
