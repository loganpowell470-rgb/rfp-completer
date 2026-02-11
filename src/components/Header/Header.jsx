import { useRfp } from '../../context/RfpContext';
import Icon from '../common/Icon';
import styles from './Header.module.css';

export default function Header() {
  const { state, actions } = useRfp();

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title} onClick={actions.reset}>
          RFP<span className={styles.dot}>.</span>Engine
        </h1>
      </div>
      <div className={styles.right}>
        <button
          className={`${styles.kbButton} ${state.kbPanelOpen ? styles.kbButtonActive : ''}`}
          onClick={actions.toggleKbPanel}
          title="Knowledge Base"
        >
          <Icon name="book" size={18} />
          <span>Knowledge Base</span>
        </button>
      </div>
    </header>
  );
}
