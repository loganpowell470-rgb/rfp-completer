export const STEPS = [
  { id: 0, label: 'Upload', icon: 'upload' },
  { id: 1, label: 'Parse', icon: 'search' },
  { id: 2, label: 'Generate', icon: 'sparkles' },
  { id: 3, label: 'Review', icon: 'check' },
];

export const API_ENDPOINTS = {
  parse: '/api/parse',
  generate: '/api/generate',
  regenerate: '/api/regenerate',
};

export const MAX_FILE_SIZE = 32 * 1024 * 1024; // 32MB
export const ACCEPTED_FILE_TYPES = ['.pdf', '.csv', '.xlsx', '.xls'];
