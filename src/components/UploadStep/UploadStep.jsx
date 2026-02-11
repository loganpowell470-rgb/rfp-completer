import { useRfp } from '../../context/RfpContext';
import { useFileUpload } from '../../hooks/useFileUpload';
import Icon from '../common/Icon';
import Button from '../common/Button';
import styles from './UploadStep.module.css';

export default function UploadStep() {
  const { state, actions } = useRfp();

  const { isDragging, error, handleDragOver, handleDragLeave, handleDrop, handleFileSelect } =
    useFileUpload({ onFile: actions.uploadPdf });

  const hasContent = state.uploadType === 'pdf' ? !!state.pdfBase64 : state.rawText.trim().length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h2 className={styles.heading}>Upload your RFP</h2>
        <p className={styles.subheading}>
          Drop a PDF or paste the RFP text below. We'll extract every question and generate draft responses.
        </p>
      </div>

      <div className={styles.inputs}>
        <div
          className={`${styles.dropZone} ${isDragging ? styles.dropZoneDragging : ''} ${state.pdfFilename ? styles.dropZoneHasFile : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {state.pdfFilename ? (
            <div className={styles.fileInfo}>
              <Icon name="file" size={32} className={styles.fileIcon} />
              <span className={styles.fileName}>{state.pdfFilename}</span>
              <span className={styles.fileSize}>
                {(state.pdfBase64.length * 0.75 / 1024 / 1024).toFixed(1)} MB
              </span>
              <button
                className={styles.removeFile}
                onClick={() => actions.uploadText('')}
              >
                <Icon name="x" size={16} />
              </button>
            </div>
          ) : (
            <>
              <Icon name="upload" size={36} className={styles.uploadIcon} />
              <p className={styles.dropText}>
                {isDragging ? 'Drop your PDF here' : 'Drag & drop your RFP document'}
              </p>
              <p className={styles.dropSubtext}>or</p>
              <label className={styles.browseButton}>
                Browse files
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className={styles.fileInput}
                />
              </label>
              <p className={styles.fileTypes}>PDF files up to 32MB</p>
            </>
          )}
        </div>

        <div className={styles.dividerRow}>
          <div className={styles.dividerLine} />
          <span className={styles.dividerText}>or paste text</span>
          <div className={styles.dividerLine} />
        </div>

        <textarea
          className={styles.textArea}
          placeholder="Paste your RFP content here..."
          value={state.rawText}
          onChange={(e) => actions.uploadText(e.target.value)}
          rows={8}
          disabled={!!state.pdfFilename}
        />
      </div>

      {error && (
        <div className={styles.error}>
          <Icon name="alertCircle" size={16} />
          {error}
        </div>
      )}

      <div className={styles.actions}>
        <Button
          size="lg"
          onClick={actions.parseDocument}
          disabled={!hasContent}
          loading={state.parseStatus === 'loading'}
        >
          <Icon name="search" size={18} />
          Parse Document
        </Button>
      </div>
    </div>
  );
}
