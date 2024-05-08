import React from 'react';
import Translate, { translate } from '@docusaurus/Translate';
import Heading from '@theme/Heading';
import clsx from 'clsx';

import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: translate({ message: '모든 카카오 SDK' }),
    Svg: require('@site/static/img/finding-topics.svg').default,
    description: (
      <Translate>
        {
          '로그인, 공유, 지도 등 따로 관리되고 있는 SDK들로부터의 버전 충돌을 완벽히 해결합니다. 또한, 누락된 API나 미구현 기능들을 포함합니다.'
        }
      </Translate>
    ),
  },
  {
    title: translate({ message: '모든 플랫폼과 아키텍처' }),
    Svg: require('@site/static/img/building-community.svg').default,
    description: (
      <Translate>
        {
          'React Native Kakao는 Android, iOS, Web모든 플랫폼을 지원할 뿐만 아니라 New, Old Architecture, 더 나아가 Expo까지 모두 지원합니다.'
        }
      </Translate>
    ),
  },
  {
    title: translate({ message: '일관된 개발자 경험과 동작' }),
    Svg: require('@site/static/img/ai-creativity.svg').default,
    description: (
      <Translate>
        {
          '플랫폼별 기능이 차이가 나지 않도록 코드 퀄리티를 유지합니다. 또한, 어떤 SDK를 사용하든 비슷한 형태의 API를 제공함으로써 개발자가 일관되고 편안한 개발 경험을 가질 수 있도록 합니다.'
        }
      </Translate>
    ),
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className={'text--center'}>
        <Svg className={styles.featureSvg} role={'img'} style={{ width: 120, height: 140 }} />
      </div>
      <div className={'text--center padding-horiz--md'} style={{ marginTop: 24 }}>
        <Heading as={'h3'}>{title}</Heading>
        <p style={{ textAlign: 'start' }}>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className={'container'}>
        <div className={'row'} style={{ marginTop: '24px' }}>
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
