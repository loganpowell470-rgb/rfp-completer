import { useRfp } from '../../context/RfpContext';
import Icon from '../common/Icon';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import styles from './ParseStep.module.css';

export default function ParseStep() {
  const { state, actions } = useRfp();

  if (state.parseStatus === 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Spinner size={48} />
          <h2 className={styles.loadingTitle}>Analyzing your RFP</h2>
          <p className={styles.loadingText}>
            Extracting questions, requirements, and deliverables...
          </p>
        </div>
      </div>
    );
  }

  if (state.parseStatus === 'error') {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <Icon name="alertCircle" size={48} className={styles.errorIcon} />
          <h2 className={styles.errorTitle}>Parsing failed</h2>
          <p className={styles.errorText}>{state.parseError}</p>
          <div className={styles.errorActions}>
            <Button variant="secondary" onClick={() => actions.goToStep(0)}>
              <Icon name="chevronLeft" size={16} />
              Back to Upload
            </Button>
            <Button onClick={actions.parseDocument}>
              <Icon name="refresh" size={16} />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Group questions by section
  const sections = {};
  state.questions.forEach((q) => {
    if (!sections[q.section]) sections[q.section] = [];
    sections[q.section].push(q);
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.heading}>
            {state.questions.length} questions found
          </h2>
          <p className={styles.subheading}>
            Review the extracted questions below, then generate responses.
          </p>
        </div>
      </div>

      <div className={styles.sections}>
        {Object.entries(sections).map(([section, questions]) => (
          <div key={section} className={styles.section}>
            <h3 className={styles.sectionTitle}>{section}</h3>
            <div className={styles.questionList}>
              {questions.map((q) => (
                <div key={q.id} className={styles.questionCard}>
                  <span className={styles.questionId}>{q.id.toUpperCase()}</span>
                  <p className={styles.questionText}>{q.question}</p>
                  {q.required && (
                    <span className={styles.requiredBadge}>Required</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={() => actions.goToStep(0)}>
          <Icon name="chevronLeft" size={16} />
          Re-upload
        </Button>
        <Button size="lg" onClick={actions.generateResponses}>
          <Icon name="sparkles" size={18} />
          Generate Responses
        </Button>
      </div>
    </div>
  );
}
