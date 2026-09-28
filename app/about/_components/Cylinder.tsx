'use client';

import { useId, type CSSProperties } from 'react';
import styles from '../about.module.css';

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const CHAMBER_RADIUS = 58;

const polar = (radius: number, deg: number) => {
  const rad = (deg * Math.PI) / 180;
  return { x: +(radius * Math.cos(rad)).toFixed(3), y: +(radius * Math.sin(rad)).toFixed(3) };
};

interface CylinderProps {
  /** Degrees of rotation; one chamber is 60°. */
  rotation: number;
  /** Light the chamber at the top (under the hammer). */
  lit?: boolean;
  /** Fire the spark flare when the cylinder locks. */
  spark?: boolean;
  className?: string;
}

/**
 * A six-chamber revolver cylinder seen end-on, in engraved brass. The
 * metal rotates; the light (sheen, forge rim, lit chamber) stays put in a
 * separate overlay so it reads as an object turning under a fixed lamp.
 */
export default function Cylinder({ rotation, lit = true, spark = false, className }: CylinderProps) {
  const uid = useId().replace(/:/g, '');
  const id = (name: string) => `${name}-${uid}`;

  const chambers = NUMERALS.map((numeral, i) => ({ numeral, angle: -90 + i * 60 }));

  return (
    <div className={`${styles.cylinder} ${className ?? ''}`} data-spark={spark || undefined} aria-hidden="true">
      <svg
        className={styles.cylinderMetal}
        viewBox="-120 -120 240 240"
        style={{ '--rot': `${rotation}deg` } as CSSProperties}
      >
        <defs>
          <radialGradient id={id('face')} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8a6a3c" />
            <stop offset="55%" stopColor="#6d522d" />
            <stop offset="88%" stopColor="#4a371d" />
            <stop offset="100%" stopColor="#241a0d" />
          </radialGradient>
          <radialGradient id={id('bore')} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000" />
            <stop offset="62%" stopColor="#070604" />
            <stop offset="86%" stopColor="#1d150b" />
            <stop offset="100%" stopColor="#5a4323" />
          </radialGradient>
          <radialGradient id={id('pin')} cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#e3c58a" />
            <stop offset="60%" stopColor="#8f6c3a" />
            <stop offset="100%" stopColor="#3a2a15" />
          </radialGradient>
          <mask id={id('flutes')}>
            <circle r="100" fill="#fff" />
            {chambers.map(({ angle }) => {
              const p = polar(111, angle + 30);
              return <ellipse key={angle} cx={p.x} cy={p.y} rx="20" ry="20" fill="#000" />;
            })}
          </mask>
        </defs>

        <g mask={`url(#${id('flutes')})`}>
          <circle r="100" fill={`url(#${id('face')})`} />
          {/* Engraved rings */}
          <circle r="94" fill="none" stroke="#2a1e0f" strokeWidth="1.2" />
          <circle r="90" fill="none" stroke="#b38c52" strokeOpacity="0.35" strokeWidth="0.6" />
          <circle r="86" fill="none" stroke="#2a1e0f" strokeWidth="0.6" strokeDasharray="1.5 3" />
          <circle r="31" fill="none" stroke="#2a1e0f" strokeWidth="1" />
          <circle r="34" fill="none" stroke="#b38c52" strokeOpacity="0.3" strokeWidth="0.5" />
        </g>

        {/* Flute lips — a thin bright edge where each groove was cut */}
        {chambers.map(({ angle }) => {
          const a = polar(100, angle + 19);
          const b = polar(100, angle + 41);
          return (
            <path
              key={`lip-${angle}`}
              d={`M ${a.x} ${a.y} A 20 20 0 0 0 ${b.x} ${b.y}`}
              fill="none"
              stroke="#c9a263"
              strokeOpacity="0.45"
              strokeWidth="0.8"
            />
          );
        })}

        {chambers.map(({ numeral, angle }) => {
          const c = polar(CHAMBER_RADIUS, angle);
          const n = polar(80, angle);
          const dot = polar(CHAMBER_RADIUS, angle + 30);
          return (
            <g key={numeral}>
              <circle cx={c.x} cy={c.y} r="25.5" fill="#2d2111" stroke="#c9a263" strokeOpacity="0.55" strokeWidth="0.9" />
              <circle cx={c.x} cy={c.y} r="21" fill={`url(#${id('bore')})`} />
              <circle cx={c.x} cy={c.y} r="21" fill="none" stroke="#000" strokeOpacity="0.6" strokeWidth="1.5" />
              <text
                x={n.x}
                y={n.y}
                transform={`rotate(${angle + 90} ${n.x} ${n.y})`}
                className={styles.cylinderNumeral}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {numeral}
              </text>
              <circle cx={dot.x} cy={dot.y} r="1.6" fill="#241a0d" />
            </g>
          );
        })}

        {/* Ratchet star and centre pin */}
        <path
          d={chambers
            .map(({ angle }, i) => {
              const tip = polar(20, angle + 30);
              const root = polar(12, angle);
              return `${i === 0 ? 'M' : 'L'} ${root.x} ${root.y} L ${tip.x} ${tip.y}`;
            })
            .join(' ')
            .concat(' Z')}
          fill="#3a2a15"
          stroke="#b38c52"
          strokeOpacity="0.5"
          strokeWidth="0.6"
        />
        <circle r="8" fill={`url(#${id('pin')})`} />
        <circle r="2.2" fill="#1a1209" />
      </svg>

      {/* Fixed light — does not rotate */}
      <svg className={styles.cylinderLight} viewBox="-120 -120 240 240">
        <defs>
          <linearGradient id={id('sheen')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff3dc" stopOpacity="0.32" />
            <stop offset="40%" stopColor="#fff3dc" stopOpacity="0" />
            <stop offset="75%" stopColor="#000" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id={id('rim')} x1="1" y1="0.4" x2="0" y2="0.6">
            <stop offset="0%" stopColor="#ff8a3d" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#e2692a" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#e2692a" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={id('glow')}>
            <stop offset="0%" stopColor="#ffb070" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#e2692a" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#e2692a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle r="100" fill={`url(#${id('sheen')})`} />
        <circle r="99" fill="none" stroke={`url(#${id('rim')})`} strokeWidth="2.5" />
        <g className={styles.cylinderGlow} data-lit={lit || undefined}>
          <circle cx="0" cy={-CHAMBER_RADIUS} r="30" fill={`url(#${id('glow')})`} />
          <circle cx="0" cy={-CHAMBER_RADIUS} r="25.5" fill="none" stroke="#ff9a52" strokeWidth="1.2" />
        </g>
        {/* The hammer's mark */}
        <path d="M 0 -103 L -6 -116 L 6 -116 Z" fill="#a8834a" />
        <g className={styles.cylinderSpark}>
          <circle cx="0" cy={-CHAMBER_RADIUS} r="40" fill={`url(#${id('glow')})`} />
          {Array.from({ length: 10 }, (_, i) => {
            const a = polar(1, i * 36 - 90);
            return (
              <line
                key={i}
                x1={a.x * 10}
                y1={-CHAMBER_RADIUS + a.y * 10}
                x2={a.x * 34}
                y2={-CHAMBER_RADIUS + a.y * 34}
                stroke="#ffc58f"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
