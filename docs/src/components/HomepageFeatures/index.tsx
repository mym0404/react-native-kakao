import React from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: '모든 카카오 SDK를 한곳에',
    Svg: require('@site/static/img/finding-topics.svg').default,
    description: (
      <>
        로그인, 공유, 지도 등 따로 관리되고 있는 SDK들로부터의 버전 충돌을 완벽히 해결합니다. 또한,
        누락된 API나 미구현 기능들을 포함합니다.
      </>
    ),
  },
  {
    title: '필요한 기능에 집중하기',
    Svg: require('@site/static/img/building-community.svg').default,
    description: (
      <>
        모노레포로 구성된 프로젝트와 패키지는 각각의 역할을 담당하고 사용자는 자신이 필요한 기능만
        설치하여 번들 사이즈 최적화 및 필요한 기능에만 집중할 수 있습니다.
      </>
    ),
  },
  {
    title: '일관된 개발자 경험과 동작',
    Svg: require('@site/static/img/ai-creativity.svg').default,
    description: (
      <>
        플랫폼별 기능이 차이가 나지 않도록 코드 퀄리티를 유지합니다. 또한, 어떤 SDK를 사용하든
        비슷한 형태의 API를 제공함으로써 개발자가 일관되고 편안한 개발 경험을 가질 수 있도록 합니다.
      </>
    ),
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" style={{ width: 120, height: 140 }} />
      </div>
      <div className="text--center padding-horiz--md" style={{ marginTop: 24 }}>
        <Heading as="h3">{title}</Heading>
        <p style={{ textAlign: 'start' }}>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row" style={{ marginTop: '24px' }}>
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
