"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[8280],{1115:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>m,contentTitle:()=>r,default:()=>l,frontMatter:()=>o,metadata:()=>s,toc:()=>c});var a=t(4848),i=t(8453);const o={sidebar_position:200},r="Component Types",s={id:"share/component-types",title:"Component Types",description:"Component Types",source:"@site/i18n/en/docusaurus-plugin-content-docs/current/share/component-types.mdx",sourceDirName:"share",slug:"/share/component-types",permalink:"/en/docs/share/component-types",draft:!1,unlisted:!1,editUrl:"https://github.com/mym0404/react-native-kakao/tree/main/docs/docs/share/component-types.mdx",tags:[],version:"current",sidebarPosition:200,frontMatter:{sidebar_position:200},sidebar:"tutorialSidebar",previous:{title:"Send Message with Calendar Template",permalink:"/en/docs/share/send-default-calendar"},next:{title:"Troubleshooting & FAQ",permalink:"/en/docs/share/troubleshooting"}},m={},c=[{value:"Component Types",id:"component-types-1",level:2}];function p(e){const n={code:"code",h1:"h1",h2:"h2",p:"p",pre:"pre",...(0,i.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(n.h1,{id:"component-types",children:"Component Types"}),"\n",(0,a.jsx)(n.h2,{id:"component-types-1",children:"Component Types"}),"\n",(0,a.jsx)(n.p,{children:"All types are also documented with TypeScript comments for easy reference while coding."}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-tsx",children:"/**\n * Object containing link information for navigating when clicking on content or buttons within a message.\n *\n * @param webUrl Web link URL used in PC version of KakaoTalk.\n * @param mobileWebUrl Web link URL used in mobile KakaoTalk.\n * @param androidExecutionParams Parameters added to the app link URL for Android KakaoTalk.\n * @param iosExecutionParams Parameters added to the app link URL for iOS KakaoTalk.\n */\nexport interface KakaoTemplateLink {\n  webUrl?: string;\n  mobileWebUrl?: string;\n  iosExecutionParams?: Readonly<{ [key: string]: string }>;\n  androidExecutionParams?: Readonly<{ [key: string]: string }>;\n}\n\n/**\n * Object containing content information for a message.\n *\n * @param title Title of the content.\n * @param imageUrl URL of the content's image.\n * @param link Link information for navigating when the content is clicked.\n * @param imageWidth Width of the content's image (unit: pixels).\n * @param imageHeight Height of the content's image (unit: pixels).\n */\nexport interface KakaoTemplateContent {\n  title: string;\n  imageUrl: string;\n  link: KakaoTemplateLink;\n  description?: string;\n  imageWidth?: number;\n  imageHeight?: number;\n}\n\n/**\n * Object containing information about item list type content.\n *\n * @param item Item name. Display up to 6 characters.\n * @param itemOp Item price. Allowed characters: numbers, currency symbols, commas(,), periods(.), including decimal amounts with up to 2 decimal places recommended.\n */\nexport interface KakaoTemplateItemInfo {\n  item: string;\n  itemOp: string;\n}\n\n/**\n * Object containing information about item list type content.\n *\n * @param profileText Text to be displayed in the header or profile area. If [profileImageUrl] is not present, only a bold title is displayed in the header. Display up to 16 characters.\n * @param profileImageUrl Image displayed in the profile area. Displayed as a small circular profile picture.\n * @param titleImageText Title of the image item. Display up to 2 lines, maximum 24 characters.\n * @param titleImageUrl Image of the image item. Images not in a 1:1 ratio of 108*108 for iOS and 98*98 for Android are cropped using the center crop method.\n * @param titleImageCategory Category information displayed in gray below the title of the image item. Display up to one line, maximum 14 characters.\n * @param items Information on each text item. Arrays of JSON including [ItemInfo.item] and [ItemInfo.itemOp] corresponding to item names and prices, supporting up to 5 items.\n * @param sum Summary information for the item area, such as order amount or payment amount. Display up to 6 characters below the text item area.\n * @param sumOp Price sum information of the item area. Display up to 11 characters in bold below the text item area.\n */\nexport interface KakaoTemplateItemContent {\n  profileText?: string;\n  profileImageUrl?: string;\n  titleImageText?: string;\n  titleImageUrl?: string;\n  titleImageCategory?: string;\n  items?: Array<KakaoTemplateItemInfo>;\n  sum?: string;\n  sumOp?: string;\n}\n\n/**\n * Object used to represent social information such as likes, comments, and shares.\n * @param likeCount Number of likes on the content.\n * @param commentCount Number of comments on the content.\n * @param sharedCount Number of shares of the content.\n * @param viewCount Number of views of the content.\n * @param subscriberCount Number of subscribers to the content.\n */\nexport interface KakaoTemplateSocial {\n  likeCount?: Int32;\n  commentCount?: Int32;\n  sharedCount?: Int32;\n  viewCount?: Int32;\n  subscriberCount?: Int32;\n}\n\n/**\n * Object used to represent price information.\n *\n * @param regularPrice Regular price.\n * @param discountPrice Discounted price.\n * @param discountRate Discount rate.\n * @param fixedDiscountPrice Fixed discount price.\n * @param productName Product name.\n * @param currencyUnit Price unit.\n * @param currencyUnitPosition Price unit position (0: unit displayed after the price, 1: unit displayed before the price).\n */\nexport interface KakaoTemplateCommerce {\n  regularPrice: Int32;\n  discountPrice?: Int32;\n  fixedDiscountPrice?: Int32;\n  discountRate?: Int32;\n  productName?: string;\n  currencyUnit?: string;\n  currencyUnitPosition?: Int32;\n}\n\n/**\n * Object representing a button added at the bottom of a message.\n *\n * @param title Button title.\n * @param link Link information for navigating when the button is clicked.\n */\nexport interface KakaoTemplateButton {\n  title: string;\n  link: KakaoTemplateLink;\n}\n"})})]})}function l(e={}){const{wrapper:n}={...(0,i.R)(),...e.components};return n?(0,a.jsx)(n,{...e,children:(0,a.jsx)(p,{...e})}):p(e)}},8453:(e,n,t)=>{t.d(n,{R:()=>r,x:()=>s});var a=t(6540);const i={},o=a.createContext(i);function r(e){const n=a.useContext(o);return a.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function s(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:r(e.components),a.createElement(o.Provider,{value:n},e.children)}}}]);