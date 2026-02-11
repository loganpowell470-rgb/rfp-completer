import { useState, useCallback } from 'react';
import { MAX_FILE_SIZE, ACCEPTED_FILE_TYPES } from '../utils/constants';
import * as XLSX from 'xlsx';

const SPREADSHEET_TYPES = ['.csv', '.xlsx', '.xls'];

function spreadsheetToText(workbook) {
  const lines = [];
  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (workbook.SheetNames.length > 1) {
      lines.push(`\n--- Sheet: ${sheetName} ---\n`);
    }
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    lines.push(csv);
  });
  return lines.join('\n').trim();
}

export function useFileUpload({ onFile, onSpreadsheet }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);

  const validateFile = useCallback((file) => {
    setError(null);
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_FILE_TYPES.includes(ext)) {
      setError(`Unsupported file type. Please upload a PDF, CSV, or Excel file.`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large. Maximum size is 32MB.`);
      return false;
    }
    return true;
  }, []);

  const processFile = useCallback((file) => {
    if (!validateFile(file)) return;

    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (SPREADSHEET_TYPES.includes(ext)) {
      // Handle CSV/Excel: parse with SheetJS and convert to text
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const text = spreadsheetToText(workbook);
          if (!text.trim()) {
            setError('The file appears to be empty.');
            return;
          }
          onSpreadsheet({ text, filename: file.name, size: file.size });
        } catch {
          setError('Failed to parse spreadsheet. Please check the file format.');
        }
      };
      reader.onerror = () => {
        setError('Failed to read file. Please try again.');
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Handle PDF: read as base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        onFile({ base64, filename: file.name, size: file.size });
      };
      reader.onerror = () => {
        setError('Failed to read file. Please try again.');
      };
      reader.readAsDataURL(file);
    }
  }, [validateFile, onFile, onSpreadsheet]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  }, [processFile]);

  return {
    isDragging,
    error,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    clearError: () => setError(null),
  };
}
