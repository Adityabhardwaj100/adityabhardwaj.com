import type { CSSProperties } from 'react';
import Chapter from '../Chapter';
import { at } from '../../_lib/reveal';
import styles from '../../about.module.css';

const CARDS = [
  { no: 'I', name: 'Language Models', tilt: -5 },
  { no: 'II', name: 'Generative Media', tilt: 3 },
  { no: 'III', name: 'Web', tilt: -2 },
  { no: 'IV', name: 'Automation', tilt: 6 },
];

/** VI · The work. Four calling cards dealt onto the table. */
export default function Work() {
  return (
    <Chapter label="The work" length={5} embers={0.3}>
      <p className={styles.mark} aria-hidden="true">
        VI · The Work
      </p>
      <div className={styles.work}>
        <p className={styles.workLead}>Four things I do: language models, generative media, web, automation.</p>

        <div className={styles.cards} aria-hidden="true">
          {CARDS.map((card, i) => (
            <div
              key={card.name}
              className={styles.card}
              data-js-reveal=""
              style={{ ...at(0.08 + i * 0.1, 0.09), '--tilt': `${card.tilt}deg` } as CSSProperties}
            >
              <span className={styles.cardNo}>No. {card.no}</span>
              <span className={styles.cardName}>{card.name}</span>
              <span className={styles.cardRule} />
            </div>
          ))}
        </div>

        <p className={`${styles.workTools} ${styles.reveal}`} style={at(0.54, 0.1)}>
          The tools change every six months. The work doesn&rsquo;t.
        </p>
        <p className={`${styles.workTranslation} ${styles.reveal}`} style={at(0.7, 0.1)}>
          The work is translation &mdash; taking something complicated and putting it where a person can use it.
        </p>
      </div>
    </Chapter>
  );
}
