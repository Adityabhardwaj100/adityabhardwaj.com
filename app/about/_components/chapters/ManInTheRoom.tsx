'use client';

import Image from 'next/image';
import { useCallback, useRef } from 'react';
import Chapter from '../Chapter';
import Smoke from '../Smoke';
import { sound } from '../../_lib/audio';
import { at } from '../../_lib/reveal';
import styles from '../../about.module.css';

/** When the portrait starts to surface out of the black. */
const EMERGE_AT = 0.14;

/** V · The reveal. Cut to black, a beat of silence, then the man in the room. */
export default function ManInTheRoom() {
  const tolled = useRef(false);

  const onProgress = useCallback((p: number) => {
    const past = p >= EMERGE_AT;
    if (past && !tolled.current) sound.toll();
    tolled.current = past;
  }, []);

  return (
    <Chapter
      label="The man in the room"
      length={4.5}
      embers={0.12}
      sound="silence"
      onProgress={onProgress}
      stageClassName={styles.roomStage}
    >
      <div className={styles.portrait}>
        <Image
          src="/about-portrait.jpg"
          alt="Aditya Bhardwaj in an overcoat and hat, tipping the brim."
          fill
          sizes="(max-width: 760px) 100vw, 76vh"
          className={styles.portraitImage}
        />
        <div className={styles.portraitLight} aria-hidden="true" />
      </div>
      <Smoke className={styles.roomSmoke} />
      <p className={`${styles.roomLine} ${styles.reveal}`} style={at(0.56, 0.1)}>
        So I learned to be the man in the room.
      </p>
    </Chapter>
  );
}
