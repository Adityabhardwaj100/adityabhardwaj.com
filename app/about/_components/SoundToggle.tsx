'use client';

import { useEffect, useState } from 'react';
import { sound } from '../_lib/audio';
import styles from '../about.module.css';

export default function SoundToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => sound.subscribe(setOn), []);

  return (
    <button
      type="button"
      className={styles.soundToggle}
      aria-pressed={on}
      aria-label={on ? 'Turn sound off' : 'Turn sound on'}
      onClick={() => void sound.toggle()}
    >
      <span className={styles.soundBars} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span>{on ? 'sound on' : 'sound'}</span>
    </button>
  );
}
