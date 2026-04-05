import { request } from 'src/utils/axios';

import { AUTH_URLS } from './urls';
import type { LoginRequest, RegisterRequest, TenantUser, TokenPairResponse } from './types';

export async function fetchLogin(data: LoginRequest): Promise<TokenPairResponse> {
  return request<TokenPairResponse>(
    {
      method: 'POST',
      url: AUTH_URLS.login,
      data,
    },
    true
  );
}

export async function fetchRegister(data: RegisterRequest): Promise<TokenPairResponse> {
  return request<TokenPairResponse>(
    {
      method: 'POST',
      url: AUTH_URLS.register,
      data,
    },
    true
  );
}

export async function fetchCurrentUser(): Promise<{ user: TenantUser }> {
  return request<{ user: TenantUser }>({
    method: 'GET',
    url: AUTH_URLS.me,
  });
}
