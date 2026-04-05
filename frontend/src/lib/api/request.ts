import type { AxiosRequestConfig } from 'axios';

import { apiClient } from './http-client';

// ----------------------------------------------------------------------

type RequestConfig = AxiosRequestConfig & { skipAuth?: boolean };

function resolveDefaultLang(): string {
  if (typeof localStorage !== 'undefined') {
    const fromStorage = localStorage.getItem('language');
    if (fromStorage) {
      return fromStorage;
    }
  }
  return process.env.REACT_APP_DEFAULT_API_LANG || 'uz';
}

/**
 * Typed helper around `apiClient`: merges `lang` into query params and returns `response.data` only.
 * Use `isPublic: true` for unauthenticated calls (same as `skipAuth: true` on the config).
 */
export async function request<T = unknown>(options: RequestConfig, isPublic = false): Promise<T> {
  const lang = resolveDefaultLang();

  let params: AxiosRequestConfig['params'];

  if (options.params instanceof URLSearchParams) {
    const next = new URLSearchParams(options.params.toString());
    next.set('lang', lang);
    params = next;
  } else {
    params = {
      ...((options.params as Record<string, unknown>) ?? {}),
      lang,
    };
  }

  const { data } = await apiClient.request<T>({
    ...options,
    params,
    skipAuth: isPublic || options.skipAuth,
  });

  return data;
}
