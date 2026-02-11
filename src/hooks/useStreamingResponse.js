import { useCallback, useRef } from 'react';

export function useStreamingResponse() {
  const abortRef = useRef(null);

  const fetchStream = useCallback(async (url, body, { onChunk, onComplete, onError }) => {
    try {
      abortRef.current = new AbortController();

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              onChunk(parsed.text);
            } catch {
              // skip malformed chunks
            }
          }
        }
      }
      onComplete();
    } catch (err) {
      if (err.name === 'AbortError') return;
      onError(err);
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { fetchStream, abort };
}
