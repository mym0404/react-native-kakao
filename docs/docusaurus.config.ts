import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const title = 'React Native Kakao';
const description = 'Native Kakao SDK All In One Solution';
const repoOrg = 'mym0404';
const repoName = 'react-native-kakao';
const repoUrl = 'https://github.com/mym0404/react-native-kakao';
const coverImage = 'img/social-card.png';

const config: Config = {
  title: title,
  tagline: description,
  favicon: 'https://rnkakao.dev/favicon.ico',

  url: 'https://rnkakao.dev',
  baseUrl: '/',

  organizationName: repoOrg,
  projectName: repoName,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: `${repoUrl}/tree/main/docs/`,
          remarkPlugins: [],
          rehypePlugins: [],
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    metadata: [
      {
        name: 'keywords',
        content:
          'kakao, react native, react, kakao-login, kakao-navi, kakao-share, kakao-maps, 카카오, 카카오SDK, 카카오로그인, 카카오지도, 카카오내비, 로그인, Oauth, 리액트네이티브, 리액트',
      },
      {
        name: 'naver-site-verification',
        content: '8f6b803740d4c113455ae0e4fa297b09dbb6d11d',
      },
    ],
    headTags: [],
    colorMode: {
      defaultMode: 'dark',
    },
    image: coverImage,
    docs: {
      sidebar: {
        hideable: true,
      },
    },
    navbar: {
      title: title,
      hideOnScroll: false,
      logo: {
        alt: 'My Site Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: '시작하기',
        },
        {
          href: repoUrl,
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: '시작하기',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: repoUrl,
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} MJ Studio.`,
    },
    prism: {
      theme: prismThemes.nightOwl,
      darkTheme: prismThemes.vsDark,
    },
  } satisfies Preset.ThemeConfig,

  plugins: ['docusaurus-plugin-sass'],
};

export default config;
