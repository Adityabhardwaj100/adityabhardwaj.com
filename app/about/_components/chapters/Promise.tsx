import Chapter from '../Chapter';
import Smoke from '../Smoke';
import styles from '../../about.module.css';

/** VII · The haze of promises wipes away; what's underneath is quiet and exact. */
export default function PromiseChapter() {
  return (
    <Chapter label="The promise" length={3.6} embers={0.08}>
      <p className={styles.mark} aria-hidden="true">
        VII · The Promise
      </p>
      <Smoke className={styles.promiseSmoke} />
      <div className={styles.promise} data-promise="">
        <p className={styles.promiseHaze} data-haze="">
          Everyone in this industry is promising you the future.
        </p>
        <p className={styles.promiseClear}>
          I&rsquo;d rather show you what your business looks like{' '}
          <span className={styles.sixMonths}>six months from now</span>, with the right systems running quietly
          underneath it.
        </p>
      </div>
    </Chapter>
  );
}
