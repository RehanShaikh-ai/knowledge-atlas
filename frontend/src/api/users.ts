import { apiClient } from './client';
import { User, UserCreate, UserListResponse } from '@/types/users';

/**
 * Canonical user API module (§16.1).
 * Relative to VITE_API_BASE_URL ({VITE_API_BASE_URL}/users) without repeating /api/v1.
 */

export async function createUser(data: UserCreate): Promise<User> {
  return apiClient.post<User>('/users', data);
}

export async function getUser(userId: string): Promise<User> {
  return apiClient.get<User>(`/users/${encodeURIComponent(userId)}`);
}

export async function getUsers(): Promise<UserListResponse> {
  return apiClient.get<UserListResponse>('/users');
}
