import type { CSSProperties, ReactNode } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { EB_Garamond, Instrument_Serif } from 'next/font/google';
import AboutExperience from './_components/AboutExperience';
import styles from './about.module.css';

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const body = EB_Garamond({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'About',
  description: 'Most men buy the future. Almost none of them ever see it delivered.',
};

/** Without JavaScript: no loader, just the words. */
const NO_SCRIPT_CSS = `[data-loader]{display:none!important}`;

interface BlockProps {
  /** Story keys this block walks through (see _webgl/shapes KEY). */
  keys: number[];
  /** Scroll length in viewport heights. */
  length: number;
  numeral: string;
  label: string;
  origin?: boolean;
  /** Where in the block's last step the morph onward begins (default 0.62). */
  ease?: number;
  children: ReactNode;
}

function Block({ keys, length, numeral, label, origin, ease, children }: BlockProps) {
  return (
    <section
      className={styles.block}
      style={{ '--len': length } as CSSProperties}
      data-keys={keys.join(',')}
      data-label={label}
      data-origin={origin || undefined}
      data-ease={ease}
      aria-label={label}
    >
      <div className={styles.blockInner}>
        <p className={styles.mark} aria-hidden="true">
          {numeral} · {label}
        </p>
        {children}
      </div>
    </section>
  );
}

const Step = ({ i, children }: { i: number; children: ReactNode }) => (
  <span className={styles.step} data-step={i}>
    {children}
  </span>
);

export default function AboutPage() {
  return (
    <div className={`${display.variable} ${body.variable}`}>
      <noscript>
        <style>{NO_SCRIPT_CSS}</style>
      </noscript>
      <AboutExperience>
        <h1 className={styles.srOnly}>About Aditya Bhardwaj</h1>

        <Block keys={[0]} length={1.4} numeral="I" label="The Business">
          <p className={styles.display}>
            <Step i={0}>Most men buy the future. Almost none of them ever see it delivered.</Step>
          </p>
          <p className={styles.text}>That&rsquo;s the whole business. Everything else is decoration.</p>
        </Block>

        <Block keys={[1, 2]} length={2.2} numeral="II" label="The Problem">
          <p className={styles.text}>
            <Step i={0}>
              Most companies come to me knowing two things: that AI matters, and that they&rsquo;ve been sold something
              they don&rsquo;t understand.
            </Step>{' '}
            <Step i={1}>
              I don&rsquo;t sell understanding. I build it, and then I hand it over, and then it&rsquo;s theirs.
            </Step>
          </p>
        </Block>

        <Block keys={[3, 4]} length={2.4} numeral="III" label="The Ledger">
          <p className={styles.text}>
            <Step i={0}>
              I&rsquo;ve taught applied AI to the Ministry of Finance. To the Ministry of Skill Development &amp;
              Entrepreneurship. I&rsquo;ve done it in front of rooms full of people who&rsquo;ve been lied to by
              better-dressed men than me. Gautam Buddha University. RKGIT. Corporate floors at Innoworq Infotech and
              ITCS.
            </Step>{' '}
            <Step i={1}>
              INOX didn&rsquo;t want a presentation. They wanted a machine that worked when nobody was watching. So I
              built them one, end to end.
            </Step>
          </p>
        </Block>

        <Block keys={[5, 5, 5, 5, 5, 5]} length={3.6} numeral="IV" label="Origin" origin ease={0.1}>
          <p className={`${styles.text} ${styles.chambers}`}>
            <Step i={0}>I didn&rsquo;t come up through code. I came up through management.</Step>{' '}
            <Step i={1}>
              I worked IT at <span className={styles.colt}>COLT</span> in London.
            </Step>{' '}
            <Step i={2}>I spent years in sales,</Step>{' '}
            <Step i={3}>which is where you learn the only thing worth knowing &mdash;</Step>{' '}
            <Step i={4}>that a clever man can build anything,</Step>{' '}
            <Step i={5}>and it means nothing until somebody in the room decides they want it.</Step>
          </p>
        </Block>

        <Block keys={[6]} length={1.7} numeral="V" label="The Man in the Room">
          <div className={styles.fallbackPortrait}>
            <Image
              src="/about-portrait.jpg"
              alt="Aditya Bhardwaj in an overcoat and hat, tipping the brim."
              width={1124}
              height={1481}
              sizes="(max-width: 900px) 80vw, 30vw"
            />
          </div>
          <p className={styles.display}>
            <Step i={0}>So I learned to be the man in the room.</Step>
          </p>
        </Block>

        <Block keys={[7, 8]} length={2.2} numeral="VI" label="The Work">
          <p className={styles.text}>
            <Step i={0}>
              Four things I do: language models, generative media, web, automation. The tools change every six
              months. The work doesn&rsquo;t.
            </Step>{' '}
            <Step i={1}>
              The work is translation &mdash; taking something complicated and putting it where a person can use it.
            </Step>
          </p>
        </Block>

        <Block keys={[9, 10]} length={2.2} numeral="VII" label="The Promise">
          <p className={styles.text}>
            <Step i={0}>Everyone in this industry is promising you the future.</Step>{' '}
            <Step i={1}>
              I&rsquo;d rather show you what your business looks like six months from now, with the right systems
              running quietly underneath it.
            </Step>
          </p>
        </Block>

        <Block keys={[11]} length={1.4} numeral="VIII" label="The Room">
          <p className={styles.display}>
            <Step i={0}>One conversation and you&rsquo;ll know whether I&rsquo;m worth the room.</Step>
          </p>
          <Link href="/book" className={styles.cta}>
            Book the conversation
          </Link>
        </Block>
      </AboutExperience>
    </div>
  );
}
