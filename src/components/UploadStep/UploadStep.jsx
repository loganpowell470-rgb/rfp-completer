import { useRfp } from '../../context/RfpContext';
import { useFileUpload } from '../../hooks/useFileUpload';
import Icon from '../common/Icon';
import Button from '../common/Button';
import styles from './UploadStep.module.css';

export default function UploadStep() {
  const { state, actions } = useRfp();

  const { isDragging, error, handleDragOver, handleDragLeave, handleDrop, handleFileSelect } =
    useFileUpload({
      onFile: actions.uploadPdf,
      onSpreadsheet: actions.uploadSpreadsheet,
    });

  const hasFile = !!state.pdfFilename || !!state.spreadsheetFilename;
  const displayFilename = state.pdfFilename || state.spreadsheetFilename;
  const hasContent = hasFile || state.rawText.trim().length > 0;

  const getFileSize = () => {
    if (state.pdfBase64) {
      return `${(state.pdfBase64.length * 0.75 / 1024 / 1024).toFixed(1)} MB`;
    }
    if (state.spreadsheetFilename && state.rawText) {
      const kb = new Blob([state.rawText]).size / 1024;
      return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
    }
    return '';
  };

  const getFileIcon = () => {
    if (state.spreadsheetFilename) return 'table';
    return 'file';
  };

  const handleRemoveFile = () => {
    actions.uploadText('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h2 className={styles.heading}>Upload your RFP</h2>
        <p className={styles.subheading}>
          Drop a PDF, CSV, or Excel file — or paste the RFP text below. We'll extract every question and generate draft responses.
        </p>
      </div>

      <div className={styles.inputs}>
        <div
          className={`${styles.dropZone} ${isDragging ? styles.dropZoneDragging : ''} ${hasFile ? styles.dropZoneHasFile : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {hasFile ? (
            <div className={styles.fileInfo}>
              <Icon name={getFileIcon()} size={32} className={styles.fileIcon} />
              <span className={styles.fileName}>{displayFilename}</span>
              <span className={styles.fileSize}>{getFileSize()}</span>
              <button
                className={styles.removeFile}
                onClick={handleRemoveFile}
              >
                <Icon name="x" size={16} />
              </button>
            </div>
          ) : (
            <>
              <Icon name="upload" size={36} className={styles.uploadIcon} />
              <p className={styles.dropText}>
                {isDragging ? 'Drop your file here' : 'Drag & drop your RFP document'}
              </p>
              <p className={styles.dropSubtext}>or</p>
              <label className={styles.browseButton}>
                Browse files
                <input
                  type="file"
                  accept=".pdf,.csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className={styles.fileInput}
                />
              </label>
              <p className={styles.fileTypes}>PDF, CSV, Excel files up to 32MB</p>
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
