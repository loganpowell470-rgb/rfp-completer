import { useReducer, useCallback } from 'react';
import { SAMPLE_KNOWLEDGE_BASE } from '../data/sampleKnowledgeBase';
import { API_ENDPOINTS } from '../utils/constants';
import { useStreamingResponse } from './useStreamingResponse';
import { countWords } from '../utils/formatExport';

const initialState = {
  currentStep: 0,

  // Upload
  uploadType: null,
  pdfBase64: null,
  pdfFilename: null,
  rawText: '',

  // Knowledge base
  knowledgeBase: SAMPLE_KNOWLEDGE_BASE,

  // Parse
  parseStatus: 'idle',
  parseError: null,
  questions: [],

  // Generate
  generateStatus: 'idle',
  generateError: null,
  generateProgress: 0,
  currentGeneratingId: null,
  streamBuffer: '',

  // Responses
  responses: {},

  // Knowledge base panel
  kbPanelOpen: false,
};

function rfpReducer(state, action) {
  switch (action.type) {
    case 'SET_PDF':
      return {
        ...state,
        uploadType: 'pdf',
        pdfBase64: action.payload.base64,
        pdfFilename: action.payload.filename,
        rawText: '',
      };

    case 'SET_TEXT':
      return {
        ...state,
        uploadType: 'text',
        rawText: action.payload,
        pdfBase64: null,
        pdfFilename: null,
      };

    case 'SET_KNOWLEDGE_BASE':
      return { ...state, knowledgeBase: action.payload };

    case 'TOGGLE_KB_PANEL':
      return { ...state, kbPanelOpen: !state.kbPanelOpen };

    case 'CLOSE_KB_PANEL':
      return { ...state, kbPanelOpen: false };

    case 'PARSE_START':
      return { ...state, parseStatus: 'loading', parseError: null, currentStep: 1 };

    case 'PARSE_SUCCESS':
      return {
        ...state,
        parseStatus: 'success',
        questions: action.payload,
        responses: {},
      };

    case 'PARSE_ERROR':
      return { ...state, parseStatus: 'error', parseError: action.payload };

    case 'GENERATE_START':
      return {
        ...state,
        generateStatus: 'loading',
        generateError: null,
        generateProgress: 0,
        currentGeneratingId: null,
        streamBuffer: '',
        currentStep: 2,
      };

    case 'GENERATE_STREAM_CHUNK':
      return { ...state, streamBuffer: state.streamBuffer + action.payload };

    case 'GENERATE_RESPONSE_COMPLETE': {
      const { questionId, text } = action.payload;
      const completedCount = Object.keys(state.responses).length + 1;
      const progress = Math.round((completedCount / state.questions.length) * 100);
      return {
        ...state,
        responses: {
          ...state.responses,
          [questionId]: { text: text.trim(), edited: false },
        },
        generateProgress: progress,
        streamBuffer: '',
        currentGeneratingId: action.payload.nextId || null,
      };
    }

    case 'GENERATE_ALL_COMPLETE':
      return {
        ...state,
        generateStatus: 'success',
        generateProgress: 100,
        streamBuffer: '',
        currentStep: 3,
      };

    case 'GENERATE_ERROR':
      return { ...state, generateStatus: 'error', generateError: action.payload };

    case 'UPDATE_RESPONSE':
      return {
        ...state,
        responses: {
          ...state.responses,
          [action.payload.questionId]: {
            text: action.payload.text,
            edited: true,
          },
        },
      };

    case 'REGENERATE_START':
      return {
        ...state,
        responses: {
          ...state.responses,
          [action.payload]: {
            ...state.responses[action.payload],
            regenerating: true,
          },
        },
      };

    case 'REGENERATE_COMPLETE':
      return {
        ...state,
        responses: {
          ...state.responses,
          [action.payload.questionId]: {
            text: action.payload.text.trim(),
            edited: false,
            regenerating: false,
          },
        },
      };

    case 'REGENERATE_ERROR':
      return {
        ...state,
        responses: {
          ...state.responses,
          [action.payload.questionId]: {
            ...state.responses[action.payload.questionId],
            regenerating: false,
          },
        },
      };

    case 'GO_TO_STEP':
      return { ...state, currentStep: action.payload };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

export function useRfpWorkflow() {
  const [state, dispatch] = useReducer(rfpReducer, initialState);
  const { fetchStream, abort } = useStreamingResponse();

  const uploadPdf = useCallback((fileData) => {
    dispatch({ type: 'SET_PDF', payload: fileData });
  }, []);

  const uploadText = useCallback((text) => {
    dispatch({ type: 'SET_TEXT', payload: text });
  }, []);

  const setKnowledgeBase = useCallback((text) => {
    dispatch({ type: 'SET_KNOWLEDGE_BASE', payload: text });
  }, []);

  const parseDocument = useCallback(async () => {
    dispatch({ type: 'PARSE_START' });

    try {
      const body = state.uploadType === 'pdf'
        ? { type: 'pdf', content: state.pdfBase64, filename: state.pdfFilename }
        : { type: 'text', content: state.rawText };

      const res = await fetch(API_ENDPOINTS.parse, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to parse document');
      }

      const data = await res.json();
      dispatch({ type: 'PARSE_SUCCESS', payload: data.questions });
    } catch (err) {
      dispatch({ type: 'PARSE_ERROR', payload: err.message });
    }
  }, [state.uploadType, state.pdfBase64, state.pdfFilename, state.rawText]);

  const generateResponses = useCallback(async () => {
    dispatch({ type: 'GENERATE_START' });

    const body = {
      questions: state.questions,
      knowledgeBase: state.knowledgeBase,
      rfpContext: state.uploadType === 'text' ? state.rawText : '',
    };

    let fullBuffer = '';
    const completedResponses = {};

    await fetchStream(API_ENDPOINTS.generate, body, {
      onChunk: (text) => {
        fullBuffer += text;
        dispatch({ type: 'GENERATE_STREAM_CHUNK', payload: text });

        // Check for response boundaries
        const boundaryRegex = /---RESPONSE_BOUNDARY:(q\d+)---/g;
        let match;
        let lastIndex = 0;

        while ((match = boundaryRegex.exec(fullBuffer)) !== null) {
          const questionId = match[1];
          if (!completedResponses[questionId]) {
            // Find the text between the last boundary and this one
            const responseText = fullBuffer.substring(lastIndex, match.index);
            completedResponses[questionId] = true;

            // Find the next question ID
            const qIndex = state.questions.findIndex(q => q.id === questionId);
            const nextId = qIndex < state.questions.length - 1
              ? state.questions[qIndex + 1].id
              : null;

            dispatch({
              type: 'GENERATE_RESPONSE_COMPLETE',
              payload: { questionId, text: responseText, nextId },
            });
          }
          lastIndex = match.index + match[0].length;
        }

        // Trim the buffer to keep only unprocessed text
        if (lastIndex > 0) {
          fullBuffer = fullBuffer.substring(lastIndex);
        }
      },
      onComplete: () => {
        // Handle any remaining text as the last response
        const answeredIds = new Set(Object.keys(completedResponses));
        const unanswered = state.questions.filter(q => !answeredIds.has(q.id));

        if (unanswered.length === 1 && fullBuffer.trim()) {
          dispatch({
            type: 'GENERATE_RESPONSE_COMPLETE',
            payload: { questionId: unanswered[0].id, text: fullBuffer },
          });
        }

        dispatch({ type: 'GENERATE_ALL_COMPLETE' });
      },
      onError: (err) => {
        dispatch({ type: 'GENERATE_ERROR', payload: err.message });
      },
    });
  }, [state.questions, state.knowledgeBase, state.uploadType, state.rawText, fetchStream]);

  const regenerateResponse = useCallback(async (questionId, instructions = '') => {
    dispatch({ type: 'REGENERATE_START', payload: questionId });

    const question = state.questions.find(q => q.id === questionId);
    const body = {
      question,
      knowledgeBase: state.knowledgeBase,
      rfpContext: state.uploadType === 'text' ? state.rawText : '',
      instructions,
    };

    let responseText = '';

    await fetchStream(API_ENDPOINTS.regenerate, body, {
      onChunk: (text) => {
        responseText += text;
      },
      onComplete: () => {
        dispatch({
          type: 'REGENERATE_COMPLETE',
          payload: { questionId, text: responseText },
        });
      },
      onError: (err) => {
        dispatch({
          type: 'REGENERATE_ERROR',
          payload: { questionId, error: err.message },
        });
      },
    });
  }, [state.questions, state.knowledgeBase, state.uploadType, state.rawText, fetchStream]);

  const updateResponse = useCallback((questionId, text) => {
    dispatch({ type: 'UPDATE_RESPONSE', payload: { questionId, text } });
  }, []);

  const goToStep = useCallback((step) => {
    dispatch({ type: 'GO_TO_STEP', payload: step });
  }, []);

  const reset = useCallback(() => {
    abort();
    dispatch({ type: 'RESET' });
  }, [abort]);

  const toggleKbPanel = useCallback(() => {
    dispatch({ type: 'TOGGLE_KB_PANEL' });
  }, []);

  const closeKbPanel = useCallback(() => {
    dispatch({ type: 'CLOSE_KB_PANEL' });
  }, []);

  // Computed stats
  const stats = {
    questionCount: state.questions.length,
    answeredCount: Object.keys(state.responses).length,
    totalWordCount: Object.values(state.responses).reduce(
      (sum, r) => sum + countWords(r.text), 0
    ),
  };

  return {
    state,
    dispatch,
    stats,
    actions: {
      uploadPdf,
      uploadText,
      setKnowledgeBase,
      parseDocument,
      generateResponses,
      regenerateResponse,
      updateResponse,
      goToStep,
      reset,
      toggleKbPanel,
      closeKbPanel,
    },
  };
}
