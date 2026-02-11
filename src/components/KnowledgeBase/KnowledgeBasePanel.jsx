import { useState, useEffect, useRef, useCallback } from 'react';
import { useRfp } from '../../context/RfpContext';
import Icon from '../common/Icon';
import styles from './KnowledgeBasePanel.module.css';

const KB_SECTIONS = [
  {
    key: 'Company Overview',
    label: 'Company Overview',
    icon: 'building',
    placeholder: 'Company name, founding year, headquarters, offices, mission statement, employee count...',
  },
  {
    key: 'Core Services',
    label: 'Core Services',
    icon: 'sparkles',
    placeholder: 'Service lines, technologies, specializations, delivery models...',
  },
  {
    key: 'Team & Qualifications',
    label: 'Team & Qualifications',
    icon: 'users',
    placeholder: 'Team size, certifications, key leadership, average experience...',
  },
  {
    key: 'Past Performance',
    label: 'Past Performance',
    icon: 'file',
    placeholder: 'Contract name, client, value, dates, outcomes, metrics...',
  },
  {
    key: 'Compliance & Certifications',
    label: 'Compliance & Certifications',
    icon: 'check',
    placeholder: 'FedRAMP, SOC 2, ISO 27001, CMMC, clearances, Section 508...',
  },
  {
    key: 'Differentiators',
    label: 'Differentiators',
    icon: 'target',
    placeholder: 'What sets you apart? Proprietary tools, retention rates, methodology...',
  },
];

function parseKB(text) {
  const sections = {};
  KB_SECTIONS.forEach((s) => (sections[s.key] = ''));

  if (!text || !text.trim()) return sections;

  const headerRegex = /^# (.+)$/gm;
  const matches = [...text.matchAll(headerRegex)];

  if (matches.length === 0) {
    // No headers found — put everything in Company Overview
    sections['Company Overview'] = text.trim();
    return sections;
  }

  for (let i = 0; i < matches.length; i++) {
    const headerName = matches[i][1].trim();
    const startIdx = matches[i].index + matches[i][0].length;
    const endIdx = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const content = text.substring(startIdx, endIdx).trim();

    // Match header to a known section
    const section = KB_SECTIONS.find(
      (s) => s.key.toLowerCase() === headerName.toLowerCase()
    );
    if (section) {
      sections[section.key] = content;
    } else {
      // Unknown header — append to the closest match or Company Overview
      const closest = KB_SECTIONS.find((s) =>
        headerName.toLowerCase().includes(s.key.toLowerCase().split(' ')[0].toLowerCase())
      );
      const targetKey = closest ? closest.key : 'Company Overview';
      const prefix = sections[targetKey] ? sections[targetKey] + '\n\n' : '';
      sections[targetKey] = prefix + `# ${headerName}\n${content}`;
    }
  }

  return sections;
}

function serializeKB(sections) {
  return KB_SECTIONS
    .filter((s) => sections[s.key]?.trim())
    .map((s) => `# ${s.key}\n${sections[s.key].trim()}`)
    .join('\n\n');
}

function wordCount(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

function SectionCard({ section, value, onChange, defaultExpanded }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const textareaRef = useRef(null);
  const words = wordCount(value);
  const hasFill = value.trim().length > 0;

  useEffect(() => {
    if (expanded && textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = 'auto';
      el.style.height = Math.max(80, el.scrollHeight) + 'px';
    }
  }, [expanded, value]);

  return (
    <div className={`${styles.sectionCard} ${expanded ? styles.sectionCardExpanded : ''}`}>
      <button
        className={styles.sectionHeader}
        onClick={() => setExpanded(!expanded)}
        type="button"
      >
        <Icon name={section.icon} size={16} className={styles.sectionIcon} />
        <span className={styles.sectionLabel}>{section.label}</span>
        {words > 0 && (
          <span className={styles.wordBadge}>{words}w</span>
        )}
        <span className={`${styles.indicator} ${hasFill ? styles.indicatorFilled : ''}`} />
        <Icon
          name={expanded ? 'chevronRight' : 'chevronRight'}
          size={14}
          className={`${styles.chevron} ${expanded ? styles.chevronExpanded : ''}`}
        />
      </button>
      {expanded && (
        <div className={styles.sectionBody}>
          <textarea
            ref={textareaRef}
            className={styles.sectionTextarea}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              // Auto-resize
              const el = e.target;
              el.style.height = 'auto';
              el.style.height = Math.max(80, el.scrollHeight) + 'px';
            }}
            placeholder={section.placeholder}
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );
}

export default function KnowledgeBasePanel() {
  const { state, actions } = useRfp();
  const [sections, setSections] = useState(() => parseKB(state.knowledgeBase));

  // Sync from parent state when panel opens
  const prevOpen = useRef(state.kbPanelOpen);
  useEffect(() => {
    if (state.kbPanelOpen && !prevOpen.current) {
      setSections(parseKB(state.knowledgeBase));
    }
    prevOpen.current = state.kbPanelOpen;
  }, [state.kbPanelOpen, state.knowledgeBase]);

  const handleSectionChange = useCallback(
    (key, value) => {
      setSections((prev) => {
        const next = { ...prev, [key]: value };
        actions.setKnowledgeBase(serializeKB(next));
        return next;
      });
    },
    [actions]
  );

  if (!state.kbPanelOpen) return null;

  const totalWords = KB_SECTIONS.reduce(
    (sum, s) => sum + wordCount(sections[s.key]),
    0
  );
  const filledCount = KB_SECTIONS.filter((s) => sections[s.key]?.trim()).length;

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
        <div className={styles.meta}>
          <p className={styles.description}>
            Company context used to generate responses. Fill in each section to improve output quality.
          </p>
          <div className={styles.stats}>
            <span className={styles.stat}>
              {filledCount}/{KB_SECTIONS.length} sections
            </span>
            <span className={styles.statDot}>·</span>
            <span className={styles.stat}>{totalWords} words</span>
          </div>
        </div>
        <div className={styles.sectionsList}>
          {KB_SECTIONS.map((section) => (
            <SectionCard
              key={section.key}
              section={section}
              value={sections[section.key] || ''}
              onChange={(val) => handleSectionChange(section.key, val)}
              defaultExpanded={!!sections[section.key]?.trim()}
            />
          ))}
        </div>
      </div>
    </>
  );
}
