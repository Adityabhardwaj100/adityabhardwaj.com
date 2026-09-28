import Chapter from '../Chapter';
import WordReveal from '../WordReveal';
import { at } from '../../_lib/reveal';
import styles from '../../about.module.css';

/** II · The problem, read at the pace of speech; the promise in three beats. */
export default function Problem() {
  return (
    <Chapter label="The problem" length={4} embers={0.25}>
      <p className={styles.mark} aria-hidden="true">
        II · The Problem
      </p>
      <div className={styles.problem}>
        <p className={styles.problemText}>
          <WordReveal
            text="Most companies come to me knowing two things: that AI matters, and that they've been sold something they don't understand. I don't sell understanding."
            from={0.02}
            to={0.5}
          />
        </p>
        <p className={styles.beats}>
          <span className={styles.reveal} style={at(0.58)}>
            I build it,
          </span>{' '}
          <span className={styles.reveal} style={at(0.7)}>
            and then I hand it over,
          </span>{' '}
          <span className={`${styles.reveal} ${styles.beatLast}`} style={at(0.82)}>
            and then it&rsquo;s theirs.
          </span>
        </p>
      </div>
    </Chapter>
  );
}
