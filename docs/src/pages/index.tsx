import type { JSX } from 'react';
import React from 'react';
import Link from '@docusaurus/Link';
import Translate, { translate } from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import clsx from 'clsx';

import styles from './index.module.scss';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();

  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className={styles.container}>
        <img
          alt={siteConfig.title}
          src={require('@site/static/img/logo.png').default}
          className={styles.logo}
        />
        <Heading as={'h1'} className={'hero__title'}>
          {siteConfig.title}
        </Heading>
        <p className={'hero__subtitle'}>
          {translate({
            id: 'homepage.tagline',
            message: '네이티브 카카오 SDK를 하나의 프로젝트에서 관리합니다.',
          })}
        </p>
        <div className={styles.buttons}>
          <Link className={'button button--secondary button--lg'} to={'/docs/intro'}>
            <Translate id={'homepage.getStarted'}>{'5분 안에 시작하기'}</Translate>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  return (
    <Layout
      title={'React Native Kakao'}
      description={translate({
        id: 'homepage.description',
        message: '카카오 SDK를 하나의 프로젝트에서 관리합니다.',
      })}
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
