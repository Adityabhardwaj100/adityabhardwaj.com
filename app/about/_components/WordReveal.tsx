import { Fragment } from 'react';
import { at } from '../_lib/reveal';
import styles from '../about.module.css';

interface WordRevealProps {
  text: string;
  /** Chapter progress at which the first word lights. */
  from: number;
  /** Chapter progress at which the last word lights. */
  to: number;
}

/** Words brighten one by one as the reader scrolls — reading at the pace of speech. */
export default function WordReveal({ text, from, to }: WordRevealProps) {
  const words = text.split(' ');
  return (
    <>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span className={styles.word} style={at(from + ((to - from) * i) / words.length, 0.03)}>
            {word}
          </span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </>
  );
}
