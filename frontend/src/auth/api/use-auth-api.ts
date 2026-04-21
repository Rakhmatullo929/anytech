import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';
import { useMutate } from 'src/hooks/api';

import { fetchLogin, fetchRegister } from './auth-requests';
import { buildMockAuthUser, createMockAccessToken, isJwtAuthMock } from '../context/jwt/mock-auth';
import type { LoginRequest, RegisterRequest, TokenPairResponse } from './types';

// ----------------------------------------------------------------------

export function useLoginMutation() {
  const { syncSessionFromApiResponse } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutate<TokenPairResponse, LoginRequest>(
    async (data) => {
      if (isJwtAuthMock()) {
        const access = createMockAccessToken();
        const user = buildMockAuthUser(data.phone);
        return { access, refresh: '', user };
      }
      return fetchLogin(data);
    },
    {
      skipGlobalErrorNotification: true,
      onSuccess: (payload) => {
        syncSessionFromApiResponse(payload);
        queryClient.invalidateQueries();
      },
    }
  );
}

export function useRegisterMutation() {
  const { syncSessionFromApiResponse } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutate<TokenPairResponse, RegisterRequest>(
    async (data) => {
      if (isJwtAuthMock()) {
        const access = createMockAccessToken();
        const user = buildMockAuthUser(data.phone, data.firstName);
        return { access, refresh: '', user };
      }
      return fetchRegister(data);
    },
    {
      skipGlobalErrorNotification: true,
      onSuccess: (payload) => {
        syncSessionFromApiResponse(payload);
        queryClient.invalidateQueries();
      },
    }
  );
}

/**
 * Client-only logout: clears tokens, user cache, and React Query (no blacklist call).
 */
export function useLogoutMutation() {
  const { logout } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => undefined,
    onSuccess: () => {
      logout();
      queryClient.clear();
    },
  });
}
