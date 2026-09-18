import { apiClient } from './client';
import { Note, NoteCreate, NoteUpdate, NoteListResponse, NoteSearchResponse } from '@/types/note';

export const createNote = async (workspaceId: string, note: NoteCreate): Promise<Note> => {
  return apiClient.post<Note>(`/workspaces/${workspaceId}/notes`, note);
};

export const listNotes = async (
  workspaceId: string,
  params?: {
    page?: number;
    page_size?: number;
    tag?: string;
    is_pinned?: boolean;
    is_archived?: boolean;
    sort?: string;
  }
): Promise<NoteListResponse> => {
  const queryParams = new URLSearchParams();
  if (params) {
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.page_size !== undefined) queryParams.append('page_size', params.page_size.toString());
    if (params.tag !== undefined) queryParams.append('tag', params.tag);
    if (params.is_pinned !== undefined) queryParams.append('is_pinned', params.is_pinned.toString());
    if (params.is_archived !== undefined) queryParams.append('is_archived', params.is_archived.toString());
    if (params.sort !== undefined) queryParams.append('sort', params.sort);
  }
  const queryString = queryParams.toString();
  const url = `/workspaces/${workspaceId}/notes${queryString ? `?${queryString}` : ''}`;
  return apiClient.get<NoteListResponse>(url);
};

export const getNote = async (noteId: string): Promise<Note> => {
  return apiClient.get<Note>(`/notes/${noteId}`);
};

export const updateNote = async (noteId: string, updates: NoteUpdate): Promise<Note> => {
  return apiClient.patch<Note>(`/notes/${noteId}`, updates);
};

export const deleteNote = async (noteId: string): Promise<void> => {
  return apiClient.delete(`/notes/${noteId}`);
};

export const searchNotes = async (
  workspaceId: string,
  query: string,
  params?: {
    page?: number;
    page_size?: number;
  }
): Promise<NoteSearchResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.append('q', query);
  if (params) {
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.page_size !== undefined) queryParams.append('page_size', params.page_size.toString());
  }
  return apiClient.get<NoteSearchResponse>(`/workspaces/${workspaceId}/notes/search?${queryParams.toString()}`);
};
