import { useQueryClient } from '@tanstack/react-query';

import { useFetch, useMutate } from 'src/hooks/api';

import {
  closeCashRegister,
  fetchCashRegisterStatus,
  openCashRegister,
} from './cash-register-requests';
import type { CashRegister } from './types';

export const CASH_REGISTER_QUERY_KEY = ['cash_register', 'status'] as const;

export function useCashRegisterQuery() {
  return useFetch<CashRegister>(CASH_REGISTER_QUERY_KEY, fetchCashRegisterStatus, {
    refetchInterval: 30_000,
  });
}

export function useOpenCashRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutate<CashRegister, void>(() => openCashRegister(), {
    onSuccess: (data) => {
      queryClient.setQueryData<CashRegister>(CASH_REGISTER_QUERY_KEY, data);
    },
  });
}

export function useCloseCashRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutate<CashRegister, void>(() => closeCashRegister(), {
    onSuccess: (data) => {
      queryClient.setQueryData<CashRegister>(CASH_REGISTER_QUERY_KEY, data);
    },
  });
}
