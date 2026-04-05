import axios, {
  AxiosRequestTransformer,
  AxiosResponseTransformer,
  InternalAxiosRequestConfig,
} from 'axios';
// eslint-disable-next-line import/no-extraneous-dependencies -- humps is a runtime dep; types are dev-only @types/humps
import humps from 'humps';

import { HOST_API } from 'src/config-global';

// ----------------------------------------------------------------------

const root = String(HOST_API ?? '').replace(/\/$/, '');

function asRequestTransformers(
  value: AxiosRequestTransformer | AxiosRequestTransformer[] | undefined
): AxiosRequestTransformer[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function asResponseTransformers(
  value: AxiosResponseTransformer | AxiosResponseTransformer[] | undefined
): AxiosResponseTransformer[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function decamelizeRequestBody(data: unknown): unknown {
  if (data instanceof FormData) {
    return data;
  }
  if (data == null || typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }
  if (Array.isArray(data)) {
    return data;
  }
  if (typeof data === 'object') {
    return humps.decamelizeKeys(data as Record<string, unknown>);
  }
  return data;
}

function camelizeResponseData(data: unknown): unknown {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) {
    return data;
  }
  return humps.camelizeKeys(data as Record<string, unknown>);
}

/**
 * Axios instance for this app: `HOST_API` origin, snake_case ↔ camelCase for JSON bodies
 * and plain object query params, JWT from `sessionStorage` unless `skipAuth` is set.
 */
export const apiClient = axios.create({
  baseURL: root || undefined,
  headers: {
    'Content-Type': 'application/json',
  },
  transformRequest: [decamelizeRequestBody, ...asRequestTransformers(axios.defaults.transformRequest)],
  transformResponse: [
    ...asResponseTransformers(axios.defaults.transformResponse),
    camelizeResponseData,
  ],
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const next: InternalAxiosRequestConfig = { ...config };

  if (next.data instanceof FormData && next.headers) {
    delete (next.headers as Record<string, unknown>)['Content-Type'];
  }

  const { params } = next;
  if (
    params &&
    typeof params === 'object' &&
    !(params instanceof URLSearchParams) &&
    !Array.isArray(params)
  ) {
    next.params = humps.decamelizeKeys(params as Record<string, unknown>);
  }

  if (!next.skipAuth && typeof window !== 'undefined') {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      next.headers = next.headers ?? {};
      (next.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }

  return next;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);
