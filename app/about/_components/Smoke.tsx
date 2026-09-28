import styles from '../about.module.css';

/** Slow-drifting smoke. Its opacity is driven by the parent via `--smoke`. */
export default function Smoke({ className }: { className?: string }) {
  return (
    <div className={`${styles.smoke} ${className ?? ''}`} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </div>
  );
}
