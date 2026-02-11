import { useState, useEffect } from 'react';
import { useRfp } from '../../context/RfpContext';
import Icon from '../common/Icon';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import styles from './ParseStep.module.css';

const LOADING_PHASES = [
  'Reading document structure...',
  'Identifying sections and categories...',
  'Extracting questions and requirements...',
  'Analyzing customer priorities...',
  'Finalizing results...',
];

const PRIORITY_COLORS = {
  high: 'var(--color-error)',
  medium: 'var(--color-warning)',
  low: 'var(--color-success)',
};

const PRIORITY_BG = {
  high: 'rgba(224, 122, 122, 0.12)',
  medium: 'rgba(242, 204, 143, 0.12)',
  low: 'rgba(129, 178, 154, 0.12)',
};

function LoadingPhase() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(p => (p + 1) % LOADING_PHASES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return <p className={styles.loadingText}>{LOADING_PHASES[phase]}</p>;
}

export default function ParseStep() {
  const { state, actions } = useRfp();

  if (state.parseStatus === 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Spinner size={48} />
          <h2 className={styles.loadingTitle}>Analyzing your RFP</h2>
          <LoadingPhase />
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

  const summary = state.rfpSummary;

  return (
    <div className={styles.container}>
      {/* Summary Panel */}
      {summary && (
        <div className={styles.summaryPanel} style={{ animationDelay: '0s' }}>
          <div className={styles.summaryHeader}>
            <Icon name="barChart" size={18} className={styles.summaryIcon} />
            <h3 className={styles.summaryTitle}>RFP Summary</h3>
          </div>
          <p className={styles.summaryOverview}>{summary.overview}</p>

          {summary.priorities && summary.priorities.length > 0 && (
            <div className={styles.priorities}>
              <div className={styles.prioritiesHeader}>
                <Icon name="target" size={14} />
                <span className={styles.prioritiesLabel}>Customer Priorities</span>
              </div>
              <div className={styles.priorityList}>
                {summary.priorities.map((p, i) => (
                  <div
                    key={i}
                    className={styles.priorityItem}
                    style={{
                      '--priority-color': PRIORITY_COLORS[p.level] || PRIORITY_COLORS.medium,
                      '--priority-bg': PRIORITY_BG[p.level] || PRIORITY_BG.medium,
                      animationDelay: `${0.15 + i * 0.08}s`,
                    }}
                  >
                    <div className={styles.priorityTop}>
                      <span className={styles.priorityBadge}>{p.level}</span>
                      <span className={styles.priorityName}>{p.priority}</span>
                    </div>
                    <p className={styles.priorityDesc}>{p.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Question list header */}
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <h2 className={styles.heading}>
            <span className={styles.headingCount}>{state.questions.length}</span> questions found
          </h2>
          <span className={styles.successBadge}>
            <Icon name="check" size={12} />
            Parsed
          </span>
        </div>
        <p className={styles.subheading}>
          Review the extracted questions below, then generate responses.
        </p>
      </div>

      <div className={styles.sections}>
        {Object.entries(sections).map(([section, questions], sectionIdx) => (
          <div key={section} className={styles.section} style={{ animationDelay: `${sectionIdx * 0.1}s` }}>
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
