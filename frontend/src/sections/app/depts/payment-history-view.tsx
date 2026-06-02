import { useCallback, useMemo, useState } from 'react';

import type { AutocompleteInfiniteFetcher } from 'src/components/autocomplete-infinite';
import AutocompleteInfinite from 'src/components/autocomplete-infinite';
import { useLocales } from 'src/locales';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';

import { fCurrency } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';
import { useSyncTableWithUrlListState } from 'src/hooks/use-url-query-state';
import { FilterDrawer, FilterFieldDateRange } from 'src/components/filter-drawer';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { PaymentHistorySkeleton } from 'src/sections/app/depts/skeleton';
import { fetchClientsList } from 'src/sections/app/clients/api/clients-requests';
import type { ClientListItem } from 'src/sections/app/clients/api/types';
import { fetchTenantUsers } from 'src/sections/app/admin/users/api/users-requests';
import type { TenantUserListItem } from 'src/sections/app/admin/users/api/types';

import {
  useDebtPaymentsListQuery,
  useExportDebtPaymentsMutation,
  useDebtPaymentsUrlState,
  type DebtPaymentMethod,
} from './api';

// ----------------------------------------------------------------------

type HeadCell = { id: string; label: string; sortKey?: string; sx?: object };

const CLIENTS_QUERY_KEY_BASE = ['dp-clients', 'infinite'] as const;
const clientsInfiniteFetcher: AutocompleteInfiniteFetcher<ClientListItem> = ({ page, search }) =>
  fetchClientsList({ page, pageSize: 20, search: search || undefined });

const CASHIERS_QUERY_KEY_BASE = ['dp-cashiers', 'infinite'] as const;
const cashiersInfiniteFetcher: AutocompleteInfiniteFetcher<TenantUserListItem> = ({
  page,
  search,
}) => fetchTenantUsers({ page, pageSize: 20, search: search || undefined });

const cashierLabel = (u: TenantUserListItem) =>
  [u.firstName, u.lastName].filter(Boolean).join(' ') || u.phone || u.email || '';

// ----------------------------------------------------------------------

export default function PaymentHistoryView() {
  const { tx } = useLocales();
  const exportMutation = useExportDebtPaymentsMutation();

  const {
    page: pageParam,
    rowsPerPage,
    ordering,
    customerId,
    paymentMethod,
    cashierIdsStr,
    dateFrom,
    dateTo,
    activeFiltersCount,
    setOrdering,
    setFilters,
    resetFilters,
    handlePageChange,
    handleRowsPerPageChange,
  } = useDebtPaymentsUrlState();

  const [selectedClients, setSelectedClients] = useState<ClientListItem[]>([]);
  const [selectedCashiers, setSelectedCashiers] = useState<TenantUserListItem[]>([]);

  // ── Table head (needed before the skeleton guard) ──────────────────────
  const tableHead: HeadCell[] = useMemo(
    () => [
      { id: 'customer', label: tx('debts.payments.columnCustomer') },
      { id: 'amount', label: tx('debts.payments.columnAmount'), sortKey: 'amount' },
      { id: 'paymentMethod', label: tx('debts.payments.columnPaymentMethod') },
      { id: 'cashier', label: tx('debts.payments.columnCashier'), sx: { display: { xs: 'none', sm: 'table-cell' } } },
      { id: 'date', label: tx('debts.payments.columnDate'), sortKey: 'created_at', sx: { display: { xs: 'none', sm: 'table-cell' } } },
    ],
    [tx]
  );

  const { tableOrderBy, tableOrder } = useMemo(() => {
    const isDesc = ordering.startsWith('-');
    const field = isDesc ? ordering.slice(1) : ordering;
    const col = tableHead.find((h) => h.sortKey === field);
    return {
      tableOrderBy: col?.id ?? '',
      tableOrder: isDesc ? ('desc' as const) : ('asc' as const),
    };
  }, [ordering, tableHead]);

  const handleSort = useCallback(
    (columnId: string) => {
      const col = tableHead.find((h) => h.id === columnId);
      if (!col?.sortKey) return;
      const isCurrentAsc = tableOrderBy === columnId && tableOrder === 'asc';
      setOrdering(isCurrentAsc ? `-${col.sortKey}` : col.sortKey);
    },
    [tableHead, tableOrderBy, tableOrder, setOrdering]
  );

  // ── Table / data ───────────────────────────────────────────────────────
  const table = useTable({
    defaultCurrentPage: Math.max(0, pageParam - 1),
    defaultRowsPerPage: rowsPerPage,
  });
  const { setPage, setRowsPerPage } = table;
  const page = Math.max(0, pageParam - 1);

  const { data, isPending, isFetching } = useDebtPaymentsListQuery({
    page: page + 1,
    pageSize: rowsPerPage,
    ordering,
    customerId: customerId || undefined,
    paymentMethod: paymentMethod || undefined,
    cashierIds: cashierIdsStr || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const rows = useMemo(() => data?.results ?? [], [data?.results]);
  const total = data?.count ?? 0;
  const showInitialLoader = isPending && !data;

  useSyncTableWithUrlListState({
    page: pageParam,
    rowsPerPage,
    tablePage: table.page,
    tableRowsPerPage: table.rowsPerPage,
    setTablePage: setPage,
    setTableRowsPerPage: setRowsPerPage,
  });

  const paymentMethodOptions = useMemo(
    () => [
      { value: '', label: tx('common.status.filterAll') },
      { value: 'cash', label: tx('debts.payments.methodCash') },
      { value: 'card', label: tx('debts.payments.methodCard') },
      { value: 'transfer', label: tx('debts.payments.methodTransfer') },
    ],
    [tx]
  );

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync({
        ordering,
        customerId: customerId || undefined,
        paymentMethod: paymentMethod || undefined,
        cashierIds: cashierIdsStr || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleReset = () => {
    resetFilters();
    setSelectedClients([]);
    setSelectedCashiers([]);
  };

  const paymentMethodLabel = (method: DebtPaymentMethod | '') => {
    const found = paymentMethodOptions.find((o) => o.value === method);
    return found ? found.label : method;
  };

  if (showInitialLoader) {
    return <PaymentHistorySkeleton headLabel={tableHead} />;
  }

  return (
    <Card>
      {isFetching && data ? (
        <LinearProgress sx={{ borderRadius: 1 }} color="inherit" />
      ) : (
        <Box sx={{ height: 4 }} />
      )}

      <Stack spacing={2} sx={{ p: 2 }}>
        {/* Toolbar */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ flexGrow: 1 }} />

          <FilterDrawer
            filtersCount={activeFiltersCount}
            title={tx('common.actions.filters')}
            resetLabel={tx('common.actions.reset')}
            onReset={handleReset}
          >
            <AutocompleteInfinite<ClientListItem>
              queryKeyBase={CLIENTS_QUERY_KEY_BASE}
              fetcher={clientsInfiniteFetcher}
              size="small"
              value={selectedClients}
              onChange={(clients) => {
                setSelectedClients(clients);
                setFilters({ customerId: clients.map((c) => c.id).join(',') });
              }}
              getOptionLabel={(c) => c.name}
              label={tx('debts.payments.filterCustomer')}
            />

            <TextField
              select
              fullWidth
              size="small"
              label={tx('debts.payments.filterPaymentMethod')}
              value={paymentMethod}
              onChange={(e) =>
                setFilters({ paymentMethod: e.target.value as '' | DebtPaymentMethod })
              }
            >
              {paymentMethodOptions.map((opt) => (
                <MenuItem key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>

            <AutocompleteInfinite<TenantUserListItem>
              queryKeyBase={CASHIERS_QUERY_KEY_BASE}
              fetcher={cashiersInfiniteFetcher}
              size="small"
              value={selectedCashiers}
              onChange={(cashiers) => {
                setSelectedCashiers(cashiers);
                setFilters({ cashierIds: cashiers.map((u) => u.id).join(',') });
              }}
              getOptionLabel={cashierLabel}
              label={tx('debts.payments.filterCashier')}
            />

            <FilterFieldDateRange
              label={tx('debts.payments.filterDateRange')}
              fromLabel={tx('debts.filters.dateFrom')}
              toLabel={tx('debts.filters.dateTo')}
              fromValue={dateFrom}
              toValue={dateTo}
              onFromChange={(v) => setFilters({ dateFrom: v })}
              onToChange={(v) => setFilters({ dateTo: v })}
            />
          </FilterDrawer>

          <Button
            variant="outlined"
            startIcon={
              exportMutation.isPending ? (
                <Iconify icon="svg-spinners:ring-resize" />
              ) : (
                <Iconify icon="eva:download-fill" />
              )
            }
            onClick={handleExport}
            disabled={exportMutation.isPending}
            aria-label={tx('common.actions.export')}
            sx={{
              px: { xs: 1, sm: 2 },
              '& .MuiButton-startIcon': {
                mr: { xs: 0, sm: 1 },
                ml: { xs: 0, sm: -0.5 },
              },
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              {tx('common.actions.export')}
            </Box>
          </Button>
        </Stack>

        <Scrollbar>
          <Table size="small">
            <TableHeadCustom
              headLabel={tableHead}
              order={tableOrder}
              orderBy={tableOrderBy}
              onSort={handleSort}
            />
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.customerName ?? '—'}</TableCell>
                  <TableCell>{fCurrency(row.amount)}</TableCell>
                  <TableCell>{paymentMethodLabel(row.paymentMethod)}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{row.cashierName ?? '—'}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{fDateTime(row.createdAt)}</TableCell>
                </TableRow>
              ))}
              <TableNoData notFound={!rows.length} title={tx('common.table.noData')} />
            </TableBody>
          </Table>
        </Scrollbar>

        <TablePaginationCustom
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 15, 25]}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Stack>
    </Card>
  );
}
