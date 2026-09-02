import type { HeroProps } from './Hero.types';
import './Hero.style.scss';

export function Hero({ title, subtitle }: HeroProps) {
  return (
    <section>
      <h1>{title}</h1>

      {subtitle && <p>{subtitle}</p>}
    </section>
  );
}
