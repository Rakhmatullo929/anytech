import { useCallback, useMemo } from 'react';

import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import AutocompleteInfiniteSingle from 'src/components/autocomplete-infinite/single';
import { useLocales } from 'src/locales';
import { fCurrency } from 'src/utils/format-number';

import { fetchClientsList } from 'src/sections/app/clients/api/clients-requests';
import type { ClientListItem } from 'src/sections/app/clients/api/types';

import type { SalePaymentType } from '../api/types';

type Props = {
  client: ClientListItem | null;
  onClientChange: (client: ClientListItem | null) => void;
  paymentType: SalePaymentType;
  onPaymentTypeChange: (type: SalePaymentType) => void;
  subtotal: number;
  canComplete: boolean;
  isCreating: boolean;
  onComplete: () => void;
};

export default function PosCartSummary({
  client,
  onClientChange,
  paymentType,
  onPaymentTypeChange,
  subtotal,
  canComplete,
  isCreating,
  onComplete,
}: Props) {
  const { tx } = useLocales();

  const clientQueryKeyBase = useMemo(() => ['pos', 'clients-search'], []);

  const clientFetcher = useCallback(
    ({ page, search }: { page: number; search: string; signal: AbortSignal }) =>
      fetchClientsList({ page, pageSize: 20, search: search || undefined }),
    []
  );

  const getClientLabel = useCallback(
    (c: ClientListItem) => [c.name, c.lastName].filter(Boolean).join(' '),
    []
  );

  const renderClientOption = useCallback(
    (c: ClientListItem) => (
      <Stack>
        <Typography variant="body2">
          {[c.name, c.lastName].filter(Boolean).join(' ')}
        </Typography>
        {c.phone && (
          <Typography variant="caption" color="text.secondary">
            {c.phone}
          </Typography>
        )}
      </Stack>
    ),
    []
  );

  return (
    <Stack spacing={2}>
      <AutocompleteInfiniteSingle<ClientListItem>
        queryKeyBase={clientQueryKeyBase}
        fetcher={clientFetcher}
        value={client}
        onChange={onClientChange}
        getOptionLabel={getClientLabel}
        renderOptionContent={renderClientOption}
        label={tx('pos.client')}
        placeholder={tx('pos.selectClient')}
        noOptionsText={tx('common.table.noData')}
        required
      />

      <TextField
        select
        fullWidth
        size="small"
        label={tx('common.payment.method')}
        value={paymentType}
        onChange={(e) => onPaymentTypeChange(e.target.value as SalePaymentType)}
      >
        <MenuItem value="cash">{tx('common.payment.cash')}</MenuItem>
        <MenuItem value="card">{tx('common.payment.card')}</MenuItem>
        <MenuItem value="debt">{tx('common.payment.debt')}</MenuItem>
      </TextField>

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="text.secondary">
          {tx('common.labels.total')}
        </Typography>
        <Typography variant="h6">{fCurrency(subtotal)}</Typography>
      </Stack>

      <Button
        fullWidth
        size="large"
        variant="contained"
        disabled={!canComplete || isCreating}
        onClick={onComplete}
      >
        {isCreating ? <CircularProgress size={22} color="inherit" /> : tx('pos.completeSale')}
      </Button>
    </Stack>
  );
}
