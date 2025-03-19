"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[7573],{8595:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>c,contentTitle:()=>s,default:()=>h,frontMatter:()=>o,metadata:()=>r,toc:()=>d});var i=t(4848),a=t(8453);const o={sidebar_position:6},s="Share Route to Destination",r={id:"navi/share-destination",title:"Share Route to Destination",description:"Share Route to Destination",source:"@site/i18n/en/docusaurus-plugin-content-docs/current/navi/share-destination.mdx",sourceDirName:"navi",slug:"/navi/share-destination",permalink:"/en/docs/navi/share-destination",draft:!1,unlisted:!1,editUrl:"https://github.com/mym0404/react-native-kakao/tree/main/docs/docs/navi/share-destination.mdx",tags:[],version:"current",sidebarPosition:6,frontMatter:{sidebar_position:6},sidebar:"tutorialSidebar",previous:{title:"Start Route Guidance to Destination",permalink:"/en/docs/navi/navigate-destination"},next:{title:"Advanced",permalink:"/en/docs/category/advanced"}},c={},d=[{value:"Share Route to Destination",id:"share-route-to-destination-1",level:2},{value:"Usage",id:"usage",level:2}];function l(e){const n={a:"a",admonition:"admonition",code:"code",h1:"h1",h2:"h2",li:"li",p:"p",pre:"pre",ul:"ul",...(0,a.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(n.h1,{id:"share-route-to-destination",children:"Share Route to Destination"}),"\n",(0,i.jsx)(n.h2,{id:"share-route-to-destination-1",children:"Share Route to Destination"}),"\n",(0,i.jsx)(n.p,{children:(0,i.jsx)(n.a,{href:"https://developers.kakao.com/docs/latest/ko/kakaonavi/android",children:"Official Documentation"})}),"\n",(0,i.jsx)(n.h2,{id:"usage",children:"Usage"}),"\n",(0,i.jsxs)(n.p,{children:["You can share the route by launching the Kakao Navigation app using the ",(0,i.jsx)(n.code,{children:"shareTo()"})," function."]}),"\n",(0,i.jsx)(n.p,{children:"It is defined as follows:"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-tsx",children:"export function shareTo(params: {\n  destination: KakaoNaviLocation;\n  option?: KakaoNaviOption;\n  viaList?: KakaoNaviLocation[];\n  openWebInstallUrlIfNaviAppNotAvailable?: boolean;\n}): Promise<boolean>\n"})}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"destination"}),": The destination information, which is a required parameter."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"option"}),": Options for navigation."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"viaList"}),": List of via points."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"openWebInstallUrlIfNaviAppNotAvailable"}),": Whether to automatically redirect to the installation screen if Kakao Navigation app is not available.\nThe default value is ",(0,i.jsx)(n.code,{children:"true"}),"."]}),"\n"]}),"\n",(0,i.jsxs)(n.p,{children:["For detailed explanations of the options, refer to the ",(0,i.jsx)(n.a,{href:"https://developers.kakao.com/docs/latest/ko/kakaonavi/android#set-parameter",children:"Official Documentation"}),"."]}),"\n",(0,i.jsxs)(n.admonition,{type:"info",children:[(0,i.jsxs)(n.p,{children:["Since Navi has a specific option that guides the installation process, if the app execution fails, the ",(0,i.jsx)(n.code,{children:"Package-KakaoAppNotAvailable"})," error code will not be rejected as a ",(0,i.jsx)(n.code,{children:"Promise"}),"."]}),(0,i.jsx)(n.p,{children:"Instead, you can determine if the app was executed without issues based on the resolved result."})]}),"\n",(0,i.jsxs)(n.admonition,{type:"warning",children:[(0,i.jsx)(n.p,{children:"Route guidance is not available on the web platform."}),(0,i.jsx)(n.p,{children:"If on a mobile web, the browser will be redirected to the Kakao Navi execution/installation guide screen if the Kakao Navigation app is not available."}),(0,i.jsx)(n.p,{children:"For desktop web, nothing will happen."}),(0,i.jsx)(n.p,{children:"This is an announcement of the end of support for route guidance on the Kakao Navi web version from Kakao's JavaScript SDK."}),(0,i.jsx)(n.p,{children:(0,i.jsx)(n.a,{href:"https://devtalk.kakao.com/t/notice-end-of-support-for-kakao-navi-web-version/120188",children:"Dev Talk Announcement"})})]})]})}function h(e={}){const{wrapper:n}={...(0,a.R)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(l,{...e})}):l(e)}},8453:(e,n,t)=>{t.d(n,{R:()=>s,x:()=>r});var i=t(6540);const a={},o=i.createContext(a);function s(e){const n=i.useContext(o);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function r(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:s(e.components),i.createElement(o.Provider,{value:n},e.children)}}}]);