import { apiClient } from './client';
import { NoteLink, NoteLinksResponse } from '@/types/note_link';

export const createNoteLink = async (
  noteId: string,
  targetNoteId: string
): Promise<NoteLink> => {
  return apiClient.post<NoteLink>(`/notes/${noteId}/links`, { target_note_id: targetNoteId });
};

export const deleteNoteLink = async (
  noteId: string,
  targetNoteId: string
): Promise<void> => {
  return apiClient.delete(`/notes/${noteId}/links/${targetNoteId}`);
};

export const getNoteLinkss = async (noteId: string): Promise<NoteLinksResponse> => {
  return apiClient.get<NoteLinksResponse>(`/notes/${noteId}/links`);
};
