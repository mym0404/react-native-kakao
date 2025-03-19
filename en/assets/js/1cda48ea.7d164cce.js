"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[3476],{5379:(e,t,n)=>{n.d(t,{Ay:()=>o});var a=n(4848),s=n(8453);function r(e){const t={a:"a",code:"code",h3:"h3",img:"img",p:"p",pre:"pre",...(0,s.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(t.p,{children:(0,a.jsx)(t.a,{href:"https://developers.kakao.com/docs/latest/ko/message/android",children:"Official Documentation"})}),"\n",(0,a.jsx)(t.p,{children:"This is a basic message format composed of images and text. It can include a list of items."}),"\n",(0,a.jsx)(t.p,{children:"Even when sending a scrap message, the feed template structure is used."}),"\n",(0,a.jsx)(t.p,{children:"A scrap message retrieves and organizes web page information based on the Open Graph Protocol from the requested web page URL."}),"\n",(0,a.jsx)(t.p,{children:"Use Case: It can be used to share news about a service or promotional events. When sharing a web page easily, the scrap message is useful. By utilizing the item area, you can create feed messages in the form of order details, catalogs, receipts, and more."}),"\n",(0,a.jsx)(t.p,{children:(0,a.jsx)(t.img,{src:"https://raw.githubusercontent.com/mym0404/image-archive/master/202404220336612.webp",alt:"Image"})}),"\n",(0,a.jsx)(t.h3,{id:"template-type-definition",children:"Template Type Definition"}),"\n",(0,a.jsx)(t.pre,{children:(0,a.jsx)(t.code,{className:"language-ts",children:'/**\n * Feed template class provided as a basic template.\n *\n * @property content Main content information of the message\n * @property itemContent Content to include in the item area, refer to [ItemContent]\n * @property social Social information about the content\n * @property buttons Button list, up to 2 buttons. Used when you want to change the button title and the link, or when you want to use two buttons\n * @property buttonTitle Set to change the default button title "Learn more". If used, the link to move when the button is clicked will be the value entered in the content\n */\nexport interface KakaoFeedTemplate {\n  content: KakaoTemplateContent;\n  itemContent?: KakaoTemplateItemContent;\n  social?: KakaoTemplateSocial;\n  buttons?: KakaoTemplateButton[];\n  buttonTitle?: string;\n}\n'})})]})}function o(e={}){const{wrapper:t}={...(0,s.R)(),...e.components};return t?(0,a.jsx)(t,{...e,children:(0,a.jsx)(r,{...e})}):r(e)}},7035:(e,t,n)=>{n.d(t,{Ay:()=>c,RM:()=>i});var a=n(4848),s=n(8453),r=n(3230),o=n(8063);const i=[{value:"Usage",id:"usage",level:2}];function l(e){const t={a:"a",admonition:"admonition",code:"code",h2:"h2",li:"li",p:"p",ul:"ul",...(0,s.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[e.description,"\n",(0,a.jsx)(t.h2,{id:"usage",children:"Usage"}),"\n",(0,a.jsxs)(t.p,{children:[(0,a.jsx)(r.A,{children:`share${e.name[0].toUpperCase()+e.name.slice(1)}Template`})," to share a template message."]}),"\n",(0,a.jsx)(o.A,{language:"tsx",children:`\nexport function share${e.name[0].toUpperCase()+e.name.slice(1)}Template(params: {\n  template: Kakao${e.name[0].toUpperCase()+e.name.slice(1)}Template;\n  useWebBrowserIfKakaoTalkNotAvailable?: boolean;\n  serverCallbackArgs?: Record<string, string>;\n})\n`.trim()}),"\n",(0,a.jsxs)(t.ul,{children:["\n",(0,a.jsxs)(t.li,{children:[(0,a.jsx)(t.code,{children:"template"}),": The template object."]}),"\n",(0,a.jsxs)(t.li,{children:[(0,a.jsx)(t.code,{children:"useWebBrowserIfKakaoTalkNotAvailable"}),": Specifies whether to use a web browser for sharing when KakaoTalk is not available. The default value is ",(0,a.jsx)(t.code,{children:"true"}),"."]}),"\n",(0,a.jsxs)(t.li,{children:[(0,a.jsx)(t.code,{children:"serverCallbackArgs"}),": Server callback arguments. Each value must be passed as a string."]}),"\n"]}),"\n",(0,a.jsxs)(t.admonition,{type:"info",children:[(0,a.jsxs)(t.p,{children:["Refer to ",(0,a.jsx)(t.a,{href:"/docs/share/component-types",children:"Component Types"})," for detailed component types."]}),(0,a.jsxs)(t.p,{children:["If you encounter any issues, refer to ",(0,a.jsx)(t.a,{href:"/docs/share/troubleshooting",children:"Troubleshooting"}),"."]})]})]})}function c(e={}){const{wrapper:t}={...(0,s.R)(),...e.components};return t?(0,a.jsx)(t,{...e,children:(0,a.jsx)(l,{...e})}):l(e)}},7890:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>d,contentTitle:()=>l,default:()=>m,frontMatter:()=>i,metadata:()=>c,toc:()=>h});var a=n(4848),s=n(8453),r=n(5379),o=n(7035);const i={sidebar_position:6},l="Share Message with Feed Template",c={id:"share/share-default-feed",title:"Share Message with Feed Template",description:"Feed Template",source:"@site/i18n/en/docusaurus-plugin-content-docs/current/share/share-default-feed.mdx",sourceDirName:"share",slug:"/share/share-default-feed",permalink:"/en/docs/share/share-default-feed",draft:!1,unlisted:!1,editUrl:"https://github.com/mym0404/react-native-kakao/tree/main/docs/docs/share/share-default-feed.mdx",tags:[],version:"current",sidebarPosition:6,frontMatter:{sidebar_position:6},sidebar:"tutorialSidebar",previous:{title:"Share Message with Custom Template",permalink:"/en/docs/share/share-custom"},next:{title:"Share Message with List Template",permalink:"/en/docs/share/share-default-list"}},d={},h=[{value:"Feed Template",id:"feed-template",level:2},...o.RM];function p(e){const t={h1:"h1",h2:"h2",...(0,s.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(t.h1,{id:"share-message-with-feed-template",children:"Share Message with Feed Template"}),"\n",(0,a.jsx)(t.h2,{id:"feed-template",children:"Feed Template"}),"\n","\n",(0,a.jsx)(o.Ay,{name:"feed",description:(0,a.jsx)(r.Ay,{})})]})}function m(e={}){const{wrapper:t}={...(0,s.R)(),...e.components};return t?(0,a.jsx)(t,{...e,children:(0,a.jsx)(p,{...e})}):p(e)}}}]);