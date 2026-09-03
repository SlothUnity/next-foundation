import { MAIN_LANDMARK_ID } from '@/core/renderer';

import styles from './SkipToContent.module.scss';

interface SkipToContentProps {
  label?: string;
}

export function SkipToContent({ label = 'Saltar para o conteúdo' }: SkipToContentProps) {
  return (
    <a className={styles.skip} href={`#${MAIN_LANDMARK_ID}`}>
      {label}
    </a>
  );
}
