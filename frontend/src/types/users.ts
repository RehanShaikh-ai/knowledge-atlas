export interface User {
  id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  display_name: string;
}

export interface UserListResponse {
  items: User[];
  total: number;
}
