"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[7067],{4799:(e,i,t)=>{t.r(i),t.d(i,{assets:()=>c,contentTitle:()=>r,default:()=>p,frontMatter:()=>o,metadata:()=>s,toc:()=>d});var n=t(4848),a=t(8453);const o={sidebar_position:2},r="Initialize the SDK",s={id:"core/initialize-sdk",title:"Initialize the SDK",description:"Initialize the SDK",source:"@site/i18n/en/docusaurus-plugin-content-docs/current/core/initialize-sdk.mdx",sourceDirName:"core",slug:"/core/initialize-sdk",permalink:"/en/docs/core/initialize-sdk",draft:!1,unlisted:!1,editUrl:"https://github.com/mym0404/react-native-kakao/tree/main/docs/docs/core/initialize-sdk.mdx",tags:[],version:"current",sidebarPosition:2,frontMatter:{sidebar_position:2},sidebar:"tutorialSidebar",previous:{title:"Getting Started with Kakao SDK",permalink:"/en/docs/core/intro"},next:{title:"Getting Android Key Hash",permalink:"/en/docs/core/get-android-keyhash"}},c={},d=[{value:"Initialize the SDK",id:"initialize-the-sdk-1",level:2},{value:"Web Platform",id:"web-platform",level:2}];function l(e){const i={admonition:"admonition",code:"code",h1:"h1",h2:"h2",p:"p",pre:"pre",...(0,a.R)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(i.h1,{id:"initialize-the-sdk",children:"Initialize the SDK"}),"\n",(0,n.jsx)(i.h2,{id:"initialize-the-sdk-1",children:"Initialize the SDK"}),"\n",(0,n.jsxs)(i.p,{children:["Call the ",(0,n.jsx)(i.code,{children:"initializeKakaoSDK"})," function in ",(0,n.jsx)(i.code,{children:"index.js"})," or ",(0,n.jsx)(i.code,{children:"App.tsx"}),", or similar, before any Kakao SDK is used after the app starts."]}),"\n",(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:"language-tsx",metastring:"title='index.js'",children:"import { initializeKakaoSDK } from '@react-native-kakao/core';\n\ninitializeKakaoSDK('{{ native app key }}');\n"})}),"\n",(0,n.jsx)(i.admonition,{type:"info",children:(0,n.jsx)(i.p,{children:"This function must always be called first, before any Kakao API is invoked."})}),"\n",(0,n.jsx)(i.h2,{id:"web-platform",children:"Web Platform"}),"\n",(0,n.jsxs)(i.p,{children:["If supporting the Web, you must also pass the javascript key and rest api key with the ",(0,n.jsx)(i.code,{children:"web"})," option."]}),"\n",(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:"language-ts",children:"import { initializeKakaoSDK } from '@react-native-kakao/core';\n\nCore.initializeKakaoSDK('{{ native app key }}', {\n  web: {\n    javascriptKey: '{{ javascript key }}',\n    restApiKey: '{{ rest api key }}',\n  },\n});\n"})})]})}function p(e={}){const{wrapper:i}={...(0,a.R)(),...e.components};return i?(0,n.jsx)(i,{...e,children:(0,n.jsx)(l,{...e})}):l(e)}},8453:(e,i,t)=>{t.d(i,{R:()=>r,x:()=>s});var n=t(6540);const a={},o=n.createContext(a);function r(e){const i=n.useContext(o);return n.useMemo((function(){return"function"==typeof e?e(i):{...i,...e}}),[i,e])}function s(e){let i;return i=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:r(e.components),n.createElement(o.Provider,{value:i},e.children)}}}]);