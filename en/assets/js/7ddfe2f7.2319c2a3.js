"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[6292],{8554:(e,t,n)=>{n.d(t,{Ay:()=>o});var a=n(4848),s=n(8453);function r(e){const t={a:"a",code:"code",h2:"h2",img:"img",p:"p",pre:"pre",...(0,s.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(t.p,{children:(0,a.jsx)(t.a,{href:"https://developers.kakao.com/docs/latest/ko/message/android-link#create-message",children:"Official Documentation"})}),"\n",(0,a.jsx)(t.p,{children:"This message format displays product information including the price. While it may not allow for adding as long text as a feed template or including social information, it has the advantage of informing users about the price information."}),"\n",(0,a.jsx)(t.p,{children:"Use Case: It is suitable for informing users about products sold in online shopping malls or promoting items by including price information (regular price, discount price, discount rate)."}),"\n",(0,a.jsx)(t.p,{children:(0,a.jsx)(t.img,{src:"https://raw.githubusercontent.com/mym0404/image-archive/master/202404220338423.webp",alt:"Image"})}),"\n",(0,a.jsx)(t.h2,{id:"template-type-definition",children:"Template Type Definition"}),"\n",(0,a.jsx)(t.pre,{children:(0,a.jsx)(t.code,{className:"language-ts",children:'/**\n * Commerce template class provided as a basic template\n *\n * @property content Content of the message including text, image, and link information\n * @property commerce Price information for the content\n * @property buttons Button list. Used when you want to change the button title and the link, or when you want to use two buttons. (Up to 2 buttons)\n * @property buttonTitle Set to change the default button title "Learn more". If used, the link to move when the button is clicked will be the value entered in the content.\n */\nexport interface KakaoCommerceTemplate {\n  content: KakaoTemplateContent;\n  commerce: KakaoTemplateCommerce;\n  buttons?: KakaoTemplateButton[];\n  buttonTitle?: string;\n}\n'})})]})}function o(e={}){const{wrapper:t}={...(0,s.R)(),...e.components};return t?(0,a.jsx)(t,{...e,children:(0,a.jsx)(r,{...e})}):r(e)}},7035:(e,t,n)=>{n.d(t,{Ay:()=>l,RM:()=>i});var a=n(4848),s=n(8453),r=n(3230),o=n(8063);const i=[{value:"Usage",id:"usage",level:2}];function c(e){const t={a:"a",admonition:"admonition",code:"code",h2:"h2",li:"li",p:"p",ul:"ul",...(0,s.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[e.description,"\n",(0,a.jsx)(t.h2,{id:"usage",children:"Usage"}),"\n",(0,a.jsxs)(t.p,{children:[(0,a.jsx)(r.A,{children:`share${e.name[0].toUpperCase()+e.name.slice(1)}Template`})," to share a template message."]}),"\n",(0,a.jsx)(o.A,{language:"tsx",children:`\nexport function share${e.name[0].toUpperCase()+e.name.slice(1)}Template(params: {\n  template: Kakao${e.name[0].toUpperCase()+e.name.slice(1)}Template;\n  useWebBrowserIfKakaoTalkNotAvailable?: boolean;\n  serverCallbackArgs?: Record<string, string>;\n})\n`.trim()}),"\n",(0,a.jsxs)(t.ul,{children:["\n",(0,a.jsxs)(t.li,{children:[(0,a.jsx)(t.code,{children:"template"}),": The template object."]}),"\n",(0,a.jsxs)(t.li,{children:[(0,a.jsx)(t.code,{children:"useWebBrowserIfKakaoTalkNotAvailable"}),": Specifies whether to use a web browser for sharing when KakaoTalk is not available. The default value is ",(0,a.jsx)(t.code,{children:"true"}),"."]}),"\n",(0,a.jsxs)(t.li,{children:[(0,a.jsx)(t.code,{children:"serverCallbackArgs"}),": Server callback arguments. Each value must be passed as a string."]}),"\n"]}),"\n",(0,a.jsxs)(t.admonition,{type:"info",children:[(0,a.jsxs)(t.p,{children:["Refer to ",(0,a.jsx)(t.a,{href:"/docs/share/component-types",children:"Component Types"})," for detailed component types."]}),(0,a.jsxs)(t.p,{children:["If you encounter any issues, refer to ",(0,a.jsx)(t.a,{href:"/docs/share/troubleshooting",children:"Troubleshooting"}),"."]})]})]})}function l(e={}){const{wrapper:t}={...(0,s.R)(),...e.components};return t?(0,a.jsx)(t,{...e,children:(0,a.jsx)(c,{...e})}):c(e)}},731:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>m,contentTitle:()=>c,default:()=>p,frontMatter:()=>i,metadata:()=>l,toc:()=>d});var a=n(4848),s=n(8453),r=n(8554),o=n(7035);const i={sidebar_position:9},c="Share Message with Commerce Template",l={id:"share/share-default-commerce",title:"Share Message with Commerce Template",description:"Commerce Template",source:"@site/i18n/en/docusaurus-plugin-content-docs/current/share/share-default-commerce.mdx",sourceDirName:"share",slug:"/share/share-default-commerce",permalink:"/en/docs/share/share-default-commerce",draft:!1,unlisted:!1,editUrl:"https://github.com/mym0404/react-native-kakao/tree/main/docs/docs/share/share-default-commerce.mdx",tags:[],version:"current",sidebarPosition:9,frontMatter:{sidebar_position:9},sidebar:"tutorialSidebar",previous:{title:"Share Message with Location Template",permalink:"/en/docs/share/share-default-location"},next:{title:"Share Message with Text Template",permalink:"/en/docs/share/share-default-text"}},m={},d=[{value:"Commerce Template",id:"commerce-template",level:2},...o.RM];function h(e){const t={h1:"h1",h2:"h2",...(0,s.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(t.h1,{id:"share-message-with-commerce-template",children:"Share Message with Commerce Template"}),"\n",(0,a.jsx)(t.h2,{id:"commerce-template",children:"Commerce Template"}),"\n","\n",(0,a.jsx)(o.Ay,{name:"commerce",description:(0,a.jsx)(r.Ay,{})})]})}function p(e={}){const{wrapper:t}={...(0,s.R)(),...e.components};return t?(0,a.jsx)(t,{...e,children:(0,a.jsx)(h,{...e})}):h(e)}}}]);