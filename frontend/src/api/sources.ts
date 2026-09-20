import { apiClient } from './client';
import { Source, SourceListResponse, SourcePreviewResult, SourceImportResult } from '@/types/source';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export async function listSources(workspaceId: string, page = 1, pageSize = 100): Promise<SourceListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('page_size', pageSize.toString());
  return apiClient.get(`/workspaces/${workspaceId}/sources?${params.toString()}`);
}

export async function getSource(sourceId: string): Promise<Source> {
  return apiClient.get(`/sources/${sourceId}`);
}

export async function previewImport(workspaceId: string, formData: FormData): Promise<SourcePreviewResult> {
  const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/sources/preview`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to preview import (status: ${response.status})`);
  }

  return response.json();
}

export async function commitImport(workspaceId: string, formData: FormData): Promise<SourceImportResult> {
  const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/sources/import`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to commit import (status: ${response.status})`);
  }

  return response.json();
}
