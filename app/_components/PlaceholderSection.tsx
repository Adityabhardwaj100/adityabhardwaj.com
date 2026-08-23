import styles from './PlaceholderSection.module.css';

/** Shared shell for sections that don't have real content yet. */
export default function PlaceholderSection({ title }: { title: string }) {
  return (
    <main className={styles.main}>
      <p className={styles.text}>{title} — coming soon.</p>
    </main>
  );
}
