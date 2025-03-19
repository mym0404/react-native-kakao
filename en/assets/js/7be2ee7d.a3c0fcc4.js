"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[602],{5987:(e,n,i)=>{i.r(n),i.d(n,{assets:()=>a,contentTitle:()=>t,default:()=>h,frontMatter:()=>r,metadata:()=>c,toc:()=>l});var s=i(4848),o=i(8453);const r={sidebar_position:101},t="Kakao Login",c={id:"user/login",title:"Kakao Login",description:"Logging In",source:"@site/i18n/en/docusaurus-plugin-content-docs/current/user/login.mdx",sourceDirName:"user",slug:"/user/login",permalink:"/en/docs/user/login",draft:!1,unlisted:!1,editUrl:"https://github.com/mym0404/react-native-kakao/tree/main/docs/docs/user/login.mdx",tags:[],version:"current",sidebarPosition:101,frontMatter:{sidebar_position:101},sidebar:"tutorialSidebar",previous:{title:"Expo Configuration",permalink:"/en/docs/user/intro-expo"},next:{title:"Kakao Login (Web)",permalink:"/en/docs/user/login-web"}},a={},l=[{value:"Logging In",id:"logging-in",level:2},{value:"Usage",id:"usage",level:2},{value:"Parameters",id:"parameters",level:3},{value:"Response",id:"response",level:3},{value:"Logging Out",id:"logging-out",level:2},{value:"Revoking Account Linkage",id:"revoking-account-linkage",level:2},{value:"Checking Current Login Status",id:"checking-current-login-status",level:2},{value:"Checking KakaoTalk Availability",id:"checking-kakaotalk-availability",level:2}];function d(e){const n={a:"a",admonition:"admonition",code:"code",h1:"h1",h2:"h2",h3:"h3",img:"img",li:"li",p:"p",pre:"pre",ul:"ul",...(0,o.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(n.h1,{id:"kakao-login",children:"Kakao Login"}),"\n",(0,s.jsx)(n.h2,{id:"logging-in",children:"Logging In"}),"\n",(0,s.jsx)(n.p,{children:"You can perform tasks like user registration, login, receiving additional consent, and obtaining agreement for terms using Kakao Login."}),"\n",(0,s.jsx)(n.p,{children:(0,s.jsx)(n.img,{src:"https://raw.githubusercontent.com/mym0404/image-archive/master/202404271643817.webp",alt:"image"})}),"\n",(0,s.jsx)(n.h2,{id:"usage",children:"Usage"}),"\n",(0,s.jsxs)(n.p,{children:["Calling the ",(0,s.jsx)(n.code,{children:"login()"})," function will trigger the login process immediately."]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-tsx",children:"import { login } from '@react-native-kakao/user';\n\n...\n\n// highlight-next-line\nlogin()\n"})}),"\n",(0,s.jsx)(n.h3,{id:"parameters",children:"Parameters"}),"\n",(0,s.jsx)(n.p,{children:"All parameters are optional."}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"serviceTerms"}),": Additional feature to specify specific service terms for the Kakao login consent screen, based on the user's service registration scenario. Specify the service terms tags to be included in the consent screen by setting the ",(0,s.jsx)(n.code,{children:"serviceTerms"})," parameter when making a Kakao login request. Include one or more service terms set as [required consent] to display the consent screen and obtain user consent."]}),"\n"]}),"\n",(0,s.jsx)(n.admonition,{type:"info",children:(0,s.jsx)(n.p,{children:"This feature is only available for services implementing Kakao Sync."})}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"prompts"}),": Allows control over the login process by passing flags."]}),"\n"]}),"\n",(0,s.jsxs)(n.p,{children:["Pass ",(0,s.jsx)(n.code,{children:"Login"}),", ",(0,s.jsx)(n.code,{children:"Create"}),", ",(0,s.jsx)(n.code,{children:"Cert"}),", ",(0,s.jsx)(n.code,{children:"UnifyDaum"}),", or ",(0,s.jsx)(n.code,{children:"SelectAccount(Android only)"})," as a ",(0,s.jsx)(n.code,{children:"string[]"}),"."]}),"\n",(0,s.jsxs)(n.p,{children:["For detailed descriptions, refer to the ",(0,s.jsx)(n.a,{href:"https://developers.kakao.com/docs/latest/ko/kakaologin/ios#request-code-re-authentication",children:"Official Documentation"}),"."]}),"\n",(0,s.jsx)(n.admonition,{type:"info",children:(0,s.jsx)(n.p,{children:"Sent when attempting a login with a Kakao account instead of KakaoTalk."})}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"scopes"}),": Used when requesting additional consent from the user. Pass the items that require consent."]}),"\n"]}),"\n",(0,s.jsxs)(n.p,{children:["Refer to the ",(0,s.jsx)(n.a,{href:"https://developers.kakao.com/docs/latest/ko/kakaologin/android#request-code-additional-consent",children:"Official Documentation"})," for details."]}),"\n",(0,s.jsxs)(n.p,{children:["Check the ",(0,s.jsx)(n.code,{children:"xxxNeedsAgreement"})," properties in the ",(0,s.jsx)(n.code,{children:"me()"})," function to get items that require additional consent."]}),"\n",(0,s.jsxs)(n.p,{children:["If ",(0,s.jsx)(n.code,{children:"scopes"})," are provided, it always executes login with a Kakao account."]}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"useKakaoAccountLogin"}),": Attempt login with a Kakao account instead of KakaoTalk."]}),"\n"]}),"\n",(0,s.jsxs)(n.admonition,{title:"Warning",type:"warning",children:[(0,s.jsx)(n.p,{children:"Errors will be thrown under the following conditions:"}),(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:["If ",(0,s.jsx)(n.code,{children:"useKakaoAccountLogin"})," does not exist or is ",(0,s.jsx)(n.code,{children:"false"}),", ",(0,s.jsx)(n.code,{children:"prompts"})," and ",(0,s.jsx)(n.code,{children:"scopes"})," cannot be passed."]}),"\n"]}),(0,s.jsxs)(n.p,{children:["For KakaoTalk login, ",(0,s.jsx)(n.code,{children:"prompts"})," and ",(0,s.jsx)(n.code,{children:"scopes"})," cannot be passed (Native SDK restriction)."]}),(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:["If ",(0,s.jsx)(n.code,{children:"scopes"})," are passed, ",(0,s.jsx)(n.code,{children:"serviceTerms"})," and ",(0,s.jsx)(n.code,{children:"prompts"})," cannot be passed."]}),"\n"]}),(0,s.jsxs)(n.p,{children:["When requesting additional consent, ",(0,s.jsx)(n.code,{children:"serviceTerms"})," and ",(0,s.jsx)(n.code,{children:"prompts"})," cannot be passed together (Native SDK restriction)."]})]}),"\n",(0,s.jsx)(n.h3,{id:"response",children:"Response"}),"\n",(0,s.jsxs)(n.p,{children:["Returns token-related information via a ",(0,s.jsx)(n.code,{children:"Promise"}),"."]}),"\n",(0,s.jsx)(n.p,{children:"The response includes the following:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-tsx",metastring:"title='KakaoLoginToken'",children:"{\n  accessToken: string;\n  refreshToken: string;\n  tokenType?: string;\n  idToken?: string;\n  accessTokenExpiresAt: number; // unix\n  refreshTokenExpiresAt: number; // unix\n  accessTokenExpiresIn: number; // seconds\n  refreshTokenExpiresIn: number; // seconds\n  scopes: string[];\n};\n"})}),"\n",(0,s.jsx)(n.h2,{id:"logging-out",children:"Logging Out"}),"\n",(0,s.jsxs)(n.p,{children:["You can log out using ",(0,s.jsx)(n.code,{children:"logout()"}),"."]}),"\n",(0,s.jsx)(n.h2,{id:"revoking-account-linkage",children:"Revoking Account Linkage"}),"\n",(0,s.jsxs)(n.p,{children:["Use ",(0,s.jsx)(n.code,{children:"unlink()"})," to revoke account linkage."]}),"\n",(0,s.jsx)(n.h2,{id:"checking-current-login-status",children:"Checking Current Login Status"}),"\n",(0,s.jsxs)(n.p,{children:["Use ",(0,s.jsx)(n.code,{children:"isLogined()"})," to check if the user is currently logged in. It returns a ",(0,s.jsx)(n.code,{children:"Promise<boolean>"}),"."]}),"\n",(0,s.jsx)(n.h2,{id:"checking-kakaotalk-availability",children:"Checking KakaoTalk Availability"}),"\n",(0,s.jsxs)(n.p,{children:["Use ",(0,s.jsx)(n.code,{children:"isKakaoTalkLoginAvailable()"})," to check if KakaoTalk login is available. It returns a ",(0,s.jsx)(n.code,{children:"Promise<boolean>"}),"."]})]})}function h(e={}){const{wrapper:n}={...(0,o.R)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(d,{...e})}):d(e)}},8453:(e,n,i)=>{i.d(n,{R:()=>t,x:()=>c});var s=i(6540);const o={},r=s.createContext(o);function t(e){const n=s.useContext(r);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function c(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:t(e.components),s.createElement(r.Provider,{value:n},e.children)}}}]);