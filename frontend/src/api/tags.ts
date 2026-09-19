import { apiClient } from './client';
import { Tag } from '@/types/tag';

export const addTag = async (noteId: string, name: string): Promise<Tag> => {
  return apiClient.post<Tag>(`/notes/${noteId}/tags`, { name });
};

export const removeTag = async (noteId: string, tagId: string): Promise<void> => {
  return apiClient.delete(`/notes/${noteId}/tags/${tagId}`);
};

export const listWorkspaceTags = async (
  workspaceId: string
): Promise<{ items: Tag[]; total: number }> => {
  return apiClient.get<{ items: Tag[]; total: number }>(`/workspaces/${workspaceId}/tags`);
};
