import { useState, useRef, useEffect } from 'react';
import { useRfp } from '../../context/RfpContext';
import Icon from '../common/Icon';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { countWords } from '../../utils/formatExport';
import styles from './ResponseCard.module.css';

export default function ResponseCard({ question }) {
  const { state, actions } = useRfp();
  const response = state.responses[question.id];
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [showRegenForm, setShowRegenForm] = useState(false);
  const [regenInstructions, setRegenInstructions] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  const handleEdit = () => {
    setEditText(response?.text || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    actions.updateResponse(question.id, editText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditText('');
  };

  const handleRegenerate = () => {
    actions.regenerateResponse(question.id, regenInstructions);
    setShowRegenForm(false);
    setRegenInstructions('');
  };

  const handleTextareaInput = (e) => {
    setEditText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const wordCount = countWords(response?.text);

  return (
    <div className={`${styles.card} ${response?.edited ? styles.edited : ''}`}>
      <div className={styles.questionHeader}>
        <span className={styles.questionId}>{question.id.toUpperCase()}</span>
        <span className={styles.section}>{question.section}</span>
        {question.required && (
          <span className={styles.requiredBadge}>Required</span>
        )}
      </div>

      <h4 className={styles.questionText}>{question.question}</h4>

      <div className={styles.responseArea}>
        {response?.regenerating ? (
          <div className={styles.regenerating}>
            <Spinner size={20} />
            <span>Regenerating response...</span>
          </div>
        ) : isEditing ? (
          <div className={styles.editArea}>
            <textarea
              ref={textareaRef}
              className={styles.editTextarea}
              value={editText}
              onChange={handleTextareaInput}
            />
            <div className={styles.editActions}>
              <Button size="sm" onClick={handleSave}>Save</Button>
              <Button size="sm" variant="ghost" onClick={handleCancel}>Cancel</Button>
            </div>
          </div>
        ) : (
          <p className={styles.responseText}>{response?.text || 'No response generated'}</p>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <span className={styles.wordCount}>{wordCount} words</span>
          {response?.edited && <span className={styles.editedBadge}>Edited</span>}
        </div>
        <div className={styles.footerActions}>
          {!isEditing && !response?.regenerating && (
            <>
              <button className={styles.actionBtn} onClick={handleEdit} title="Edit response">
                <Icon name="edit" size={15} />
              </button>
              <button
                className={styles.actionBtn}
                onClick={() => setShowRegenForm(!showRegenForm)}
                title="Regenerate response"
              >
                <Icon name="refresh" size={15} />
              </button>
              <button
                className={styles.actionBtn}
                onClick={() => navigator.clipboard.writeText(response?.text || '')}
                title="Copy response"
              >
                <Icon name="copy" size={15} />
              </button>
            </>
          )}
        </div>
      </div>

      {showRegenForm && (
        <div className={styles.regenForm}>
          <input
            className={styles.regenInput}
            type="text"
            placeholder="Optional: Add instructions (e.g., 'Make it more concise')"
            value={regenInstructions}
            onChange={(e) => setRegenInstructions(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRegenerate()}
          />
          <Button size="sm" onClick={handleRegenerate}>
            <Icon name="sparkles" size={14} />
            Regenerate
          </Button>
        </div>
      )}
    </div>
  );
}
