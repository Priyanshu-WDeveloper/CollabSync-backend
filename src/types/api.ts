export interface IApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  unreadCount?: number;
  pagination?: IPagination;
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface IApiError {
  success: false;
  message: string;
}