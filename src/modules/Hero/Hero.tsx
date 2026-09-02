import type { HeroProps } from './Hero.types';

import styles from './Hero.module.scss';

export function Hero({ title, subtitle }: HeroProps) {
  return (
    <section className={styles.hero}>
      <h1>{title}</h1>

      {subtitle && <p>{subtitle}</p>}
    </section>
  );
}
