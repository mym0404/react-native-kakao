"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[8114],{3148:(e,n,r)=>{r.r(n),r.d(n,{assets:()=>c,contentTitle:()=>t,default:()=>h,frontMatter:()=>a,metadata:()=>s,toc:()=>l});var o=r(4848),i=r(8453);const a={sidebar_position:100},t="Error Handling",s={id:"error-handling",title:"Error Handling",description:"This document refers to errors as those that can be caught through logic such as catch when a Promise is rejected during an API call.",source:"@site/i18n/en/docusaurus-plugin-content-docs/current/error-handling.mdx",sourceDirName:".",slug:"/error-handling",permalink:"/en/docs/error-handling",draft:!1,unlisted:!1,editUrl:"https://github.com/mym0404/react-native-kakao/tree/main/docs/docs/error-handling.mdx",tags:[],version:"current",sidebarPosition:100,frontMatter:{sidebar_position:100},sidebar:"tutorialSidebar",previous:{title:"Expo Settings",permalink:"/en/docs/install-expo"},next:{title:"Package - Core",permalink:"/en/docs/category/package---core"}},c={},l=[{value:"Synchronization at the Moment of API Call Errors",id:"synchronization-at-the-moment-of-api-call-errors",level:2},{value:"Form of Errors",id:"form-of-errors",level:2},{value:"Example of Handling Errors",id:"example-of-handling-errors",level:2},{value:"Package Error References",id:"package-error-references",level:2},{value:"Android&#39;s ActivityNotFoundException",id:"androids-activitynotfoundexception",level:2}];function d(e){const n={admonition:"admonition",code:"code",h1:"h1",h2:"h2",li:"li",p:"p",pre:"pre",ul:"ul",...(0,i.R)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(n.h1,{id:"error-handling",children:"Error Handling"}),"\n",(0,o.jsxs)(n.p,{children:["This document refers to errors as those that can be caught through logic such as ",(0,o.jsx)(n.code,{children:"catch"})," when a ",(0,o.jsx)(n.code,{children:"Promise"})," is ",(0,o.jsx)(n.code,{children:"rejected"})," during an API call."]}),"\n",(0,o.jsx)(n.h2,{id:"synchronization-at-the-moment-of-api-call-errors",children:"Synchronization at the Moment of API Call Errors"}),"\n",(0,o.jsx)(n.admonition,{type:"info",children:(0,o.jsxs)(n.p,{children:["Currently supported platforms, ",(0,o.jsx)(n.code,{children:"Android"})," and ",(0,o.jsx)(n.code,{children:"iOS"}),", have almost no difference in the scenarios where errors occur."]})}),"\n",(0,o.jsxs)(n.p,{children:["For example, let\u2019s consider the ",(0,o.jsx)(n.code,{children:"me"})," function in the Native Kakao SDK, which fetches user information on both Android and iOS."]}),"\n",(0,o.jsx)(n.p,{children:"The Kakao SDK adopts an internal callback method of implementation (this package does not necessarily use ReactiveX)."}),"\n",(0,o.jsx)(n.p,{children:"Most API wrapper functions take the following form:"}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-swift",metastring:"title='ios.swift'",children:'@objc public func me(\n    _ resolve: @escaping RCTPromiseResolveBlock,\n    reject: @escaping RCTPromiseRejectBlock\n) {\n  onMain {\n    UserApi.shared.me { user, error in\n      if let error {\n        RNCKakaoUtil.reject(reject, error)\n      } else if let user {\n        resolve([\n          "id": user.id as Any\n          //...\n        ])\n      } else {\n        RNCKakaoUtil.reject(reject, RNCKakaoError.responseNotFound(name: "user"))\n      }\n    }\n  }\n}\n'})}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-kotlin",metastring:"title='android.kt'",children:'@ReactMethod\noverride fun me(promise: Promise) =\n  onMain {\n    UserApiClient.instance.me { user, error ->\n      if (error != null) {\n        promise.rejectWith(error)\n      } else if (user == null) {\n        promise.rejectWith(RNCKakaoResponseNotFoundException("user"))\n      } else {\n        promise.resolve(\n          argMap().apply {\n            putIntIfNotNull("id", user.id?.toInt())\n            // ...\n          },\n        )\n      }\n    }\n  }\n'})}),"\n",(0,o.jsx)(n.p,{children:"Kakao SDK's callback functions always follow the same format: the first argument is the result, and the second argument signifies an error."}),"\n",(0,o.jsxs)(n.p,{children:["If the error is not ",(0,o.jsx)(n.code,{children:"null"}),", it indicates that an error has occurred."]}),"\n",(0,o.jsx)(n.p,{children:"Additionally, this package checks whether the first argument contains a meaningful value."}),"\n",(0,o.jsx)(n.admonition,{type:"note",children:(0,o.jsx)(n.p,{children:"This behavior is probably a meaningless act (TILT)."})}),"\n",(0,o.jsx)(n.p,{children:"If neither condition is met, it successfully returns the result."}),"\n",(0,o.jsx)(n.h2,{id:"form-of-errors",children:"Form of Errors"}),"\n",(0,o.jsxs)(n.p,{children:["The error objects passed to JavaScript's ",(0,o.jsx)(n.code,{children:"catch"})," can vary slightly by platform."]}),"\n",(0,o.jsx)(n.p,{children:"While the Native Kakao SDK communicates error codes by platform, this package prefers to transfer meaningful values directly rather than integrating all error interfaces,\nadopting a transitive manner of conveyance."}),"\n",(0,o.jsxs)(n.p,{children:["However, most errors can be identified by ",(0,o.jsx)(n.code,{children:"code"}),", and typically have the following structure:"]}),"\n",(0,o.jsx)(n.p,{children:"This is because this package has been developed with a lot of attention to delivering meaningful values for convenient error handling."}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsx)(n.li,{children:"Android"}),"\n"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-js",children:'{\n  "message": "authentication tokens don\'t exist.",\n  "code": "TokenNotFound",\n  "nativeStackAndroid": [],\n  "userInfo": {\n    "isAppsFailed": false,\n    "isInvalidTokenError": false,\n    "isClientFailed": true,\n    "fatal": true,\n    "isAuthFailed": false,\n    "isApiFailed": false,\n    "nativeErrorMessage": "authentication tokens don\'t exist."\n  }\n}\n'})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsx)(n.li,{children:"iOS"}),"\n"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-js",children:'{\n  "code": "TokenNotFound",\n  "message": "authentication tokens not exist.",\n  "nativeStackIOS": [\n    "0   KakaoExample                        0x000000010069dc9c RCTJSErrorFromCodeMessageAndNSError + 112",\n    "1   KakaoExample                        0x00000001009a023c ___ZZN8facebook5react15ObjCTurboModule13createPromiseERNS_3jsi7RuntimeENSt3__112basic_stringIcNS5_11char_traitsIcEENS5_9allocatorIcEEEEU13block_pointerFvU13block_pointerFvP11objc_objectEU13block_pointerFvP8NSStringSH_P7NSErrorEEENK3$_0clES4_RKNS2_5ValueEPSQ_m_block_invoke.59 + 388",\n    "2   KakaoExample                        0x00000001002c5e20 $sSo8NSStringCSgACSo7NSErrorCSgIeyByyy_SSSgAGs5Error_pSgIegggg_TR + 380",\n    // ...\n  ],\n  "domain": "RNCKakaoErrorDomain",\n  "userInfo": {\n    "isAuthFailed": false,\n    "isInvalidTokenError": false,\n    "isAppsFailed": false,\n    "isClientFailed": true,\n    "isApiFailed": false,\n    "fatal": false,\n    "nativeErrorMessage": "The operation couldn\u2019t be completed. (KakaoSDKCommon.SdkError error 0.)"\n  }\n}\n\n'})}),"\n",(0,o.jsxs)(n.p,{children:["The important fields are ",(0,o.jsx)(n.code,{children:"code"}),", ",(0,o.jsx)(n.code,{children:"message"}),", and other auxiliary information is contained within ",(0,o.jsx)(n.code,{children:"userInfo"}),"."]}),"\n",(0,o.jsx)(n.admonition,{title:"Warning",type:"warning",children:(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.code,{children:"code"})," is taken directly from the case names of Enum in Native Kakao SDK, so it can differ if these case names are differently defined in Native Kakao SDK. However, in most cases, they are the same."]})}),"\n",(0,o.jsx)(n.h2,{id:"example-of-handling-errors",children:"Example of Handling Errors"}),"\n",(0,o.jsxs)(n.p,{children:["You can check the actual ",(0,o.jsx)(n.code,{children:"code"})," values by referring to the official Android and iOS API documentation."]}),"\n",(0,o.jsx)(n.p,{children:"However, you can accurately distinguish and handle most errors using the following method:"}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-tsx",children:" selectSingleFriend({ mode: 'popup', options: {} })\n   .then((res) => showMessage({ message: formatJson(res) }))\n   .catch((e) => {\n     if (e && typeof e is 'object') {\n       if (e.code === 'TokenNotFound') {\n         showMessage({ type: 'warning', message: 'Failed to retrieve token' });\n       } else {\n         // ...\n       }\n     } else {\n       showMessage({ type: 'warning', message: 'Unknown error' });\n     }\n   })\n"})}),"\n",(0,o.jsx)(n.h2,{id:"package-error-references",children:"Package Error References"}),"\n",(0,o.jsxs)(n.p,{children:["In addition to errors in Kakao Native SDKs, there are also error ",(0,o.jsx)(n.code,{children:"codes"})," specific to the ",(0,o.jsx)(n.code,{children:"react-native-kakao"}),"."]}),"\n",(0,o.jsxs)(n.p,{children:["The error codes for this package always have the prefix ",(0,o.jsx)(n.code,{children:"Package-"}),"."]}),"\n",(0,o.jsx)(n.p,{children:"Here are the error codes:"}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"Package-Unknown"}),": Any uncategorized errors such as unknown programming errors, failing to show ",(0,o.jsx)(n.code,{children:"Activity"})," or ",(0,o.jsx)(n.code,{children:"ViewController"}),", or failing to open a URL. You can get detailed information through ",(0,o.jsx)(n.code,{children:"message"}),"."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"Package-APIResponseNotFound"}),": When a value that should be returned by the callback functions of the APIs in Kakao Native SDK does not exist even though ",(0,o.jsx)(n.code,{children:"error"})," does not exist."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"Package-SDKNotInitialized"}),": When the SDK has not been initialized at the time the Kakao API is to be used. Not all APIs return this error. It is often pre-checked in APIs that may crash the app if called without initializing the SDK."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"Package-KakaoAppNotAvailable"}),": For example, when an API that requires the installation of KakaoTalk fails because access to Kakao-related apps is unavailable. This includes cases where Kakao-related apps are installed but the app does not have proper permission to open Kakao-related apps."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"Package-Assertion"}),": When an assertion within the JavaScript logic of the package fails."]}),"\n"]}),"\n",(0,o.jsx)(n.h2,{id:"androids-activitynotfoundexception",children:"Android's ActivityNotFoundException"}),"\n",(0,o.jsxs)(n.p,{children:["APIs in Android that require ",(0,o.jsx)(n.code,{children:"Context"})," operate through ",(0,o.jsx)(n.code,{children:"getCurrentActivity()"})," provided by the React Native Module."]}),"\n",(0,o.jsxs)(n.p,{children:["This is because ",(0,o.jsx)(n.code,{children:"ReactApplicationContext"})," can lead to unexpected results as it demands additional flags for actions like ",(0,o.jsx)(n.code,{children:"startActivity"})," or information about the theme."]}),"\n",(0,o.jsxs)(n.p,{children:["Thus, an error is returned even if ",(0,o.jsx)(n.code,{children:"getCurrentActivity()"})," returns ",(0,o.jsx)(n.code,{children:"null"}),"."]})]})}function h(e={}){const{wrapper:n}={...(0,i.R)(),...e.components};return n?(0,o.jsx)(n,{...e,children:(0,o.jsx)(d,{...e})}):d(e)}},8453:(e,n,r)=>{r.d(n,{R:()=>t,x:()=>s});var o=r(6540);const i={},a=o.createContext(i);function t(e){const n=o.useContext(a);return o.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function s(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:t(e.components),o.createElement(a.Provider,{value:n},e.children)}}}]);