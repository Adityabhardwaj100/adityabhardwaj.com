'use client';

import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import Chapter from '../Chapter';
import Cylinder from '../Cylinder';
import { sound } from '../../_lib/audio';
import { at } from '../../_lib/reveal';
import styles from '../../about.module.css';

/** VIII · The close. The smoke has cleared; one light, one line, one door. */
export default function Room() {
  const [turned, setTurned] = useState(false);
  const turnedRef = useRef(false);

  const onProgress = useCallback((p: number) => {
    // Six chambers, six months: one full turn once the line has landed.
    if (p > 0.8 && !turnedRef.current) {
      turnedRef.current = true;
      setTurned(true);
      sound.click();
    }
  }, []);

  return (
    <Chapter label="The room" length={1} embers={0.22} sound="resolve" onProgress={onProgress} stageClassName={styles.roomClose}>
      <div className={styles.close}>
        <p className={`${styles.closeLine} ${styles.reveal}`} style={at(0.45, 0.2)}>
          One conversation and you&rsquo;ll know whether I&rsquo;m worth the room.
        </p>
        <div className={`${styles.closeAction} ${styles.reveal}`} style={at(0.65, 0.15)}>
          <Cylinder rotation={turned ? 360 : 0} className={styles.closeCylinder} />
          <Link href="/book" className={styles.closeButton}>
            Book the conversation
          </Link>
        </div>
      </div>
    </Chapter>
  );
}
