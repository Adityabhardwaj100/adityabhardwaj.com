import type { Metadata } from 'next';
import { EB_Garamond, Instrument_Serif } from 'next/font/google';
import Atmosphere from './_components/Atmosphere';
import Embers from './_components/Embers';
import SoundToggle from './_components/SoundToggle';
import Business from './_components/chapters/Business';
import Problem from './_components/chapters/Problem';
import Ledger from './_components/chapters/Ledger';
import Origin from './_components/chapters/Origin';
import ManInTheRoom from './_components/chapters/ManInTheRoom';
import Work from './_components/chapters/Work';
import PromiseChapter from './_components/chapters/Promise';
import Room from './_components/chapters/Room';
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

/** Without JavaScript, every chapter simply shows its finished state. */
const NO_SCRIPT_CSS = `
  [data-chapter] { --p: 1 !important; height: auto !important; }
  [data-chapter] > div { position: relative !important; height: auto !important; min-height: 100vh; }
  [data-js-reveal] { opacity: 1 !important; transform: none !important; filter: none !important; clip-path: none !important; }
  [data-haze] { -webkit-mask: none !important; mask: none !important; }
  [data-promise] { display: flex !important; flex-direction: column; gap: 2rem; }
`;

export default function AboutPage() {
  return (
    <main className={`${styles.page} ${display.variable} ${body.variable}`}>
      <noscript>
        <style>{NO_SCRIPT_CSS}</style>
      </noscript>
      <h1 className={styles.srOnly}>About Aditya Bhardwaj</h1>

      <Embers />
      <div className={styles.grain} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />

      <div className={styles.content}>
        <Business />
        <Problem />
        <Ledger />
        <Origin />
        <ManInTheRoom />
        <Work />
        <PromiseChapter />
        <Room />
      </div>

      <SoundToggle />
      <Atmosphere />
    </main>
  );
}
