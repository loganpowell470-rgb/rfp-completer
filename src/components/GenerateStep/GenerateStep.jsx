import { useRfp } from '../../context/RfpContext';
import Icon from '../common/Icon';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import styles from './GenerateStep.module.css';

export default function GenerateStep() {
  const { state, actions } = useRfp();

  if (state.generateStatus === 'error') {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <Icon name="alertCircle" size={48} className={styles.errorIcon} />
          <h2 className={styles.errorTitle}>Generation failed</h2>
          <p className={styles.errorText}>{state.generateError}</p>
          <div className={styles.errorActions}>
            <Button variant="secondary" onClick={() => actions.goToStep(1)}>
              <Icon name="chevronLeft" size={16} />
              Back to Questions
            </Button>
            <Button onClick={actions.generateResponses}>
              <Icon name="refresh" size={16} />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(state.responses).length;
  const totalCount = state.questions.length;
  const progress = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.spinnerWrap}>
          <Spinner size={56} />
        </div>
        <h2 className={styles.heading}>Generating responses</h2>
        <p className={styles.subheading}>
          Drafting answer {Math.min(answeredCount + 1, totalCount)} of {totalCount}...
        </p>

        <div className={styles.progressWrap}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={styles.progressLabel}>{progress}%</span>
        </div>

        {state.streamBuffer && (
          <div className={styles.preview}>
            <div className={styles.previewHeader}>
              <span className={styles.previewLabel}>Live preview</span>
              <span className={styles.previewDot} />
            </div>
            <p className={styles.previewText}>
              {state.streamBuffer.slice(-500)}
              <span className={styles.cursor}>|</span>
            </p>
          </div>
        )}

        {answeredCount > 0 && (
          <div className={styles.completed}>
            <Icon name="check" size={14} />
            <span>{answeredCount} response{answeredCount !== 1 ? 's' : ''} completed</span>
          </div>
        )}
      </div>
    </div>
  );
}
