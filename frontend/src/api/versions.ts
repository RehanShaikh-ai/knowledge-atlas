import { apiClient } from './client';
import { NoteVersionResponse, NoteVersionListResponse, DiffResponse } from '../types/versions';

export async function getNoteVersions(noteId: string): Promise<NoteVersionListResponse> {
  return apiClient.get<NoteVersionListResponse>(`/notes/${noteId}/versions`);
}

export async function getNoteVersion(noteId: string, versionId: string): Promise<NoteVersionResponse> {
  return apiClient.get<NoteVersionResponse>(`/notes/${noteId}/versions/${versionId}`);
}

export async function getNoteDiff(noteId: string, fromHash: string, toHash: string): Promise<DiffResponse> {
  return apiClient.get<DiffResponse>(`/notes/${noteId}/diff?from=${fromHash}&to=${toHash}`);
}

export async function restoreNoteVersion(noteId: string, versionId: string): Promise<void> {
  return apiClient.post(`/notes/${noteId}/restore`, { version_id: versionId });
}

export async function approveAIEdit(noteId: string): Promise<void> {
  return apiClient.post(`/notes/${noteId}/ai-edit/approve`);
}

export async function discardAIEdit(noteId: string): Promise<void> {
  return apiClient.delete(`/notes/${noteId}/ai-edit/pending`);
}
