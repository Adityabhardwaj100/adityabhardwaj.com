'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './NavBar.module.css';

const SECTIONS = [
  { href: '/about', label: 'About' },
  { href: '/journal', label: 'Journal' },
  { href: '/tunes', label: 'Tunes' },
  { href: '/book', label: 'Book' },
  { href: '/game', label: 'Game' },
];

/**
 * Site-wide section nav, fixed to the top-left corner on every route.
 * Each section is a pill button: dark by default, and solid white with
 * black text for whichever section is currently open.
 */
export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Site sections">
      {SECTIONS.map(({ href, label }) => {
        const active = pathname === href || pathname?.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} className={styles.item} data-active={active || undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
