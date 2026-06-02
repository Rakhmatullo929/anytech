import { useCallback, useMemo } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import AutocompleteInfiniteSingle from 'src/components/autocomplete-infinite/single';
import Iconify from 'src/components/iconify';
import { useLocales } from 'src/locales';
import { fCurrency } from 'src/utils/format-number';

import { fetchClientsList } from 'src/sections/app/clients/api/clients-requests';
import type { ClientListItem } from 'src/sections/app/clients/api/types';
import { fetchTenantUsers } from 'src/sections/app/admin/users/api/users-requests';
import type { TenantUserListItem } from 'src/sections/app/admin/users/api/types';

import type { SalePaymentType } from '../api/types';

type Props = {
  client: ClientListItem | null;
  onClientChange: (client: ClientListItem | null) => void;
  onAddClient: () => void;
  createdBy: TenantUserListItem | null;
  onCreatedByChange: (user: TenantUserListItem | null) => void;
  paymentType: SalePaymentType;
  onPaymentTypeChange: (type: SalePaymentType) => void;
  debtDeadlineDays: number | '';
  onDebtDeadlineDaysChange: (days: number | '') => void;
  subtotal: number;
  canComplete: boolean;
  isCreating: boolean;
  onComplete: () => void;
};

export default function PosCartSummary({
  client,
  onClientChange,
  onAddClient,
  createdBy,
  onCreatedByChange,
  paymentType,
  onPaymentTypeChange,
  debtDeadlineDays,
  onDebtDeadlineDaysChange,
  subtotal,
  canComplete,
  isCreating,
  onComplete,
}: Props) {
  const { tx } = useLocales();

  const clientQueryKeyBase = useMemo(() => ['pos', 'clients-search'], []);
  const userQueryKeyBase = useMemo(() => ['pos', 'users-search'], []);

  const clientFetcher = useCallback(
    ({ page, search }: { page: number; search: string; signal: AbortSignal }) =>
      fetchClientsList({ page, pageSize: 20, search: search || undefined }),
    []
  );

  const userFetcher = useCallback(
    ({ page, search }: { page: number; search: string; signal: AbortSignal }) =>
      fetchTenantUsers({ page, pageSize: 20, search: search || undefined }),
    []
  );

  const getClientLabel = useCallback(
    (c: ClientListItem) => [c.name, c.lastName].filter(Boolean).join(' '),
    []
  );

  const getUserLabel = useCallback(
    (u: TenantUserListItem) => [u.firstName, u.lastName].filter(Boolean).join(' '),
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

  const renderUserOption = useCallback(
    (u: TenantUserListItem) => (
      <Stack>
        <Typography variant="body2">
          {[u.firstName, u.lastName].filter(Boolean).join(' ')}
        </Typography>
        {u.phone && (
          <Typography variant="caption" color="text.secondary">
            {u.phone}
          </Typography>
        )}
      </Stack>
    ),
    []
  );

  return (
    <Stack spacing={2}>
      <Box>
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
        {!client && (
          <Button
            size="small"
            startIcon={<Iconify icon="mingcute:add-line" width={14} />}
            onClick={onAddClient}
            sx={{ mt: 0.5, pl: 0.5, fontSize: 12 }}
          >
            {tx('pos.addNewClient')}
          </Button>
        )}
      </Box>

      <AutocompleteInfiniteSingle<TenantUserListItem>
        queryKeyBase={userQueryKeyBase}
        fetcher={userFetcher}
        value={createdBy}
        onChange={onCreatedByChange}
        getOptionLabel={getUserLabel}
        renderOptionContent={renderUserOption}
        label={tx('pos.createdBy')}
        placeholder={tx('pos.selectCreatedBy')}
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
        <MenuItem value="transfer">{tx('common.payment.transfer')}</MenuItem>
        <MenuItem value="debt">{tx('common.payment.debt')}</MenuItem>
      </TextField>

      {paymentType === 'debt' && (
        <TextField
          fullWidth
          required
          size="small"
          label={tx('pos.debtDeadlineDays')}
          type="number"
          value={debtDeadlineDays}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '') {
              onDebtDeadlineDaysChange('');
            } else {
              const n = parseInt(raw, 10);
              if (!Number.isNaN(n) && n > 0) onDebtDeadlineDaysChange(n);
            }
          }}
          inputProps={{ min: 1 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Typography variant="caption" color="text.secondary">
                  {tx('pos.debtDeadlineDaysUnit')}
                </Typography>
              </InputAdornment>
            ),
          }}
        />
      )}

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
