/**
 * Public API surface for HTTP: prefer `request()` for new code; default export stays the Axios instance
 * for existing Minimals call sites (`import axios from 'src/utils/axios'`).
 */
export { apiClient as default, apiClient } from 'src/lib/api/http-client';
export { request } from 'src/lib/api/request';
export { API_ENDPOINTS } from 'src/lib/api/endpoints';
