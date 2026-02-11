import { useState } from 'react';
import { useRfp } from '../../context/RfpContext';
import { useToast } from '../../context/ToastContext';
import Icon from '../common/Icon';
import Button from '../common/Button';
import ResponseCard from './ResponseCard';
import { formatAsMarkdown, copyToClipboard, downloadAsFile } from '../../utils/formatExport';
import styles from './ReviewStep.module.css';

export default function ReviewStep() {
  const { state, stats } = useRfp();
  const { showToast } = useToast();
  const [filterSection, setFilterSection] = useState('all');

  // Get unique sections
  const sections = [...new Set(state.questions.map(q => q.section))];

  const filteredQuestions = filterSection === 'all'
    ? state.questions
    : state.questions.filter(q => q.section === filterSection);

  const handleCopyAll = async () => {
    const md = formatAsMarkdown(state.questions, state.responses);
    await copyToClipboard(md);
    showToast('All responses copied to clipboard');
  };

  const handleDownload = () => {
    const md = formatAsMarkdown(state.questions, state.responses);
    downloadAsFile(md, 'rfp-response.md');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h2 className={styles.heading}>Review & Export</h2>
          <p className={styles.subheading}>
            {stats.answeredCount} of {stats.questionCount} questions answered
            {' '}&middot;{' '}
            {stats.totalWordCount.toLocaleString()} words total
          </p>
        </div>
        <div className={styles.exportActions}>
          <Button variant="secondary" onClick={handleCopyAll}>
            <Icon name="copy" size={16} />
            Copy All
          </Button>
          <Button onClick={handleDownload}>
            <Icon name="download" size={16} />
            Download
          </Button>
        </div>
      </div>

      {sections.length > 1 && (
        <div className={styles.filters}>
          <button
            className={`${styles.filterChip} ${filterSection === 'all' ? styles.filterActive : ''}`}
            onClick={() => setFilterSection('all')}
          >
            All ({state.questions.length})
          </button>
          {sections.map(section => (
            <button
              key={section}
              className={`${styles.filterChip} ${filterSection === section ? styles.filterActive : ''}`}
              onClick={() => setFilterSection(section)}
            >
              {section}
            </button>
          ))}
        </div>
      )}

      <div className={styles.responseList}>
        {filteredQuestions.map((question, i) => (
          <div key={question.id} style={{ animationDelay: `${i * 0.05}s` }}>
            <ResponseCard question={question} />
          </div>
        ))}
      </div>
    </div>
  );
}
