import { apiClient } from './client';
import { RAGRequest, RAGResponse, RAGStreamEvent } from '../types/rag';

/**
 * Runs the RAG pipeline for a workspace. Non-streaming by default.
 */
export async function runRAG(
  workspaceId: string,
  request: RAGRequest
): Promise<RAGResponse> {
  return apiClient.post<RAGResponse>(
    `/workspaces/${workspaceId}/rag`,
    { ...request, stream: false }
  );
}

/**
 * Runs the RAG pipeline with Server-Sent Events (SSE) streaming.
 * Yields parsed events (chunk, done, error).
 */
export async function* runRAGStream(
  workspaceId: string,
  request: RAGRequest
): AsyncGenerator<RAGStreamEvent, void, unknown> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
  const url = `${baseUrl.replace(/\/+$/, '')}/workspaces/${workspaceId}/rag`;
  
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, stream: true }),
    });
  } catch {
    throw new Error('Network error during RAG stream initialization');
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody && errorBody.error) {
        errorMessage = errorBody.error.message;
      }
    } catch {
      // Ignore json parse error for non-json bodies
    }
    throw new Error(errorMessage);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is null, cannot stream');
  }
  
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (!line.trim()) continue;
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (!dataStr || dataStr === '[DONE]') continue;
          
          try {
            const data = JSON.parse(dataStr) as RAGStreamEvent;
            yield data;
            
            if (data.type === 'error') {
              throw new Error(data.message);
            }
          } catch (e) {
            if (e instanceof Error && e.message === 'Network error during RAG stream initialization') {
                throw e; // rethrow specifically formatted error
            }
            // If it's a parsing error from the stream, just log it.
            console.warn('Failed to parse RAG stream chunk:', dataStr);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
