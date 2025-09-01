<p align="center">
  <a href="https://rnkakao.mjstudio.net">
    <img width="160px" src="https://raw.githubusercontent.com/mym0404/image-archive/master/202404201234177.webp"><br/>
  </a>
  <h1 align="center">React Native Kakao</h1>
  <p align="center">
  <a href="https://www.npmjs.com/package/@react-native-kakao/core"><img src="https://img.shields.io/npm/dm/@react-native-kakao/core.svg?style=flat-square" alt="NPM downloads"></a>
  <a href="https://www.npmjs.com/package/@react-native-kakao/core"><img src="https://img.shields.io/npm/v/@react-native-kakao/core.svg?style=flat-square" alt="NPM version"></a>
  <a href="/LICENSE"><img src="https://img.shields.io/npm/l/@react-native-kakao/core.svg?style=flat-square" alt="License"></a>
  <a href="https://github.com/lerna-lite/lerna-lite"><img src="https://img.shields.io/badge/maintained%20with-lerna--lite-e137ff?style=flat-square" alt="License"></a>
  <h3 align="center">Native Kakao SDK All In One Solution</h3>
  </p>
</p>
<a href="https://rnkakao.mjstudio.net">Documentation(en, ko)</a>

**React Native Kakao** is a collection of React Native modules connecting you to Kakao
services; each module is a light-weight JavaScript layer connecting you to the native Kakao SDKs for
iOS, Android and Web.

## Highlights

- ❤️ **No version conflicts**
  - managed and consistent versions of native SDKs ensure there are no version conflicts.
- 🍎 **Consistent logic for each platform**
  - same JS code => same android, ios, web logics are ensured.
- ⚡️ **Easy coding, Fast development**
  - all APIs are designed with the DX as the top priority.
- 🎃 **Well typed**
  - first class support for **Typescript** included
- 📄 **Well documented**
  - full reference & installation documentation alongside detailed guides and FAQs
- 🚀 **Wide supportability**
  - first class supports for **Android, iOS, Web, New Architecture, Old Architecture, even Expo**
- 🦋 **Robust error handling**
  - All SDK errors are forwarded to JS clearly, consistently for each platform.

> [!IMPORTANT]
> We releases Web platform in V2!
>
> https://github.com/mym0404/react-native-kakao/assets/33388801/0bf4cf3b-8a00-4291-a705-0bebbf5d7fad

## Kakao Modules

This is the root of the mono-repo for React Native Kakao, if you're looking for a specific package
please select the package link from below.

[//]: # (The main package that you interface with is `App` &#40;`@react-native-kakao/app`&#41;)

| Name                                                                                                              | Android                                                                                                                                                                 | iOS                                                                                                                                                                     | Web                                                                              |                                                                             Downloads                                                                             | Status |
|-------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------:|--------|
| [Core](https://rnkakao.mjstudio.net/docs/intro)                                                                            | ![common-android](https://img.shields.io/badge/common-2.20.1-green?style=flat-square)                                                                                   | ![common-ios](https://img.shields.io/badge/common-2.22.0-lightblue?style=flat-square)                                                                                   | ![web-sdk](https://img.shields.io/badge/js--sdk-+2.7.1-2460a1?style=flat-square) |    [![badge](https://img.shields.io/npm/dm/@react-native-kakao/core.svg?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/@react-native-kakao/core)    | ✅      |
| [Share](https://rnkakao.mjstudio.net/docs/share/intro)                                                                     | ![share-android](https://img.shields.io/badge/share-2.20.1-green?style=flat-square)                                                                                     | ![share-ios](https://img.shields.io/badge/share-2.22.0-lightblue?style=flat-square)                                                                                     | ![web-sdk](https://img.shields.io/badge/js--sdk-+2.7.1-2460a1?style=flat-square) |   [![badge](https://img.shields.io/npm/dm/@react-native-kakao/share.svg?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/@react-native-kakao/share)   | ✅      |
| [User](https://rnkakao.mjstudio.net/docs/user/intro)                                                                       | ![user-android](https://img.shields.io/badge/user-2.20.1-green?style=flat-square)                                                                                       | ![user-ios](https://img.shields.io/badge/user-2.22.0-lightblue?style=flat-square)                                                                                       | ![web-sdk](https://img.shields.io/badge/js--sdk-+2.7.1-2460a1?style=flat-square) |    [![badge](https://img.shields.io/npm/dm/@react-native-kakao/user.svg?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/@react-native-kakao/user)    | ✅      |
| [Social](https://rnkakao.mjstudio.net/docs/social/intro)                                                                   | ![talk-android](https://img.shields.io/badge/talk-2.20.1-green?style=flat-square) ![friend-android](https://img.shields.io/badge/friend-2.20.1-green?style=flat-square) | ![talk-ios](https://img.shields.io/badge/talk-2.22.0-lightblue?style=flat-square) ![friend-ios](https://img.shields.io/badge/friend-2.22.0-lightblue?style=flat-square) | ![web-sdk](https://img.shields.io/badge/js--sdk-+2.7.1-2460a1?style=flat-square) |  [![badge](https://img.shields.io/npm/dm/@react-native-kakao/social.svg?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/@react-native-kakao/social)  | ✅      |
| [Channel](https://rnkakao.mjstudio.net/docs/channel/intro)                                                                 | ![talk-android](https://img.shields.io/badge/talk-2.20.1-green?style=flat-square)                                                                                       | ![talk-ios](https://img.shields.io/badge/talk-2.22.0-lightblue?style=flat-square)                                                                                       | ![web-sdk](https://img.shields.io/badge/js--sdk-+2.7.1-2460a1?style=flat-square) | [![badge](https://img.shields.io/npm/dm/@react-native-kakao/channel.svg?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/@react-native-kakao/channel) | ✅      |
| [Navi](https://rnkakao.mjstudio.net/docs/navi/intro)                                                                       | ![navi-android](https://img.shields.io/badge/navi-2.20.1-green?style=flat-square)                                                                                       | ![navi-ios](https://img.shields.io/badge/navi-2.22.0-lightblue?style=flat-square)                                                                                       | ![web-sdk](https://img.shields.io/badge/js--sdk-+2.7.1-2460a1?style=flat-square) |    [![badge](https://img.shields.io/npm/dm/@react-native-kakao/navi.svg?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/@react-native-kakao/navi)    | ✅      |

## Documentation

- [Quick Start](https://rnkakao.mjstudio.net)

## Sponsors

These are our really cool sponsors!

<!-- sponsors --><a href="https://github.com/esc5221"><img src="https:&#x2F;&#x2F;github.com&#x2F;esc5221.png" width="80px" alt="esc5221" /></a>&nbsp;&nbsp;<a href="https://github.com/jun-jaehyuk-lee"><img src="https:&#x2F;&#x2F;github.com&#x2F;jun-jaehyuk-lee.png" width="80px" alt="jun-jaehyuk-lee" /></a>&nbsp;&nbsp;<a href="https://github.com/floydkim"><img src="https:&#x2F;&#x2F;github.com&#x2F;floydkim.png" width="80px" alt="floydkim" /></a>&nbsp;&nbsp;<a href="https://github.com/zeallat"><img src="https:&#x2F;&#x2F;github.com&#x2F;zeallat.png" width="80px" alt="zeallat" /></a>&nbsp;&nbsp;<a href="https://github.com/sarbogast"><img src="https:&#x2F;&#x2F;github.com&#x2F;sarbogast.png" width="80px" alt="sarbogast" /></a>&nbsp;&nbsp;<a href="https://github.com/RyuWoong"><img src="https:&#x2F;&#x2F;github.com&#x2F;RyuWoong.png" width="80px" alt="RyuWoong" /></a>&nbsp;&nbsp;<!-- sponsors -->

## Contributing

- [Contributing](https://github.com/mym0404/react-native-kakao/blob/main/CONTRIBUTING.md)
- [Issues](https://github.com/mym0404/react-native-kakao/issues)
- [PRs](https://github.com/mym0404/react-native-kakao/pulls)
- [Documentation](https://rnkakao.mjstudio.net)
- [Code of Conduct](https://github.com/mym0404/react-native-kakao/blob/main/CODE_OF_CONDUCT.md)

## License

- See [LICENSE](/LICENSE)

---

<p align="center">
  <a href="https://mjstudio.net/">
    <img width="75px" src="https://raw.githubusercontent.com/mym0404/image-archive/master/202404201239152.webp">
  </a>
  <p align="center">
    Built and maintained by <a href="https://mjstudio.net/">MJ Studio</a>.
  </p>
</p>
