'use client';

import { useCallback, useRef, useState } from 'react';
import Chapter from '../Chapter';
import Cylinder from '../Cylinder';
import { sound } from '../../_lib/audio';
import styles from '../../about.module.css';

const LINES = [
  <>I didn&rsquo;t come up through code. I came up through management.</>,
  <>
    I worked IT at <span className={styles.colt}>COLT</span> in London.
  </>,
  <>I spent years in sales,</>,
  <>which is where you learn the only thing worth knowing &mdash;</>,
  <>that a clever man can build anything,</>,
  <>and it means nothing until somebody in the room decides they want it.</>,
];

/** Progress per chamber; the sixth lands at 0.7 and holds until the lock. */
const STEP = 0.14;
const LOCK_AT = 0.9;

/** IV · Origin. One scroll step, one chamber, one line. */
export default function Origin() {
  const [step, setStep] = useState(0);
  const [locked, setLocked] = useState(false);
  const stepRef = useRef(0);
  const lockedRef = useRef(false);

  const onProgress = useCallback((p: number) => {
    const next = Math.min(LINES.length - 1, Math.floor(p / STEP));
    if (next !== stepRef.current) {
      stepRef.current = next;
      setStep(next);
      sound.click();
    }
    const lock = p >= LOCK_AT;
    if (lock !== lockedRef.current) {
      lockedRef.current = lock;
      setLocked(lock);
      if (lock) sound.click();
    }
  }, []);

  return (
    <Chapter label="Origin" length={7} embers={0.3} onProgress={onProgress}>
      <p className={styles.mark} aria-hidden="true">
        IV · Origin
      </p>
      <div className={styles.origin} data-locked={locked || undefined}>
        <Cylinder rotation={step * -60} spark={locked} className={styles.originCylinder} />
        <p className={styles.originLines}>
          {LINES.map((line, i) => (
            <span
              key={i}
              className={styles.originLine}
              data-js-reveal=""
              data-state={i < step ? 'past' : i === step ? 'current' : 'future'}
            >
              <span className={styles.originNo} aria-hidden="true">
                {['I', 'II', 'III', 'IV', 'V', 'VI'][i]}
              </span>
              <span>{line}</span>{' '}
            </span>
          ))}
        </p>
      </div>
    </Chapter>
  );
}
