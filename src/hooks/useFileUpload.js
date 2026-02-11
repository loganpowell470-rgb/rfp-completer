import { useState, useCallback } from 'react';
import { MAX_FILE_SIZE, ACCEPTED_FILE_TYPES } from '../utils/constants';

export function useFileUpload({ onFile }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);

  const validateFile = useCallback((file) => {
    setError(null);
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_FILE_TYPES.includes(ext)) {
      setError(`Unsupported file type. Please upload a PDF file.`);
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
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      onFile({ base64, filename: file.name, size: file.size });
    };
    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  }, [validateFile, onFile]);

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
