'use client';

import { useRef, type ReactNode } from 'react';
import Chapter from '../Chapter';
import { at } from '../../_lib/reveal';
import { useInViewOnce } from '../../_lib/useScrollProgress';
import styles from '../../about.module.css';

function Row({ no, note, children }: { no: string; note?: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useInViewOnce(ref);
  return (
    <div ref={ref} className={styles.ledgerRow} data-js-reveal="">
      <span className={styles.ledgerNo} aria-hidden="true">
        {no}
      </span>
      <span className={styles.ledgerNote}>{note}</span>
      <span className={styles.ledgerEntry}>{children}</span>
    </div>
  );
}

function Aside({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useInViewOnce(ref);
  return (
    <p ref={ref} className={styles.ledgerAside} data-js-reveal="">
      {children}
    </p>
  );
}

/** III · The proof, inked into an account book — then INOX gets the floor. */
export default function Ledger() {
  return (
    <>
      <section className={styles.ledger} aria-label="The ledger" data-chapter="" data-embers={0.15} data-sound="bed">
        <div className={styles.ledgerBook}>
          <p className={styles.ledgerHead} aria-hidden="true">
            <span>III · The Ledger</span>
            <span>Accounts delivered</span>
          </p>
          <div className={styles.ledgerBody}>
            <Row no="01" note="I've taught applied AI to the">
              Ministry of Finance.
            </Row>
            <Row no="02" note="To the">
              Ministry of Skill Development &amp; Entrepreneurship.
            </Row>
            <Aside>
              I&rsquo;ve done it in front of rooms full of people who&rsquo;ve been lied to by better-dressed men than
              me.
            </Aside>
            <Row no="03">Gautam Buddha University.</Row>
            <Row no="04">RKGIT.</Row>
            <Row no="05" note="Corporate floors at">
              Innoworq Infotech and ITCS.
            </Row>
          </div>
        </div>
      </section>

      <Chapter label="INOX" length={3} embers={0.2}>
        <div className={styles.inox}>
          <p className={styles.inoxLead}>
            <span className={styles.inoxName}>INOX</span> didn&rsquo;t want a presentation.
          </p>
          <p className={`${styles.inoxWant} ${styles.reveal}`} style={at(0.22, 0.12)}>
            They wanted a machine that worked when nobody was watching.
          </p>
          <p className={`${styles.inoxBuilt} ${styles.reveal}`} style={at(0.55, 0.1)}>
            So I built them one, end to end.
          </p>
        </div>
      </Chapter>
    </>
  );
}
