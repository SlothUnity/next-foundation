import Image from 'next/image';

import type { HeroProps } from './Hero.types';

import styles from './Hero.module.scss';

export function Hero({ title, subtitle, image }: HeroProps) {
  return (
    <section className={styles.hero}>
      {image?.width && image.height ? (
        <Image
          className={styles.image}
          src={image.url}
          alt={image.alt}
          width={image.width}
          height={image.height}
        />
      ) : null}

      <h1>{title}</h1>

      {subtitle && <p>{subtitle}</p>}
    </section>
  );
}
