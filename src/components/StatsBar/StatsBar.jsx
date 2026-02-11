import { useRfp } from '../../context/RfpContext';
import styles from './StatsBar.module.css';

export default function StatsBar() {
  const { stats, state } = useRfp();

  if (state.currentStep < 1 || stats.questionCount === 0) return null;

  return (
    <div className={styles.bar}>
      <div className={styles.stat}>
        <span className={styles.value}>{stats.questionCount}</span>
        <span className={styles.label}>Questions</span>
      </div>
      <div className={styles.divider} />
      <div className={styles.stat}>
        <span className={styles.value}>{stats.answeredCount}</span>
        <span className={styles.label}>Answered</span>
      </div>
      <div className={styles.divider} />
      <div className={styles.stat}>
        <span className={styles.value}>{stats.totalWordCount.toLocaleString()}</span>
        <span className={styles.label}>Words</span>
      </div>
    </div>
  );
}
