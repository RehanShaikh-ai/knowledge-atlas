export interface ApiErrorDetail {
  code: string;
  message: string;
}

export interface ApiError {
  error: ApiErrorDetail;
}
