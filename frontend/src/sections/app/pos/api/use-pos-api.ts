import { useQueryClient } from '@tanstack/react-query';

import { useMutate } from 'src/hooks/api';

import { createSale } from './pos-requests';
import type { CreateSalePayload, SaleListItem } from './types';

export function useCreateSaleMutation() {
  const queryClient = useQueryClient();
  return useMutate<SaleListItem, CreateSalePayload>(createSale, {
    onSuccess: () => {
      // Refresh product stock across the entire app
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });
}
