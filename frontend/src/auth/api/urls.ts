import { API_ENDPOINTS } from 'src/lib/api/endpoints';

/** Auth paths aligned with `backend/apps/auth_tenant/urls.py`. */
export const AUTH_URLS = {
  login: API_ENDPOINTS.auth.login,
  register: API_ENDPOINTS.auth.register,
  refresh: API_ENDPOINTS.auth.refresh,
  me: API_ENDPOINTS.auth.me,
} as const;
