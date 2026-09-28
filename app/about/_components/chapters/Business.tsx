import Chapter from '../Chapter';
import { at } from '../../_lib/reveal';
import styles from '../../about.module.css';

/** I · The hook. One sentence, a pause, then the next. */
export default function Business() {
  return (
    <Chapter label="The business" length={3.2} embers={0.35}>
      <p className={styles.mark} aria-hidden="true">
        I · The Business
      </p>
      <div className={styles.hook}>
        <p className={styles.hookLead}>
          <span className={styles.intro}>Most men buy the future.</span>{' '}
          <span className={styles.reveal} style={at(0.1, 0.1)}>
            Almost none of them ever see it
          </span>{' '}
          <span className={`${styles.reveal} ${styles.delivered}`} style={at(0.24, 0.1)}>
            delivered.
          </span>
        </p>
        <p className={`${styles.hookBeat} ${styles.reveal}`} style={at(0.44, 0.1)}>
          That&rsquo;s the whole business.
        </p>
        <p className={`${styles.hookAside} ${styles.reveal}`} style={at(0.6, 0.1)}>
          Everything else is decoration.
        </p>
      </div>
      <p className={styles.scrollCue} aria-hidden="true">
        Scroll
        <span />
      </p>
    </Chapter>
  );
}
