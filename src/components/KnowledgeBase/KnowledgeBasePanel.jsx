import { useRfp } from '../../context/RfpContext';
import Icon from '../common/Icon';
import styles from './KnowledgeBasePanel.module.css';

export default function KnowledgeBasePanel() {
  const { state, actions } = useRfp();

  if (!state.kbPanelOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={actions.closeKbPanel} />
      <div className={styles.panel}>
        <div className={styles.header}>
          <h3 className={styles.title}>Knowledge Base</h3>
          <button className={styles.closeBtn} onClick={actions.closeKbPanel}>
            <Icon name="x" size={20} />
          </button>
        </div>
        <p className={styles.description}>
          This context is used to generate responses. Edit to match your company.
        </p>
        <textarea
          className={styles.textarea}
          value={state.knowledgeBase}
          onChange={(e) => actions.setKnowledgeBase(e.target.value)}
          spellCheck={false}
        />
      </div>
    </>
  );
}
