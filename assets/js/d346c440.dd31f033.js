"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[4751],{8629:(e,n,s)=>{s.d(n,{Ay:()=>o});var r=s(4848),a=s(8453);function t(e){const n={a:"a",code:"code",h2:"h2",img:"img",p:"p",pre:"pre",...(0,a.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(n.p,{children:(0,r.jsx)(n.a,{href:"https://developers.kakao.com/docs/latest/ko/message/android-link#create-message",children:"\uacf5\uc2dd \ubb38\uc11c"})}),"\n",(0,r.jsxs)(n.p,{children:[(0,r.jsx)(n.a,{href:"https://developers.kakao.com/docs/latest/ko/talkcalendar/common",children:"\ud1a1\uce98\ub9b0\ub354"}),"\uc758 \uacf5\uac1c \uc77c\uc815 \ub610\ub294 \uad6c\ub3c5 \uce98\ub9b0\ub354 \uc815\ubcf4\ub97c \ud3ec\ud568\ud55c \uba54\uc2dc\uc9c0 \ud615\uc2dd\uc785\ub2c8\ub2e4. \uce74\uce74\uc624\ud1a1 \ucc44\ub110\uc758 \uacf5\uac1c \uc77c\uc815 \ub610\ub294 \uad6c\ub3c5 \uce98\ub9b0\ub354\ub97c \uc0ac\uc6a9\uc790\uc758 \ud1a1\uce98\ub9b0\ub354\uc5d0 \ucd94\uac00\ud558\ub294 \uae30\ub2a5\uc744 \uc81c\uacf5\ud569\ub2c8\ub2e4. \uc11c\ube44\uc2a4 \uc571\uacfc \uc5f0\uacb0\ub41c \uce74\uce74\uc624\ud1a1 \ucc44\ub110\uc758 \uacf5\uac1c \uc77c\uc815\uc774\ub098 \uad6c\ub3c5 \uce98\ub9b0\ub354\uc5d0 \ub300\ud55c \uba54\uc2dc\uc9c0\ub9cc \uc804\uc1a1 \uac00\ub2a5\ud569\ub2c8\ub2e4."]}),"\n",(0,r.jsx)(n.p,{children:"\ud65c\uc6a9 \uc608\uc2dc: \uce74\uce74\uc624\ud1a1 \uba54\uc2dc\uc9c0\ub97c \ud1b5\ud574 \uc0ac\uc6a9\uc790\uac00 \uc11c\ube44\uc2a4\uc758 \uacf5\uac1c \uc77c\uc815\uc744 \uc0ac\uc6a9\uc790 \uce98\ub9b0\ub354\uc5d0 \ucd94\uac00\ud558\uac70\ub098, \uc11c\ube44\uc2a4\uc758 \uad6c\ub3c5 \uce98\ub9b0\ub354\ub97c \uad6c\ub3c5\ud558\ub3c4\ub85d \uad8c\uc720\ud558\ub294 \uc6a9\ub3c4\ub85c \uc0ac\uc6a9\ud569\ub2c8\ub2e4."}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.img,{src:"https://raw.githubusercontent.com/mym0404/image-archive/master/202404220340125.webp",alt:""})}),"\n",(0,r.jsx)(n.h2,{id:"\ud15c\ud50c\ub9bf-\ud0c0\uc785-\uc815\uc758",children:"\ud15c\ud50c\ub9bf \ud0c0\uc785 \uc815\uc758"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",children:"/**\n * \ud1a1\uce98\ub9b0\ub354\uc758 \uad6c\ub3c5 \uce98\ub9b0\ub354 \ub610\ub294 \uacf5\uac1c \uc77c\uc815 \uc815\ubcf4\ub97c \ud3ec\ud568\ud55c \uba54\uc2dc\uc9c0 \ud615\uc2dd\uc785\ub2c8\ub2e4.\n * \uce74\uce74\uc624\ud1a1 \ucc44\ub110\uc758 \uad6c\ub3c5 \uce98\ub9b0\ub354 \ub610\ub294 \uacf5\uac1c \uc77c\uc815\uc744 \uc0ac\uc6a9\uc790\uc758 \ud1a1\uce98\ub9b0\ub354\uc5d0 \ucd94\uac00\ud558\ub294 \uae30\ub2a5\uc744 \uc81c\uacf5\ud569\ub2c8\ub2e4.\n *\n * @property id \uad6c\ub3c5 \uce98\ub9b0\ub354 \ub610\ub294 \uacf5\uac1c \uc77c\uc815 ID\n * @property idType id\uc758 \ud0c0\uc785, event(\uacf5\uac1c \uc77c\uc815) \ub610\ub294 calendar(\uad6c\ub3c5 \uce98\ub9b0\ub354) \uc911 \ud558\ub098\n * @property content \uc77c\uc815\uc5d0 \ub300\ud574 \uc124\uba85\ud558\ub294 \ucee8\ud150\uce20 \uc815\ubcf4\n * @property buttons \ubc84\ud2bc \ubaa9\ub85d. \uae30\ubcf8 \ubc84\ud2bc\uc758 \ud0c0\uc774\ud2c0 \uc678\uc5d0 \ub9c1\ud06c\ub3c4 \ubcc0\uacbd\ud558\uace0 \uc2f6\uc744 \ub54c \uc124\uc815. (\ucd5c\ub300 1\uac1c, \uc624\ub978\ucabd \uc704\uce58 \ubcf4\uae30 \ubc84\ud2bc\uc740 \uace0\uc815)\n */\nexport interface KakaoCalendarTemplate {\n  id: string;\n  idType: 'event' | 'calendar';\n  content: KakaoTemplateContent;\n  buttons?: KakaoTemplateButton[];\n}\n"})})]})}function o(e={}){const{wrapper:n}={...(0,a.R)(),...e.components};return n?(0,r.jsx)(n,{...e,children:(0,r.jsx)(t,{...e})}):t(e)}},3467:(e,n,s)=>{s.d(n,{Ay:()=>l,RM:()=>i});var r=s(4848),a=s(8453),t=s(3230),o=s(8063);const i=[{value:"Usage",id:"usage",level:2}];function c(e){const n={a:"a",admonition:"admonition",code:"code",h2:"h2",li:"li",p:"p",ul:"ul",...(0,a.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[e.description,"\n",(0,r.jsx)(n.h2,{id:"usage",children:"Usage"}),"\n",(0,r.jsxs)(n.p,{children:[(0,r.jsx)(t.A,{children:`share${e.name[0].toUpperCase()+e.name.slice(1)}Template`})," \ub85c \ud15c\ud50c\ub9bf \uba54\uc138\uc9c0\ub97c \uacf5\uc720\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4."]}),"\n",(0,r.jsx)(o.A,{language:"tsx",children:`\nexport function share${e.name[0].toUpperCase()+e.name.slice(1)}Template(params: {\n  template: Kakao${e.name[0].toUpperCase()+e.name.slice(1)}Template;\n  useWebBrowserIfKakaoTalkNotAvailable?: boolean;\n  serverCallbackArgs?: Record<string, string>;\n})\n`.trim()}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"template"}),": \ud15c\ud50c\ub9bf \uac1d\uccb4\uc785\ub2c8\ub2e4."]}),"\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"useWebBrowserIfKakaoTalkNotAvailable"}),": \uce74\uce74\uc624\ud1a1\uc774 \uc0ac\uc6a9 \uac00\ub2a5\ud558\uc9c0 \uc54a\uc744 \ub54c \uc6f9 \ube0c\ub77c\uc6b0\uc800\ub97c \uc774\uc6a9\ud574 \uacf5\uc720\ub97c \ud560 \uac83\uc778\uc9c0 \uc5ec\ubd80\uc785\ub2c8\ub2e4. \uae30\ubcf8\uac12\uc740 ",(0,r.jsx)(n.code,{children:"true"}),"\uc785\ub2c8\ub2e4."]}),"\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"serverCallbackArgs"}),": \uc11c\ubc84 \ucf5c\ubc31 \uc778\uc790\ub4e4\uc785\ub2c8\ub2e4. \ubaa8\ub450 \ubb38\uc790\uc5f4\ub9cc \uac12\uc73c\ub85c \uc804\ub2ec\ub418\uc5b4\uc57c \ud569\ub2c8\ub2e4."]}),"\n"]}),"\n",(0,r.jsxs)(n.admonition,{type:"info",children:[(0,r.jsxs)(n.p,{children:["\uc790\uc138\ud55c \ucef4\ud3ec\ub10c\ud2b8\ub4e4\uc758 \ud0c0\uc785\uc740 ",(0,r.jsx)(n.a,{href:"/docs/share/component-types",children:"\ucef4\ud3ec\ub10c\ud2b8 \ud0c0\uc785\ub4e4"}),"\uc744 \ucc38\uace0\ud574\uc8fc\uc138\uc694."]}),(0,r.jsxs)(n.p,{children:["\uc0ac\uc6a9\uc5d0 \ubb38\uc81c\uac00 \uc0dd\uae34\ub2e4\uba74 ",(0,r.jsx)(n.a,{href:"/docs/share/troubleshooting",children:"Troubleshooting"}),"\uc744 \ucc38\uace0\ud574\uc8fc\uc138\uc694"]})]})]})}function l(e={}){const{wrapper:n}={...(0,a.R)(),...e.components};return n?(0,r.jsx)(n,{...e,children:(0,r.jsx)(c,{...e})}):c(e)}},9620:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>d,contentTitle:()=>c,default:()=>m,frontMatter:()=>i,metadata:()=>l,toc:()=>h});var r=s(4848),a=s(8453),t=s(8629),o=s(3467);const i={sidebar_position:11},c="\ub2ec\ub825 \ud15c\ud50c\ub9bf\uc73c\ub85c \uba54\uc138\uc9c0 \uacf5\uc720\ud558\uae30",l={id:"share/share-default-calendar",title:"\ub2ec\ub825 \ud15c\ud50c\ub9bf\uc73c\ub85c \uba54\uc138\uc9c0 \uacf5\uc720\ud558\uae30",description:"\ub2ec\ub825 \ud15c\ud50c\ub9bf",source:"@site/docs/share/share-default-calendar.mdx",sourceDirName:"share",slug:"/share/share-default-calendar",permalink:"/docs/share/share-default-calendar",draft:!1,unlisted:!1,editUrl:"https://github.com/mym0404/react-native-kakao/tree/main/docs/docs/share/share-default-calendar.mdx",tags:[],version:"current",sidebarPosition:11,frontMatter:{sidebar_position:11},sidebar:"tutorialSidebar",previous:{title:"\ud14d\uc2a4\ud2b8 \ud15c\ud50c\ub9bf\uc73c\ub85c \uba54\uc138\uc9c0 \uacf5\uc720\ud558\uae30",permalink:"/docs/share/share-default-text"},next:{title:"\uc0ac\uc6a9\uc790 \uc815\uc758 \ud15c\ud50c\ub9bf\uc73c\ub85c \uba54\uc138\uc9c0 \uc804\uc1a1\ud558\uae30",permalink:"/docs/share/send-custom"}},d={},h=[{value:"\ub2ec\ub825 \ud15c\ud50c\ub9bf",id:"\ub2ec\ub825-\ud15c\ud50c\ub9bf",level:2},...o.RM];function p(e){const n={h1:"h1",h2:"h2",...(0,a.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(n.h1,{id:"\ub2ec\ub825-\ud15c\ud50c\ub9bf\uc73c\ub85c-\uba54\uc138\uc9c0-\uacf5\uc720\ud558\uae30",children:"\ub2ec\ub825 \ud15c\ud50c\ub9bf\uc73c\ub85c \uba54\uc138\uc9c0 \uacf5\uc720\ud558\uae30"}),"\n",(0,r.jsx)(n.h2,{id:"\ub2ec\ub825-\ud15c\ud50c\ub9bf",children:"\ub2ec\ub825 \ud15c\ud50c\ub9bf"}),"\n","\n",(0,r.jsx)(o.Ay,{name:"calendar",description:(0,r.jsx)(t.Ay,{})})]})}function m(e={}){const{wrapper:n}={...(0,a.R)(),...e.components};return n?(0,r.jsx)(n,{...e,children:(0,r.jsx)(p,{...e})}):p(e)}}}]);