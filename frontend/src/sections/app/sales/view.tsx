import { useCallback, useMemo, useState } from 'react';
import type { AutocompleteInfiniteFetcher } from 'src/components/autocomplete-infinite';
import AutocompleteInfinite from 'src/components/autocomplete-infinite';
// locales
import { useLocales } from 'src/locales';
// @mui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Link from '@mui/material/Link';
import LinearProgress from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField';
// utils
import { fCurrency } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';
import { useSyncTableWithUrlListState } from 'src/hooks/use-url-query-state';
import { useCheckPermission } from 'src/auth/hooks/use-check-permission';
// routes
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
// components
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { FilterDrawer, FilterFieldDateRange, FilterFieldRange } from 'src/components/filter-drawer';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';
import { fetchClientsList } from 'src/sections/app/clients/api/clients-requests';
import type { ClientListItem } from 'src/sections/app/clients/api/types';
import { fetchTenantUsers } from 'src/sections/app/admin/users/api/users-requests';
import type { TenantUserListItem } from 'src/sections/app/admin/users/api/types';
import {
  useSalesListQuery,
  useExportSalesMutation,
  useSalesUrlState,
  type SalePaymentType,
} from 'src/sections/app/sales/api';
import { SalesListSkeleton } from 'src/sections/app/sales/skeleton';

// ----------------------------------------------------------------------

type HeadCell = { id: string; label: string; sortKey?: string; sx?: object };

const CLIENTS_QUERY_KEY_BASE = ['sales-clients', 'infinite'] as const;
const clientsInfiniteFetcher: AutocompleteInfiniteFetcher<ClientListItem> = ({ page, search }) =>
  fetchClientsList({ page, pageSize: 20, search: search || undefined });

const SELLERS_QUERY_KEY_BASE = ['sales-sellers', 'infinite'] as const;
const sellersInfiniteFetcher: AutocompleteInfiniteFetcher<TenantUserListItem> = ({
  page,
  search,
}) => fetchTenantUsers({ page, pageSize: 20, search: search || undefined });

export default function SalesView() {
  const { tx } = useLocales();
  const { canDetailPage } = useCheckPermission();
  const exportMutation = useExportSalesMutation();

  const {
    page: pageParam,
    rowsPerPage,
    ordering,
    paymentType,
    dateFrom,
    dateTo,
    clientIds,
    sellerIds,
    amountFrom,
    amountTo,
    activeFiltersCount,
    setOrdering,
    setFilters,
    resetFilters,
    handlePageChange,
    handleRowsPerPageChange,
  } = useSalesUrlState();

  // ── Local state for autocomplete objects ──────────────────────────────────
  const [selectedClients, setSelectedClients] = useState<ClientListItem[]>([]);
  const [selectedSellers, setSelectedSellers] = useState<TenantUserListItem[]>([]);

  // ── Sorting ──────────────────────────────────────────────────────────────
  const tableHead: HeadCell[] = useMemo(
    () => [
      { id: 'id', label: tx('common.table.saleId'), sx: { display: { xs: 'none', sm: 'table-cell' } } },
      { id: 'client', label: tx('common.table.client'), sortKey: 'client__name' },
      { id: 'created_by', label: tx('common.table.createdBy'), sortKey: 'created_by__first_name', sx: { display: { xs: 'none', sm: 'table-cell' } } },
      { id: 'total', label: tx('common.table.total'), sortKey: 'total_amount' },
      { id: 'pay', label: tx('common.table.pay') },
      { id: 'date', label: tx('common.table.date'), sortKey: 'created_at', sx: { display: { xs: 'none', sm: 'table-cell' } } },
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

  // ── Table / data ─────────────────────────────────────────────────────────
  const table = useTable({
    defaultCurrentPage: Math.max(0, pageParam - 1),
    defaultRowsPerPage: rowsPerPage,
  });
  const { setPage, setRowsPerPage } = table;
  const page = Math.max(0, pageParam - 1);

  const clientIdsStr = clientIds.join(',');
  const sellerIdsStr = sellerIds.join(',');

  const { data, isPending, isFetching } = useSalesListQuery({
    page: page + 1,
    pageSize: rowsPerPage,
    ordering,
    paymentType: paymentType || undefined,
    clientIds: clientIdsStr || undefined,
    sellerIds: sellerIdsStr || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    amountFrom: amountFrom || undefined,
    amountTo: amountTo || undefined,
  });
  const rows = useMemo(() => data?.results ?? [], [data?.results]);
  const total = data?.count ?? 0;
  const showInitialLoader = isPending && !data;
  const canDetailSales = canDetailPage('sales');

  useSyncTableWithUrlListState({
    page: pageParam,
    rowsPerPage,
    tablePage: table.page,
    tableRowsPerPage: table.rowsPerPage,
    setTablePage: setPage,
    setTableRowsPerPage: setRowsPerPage,
  });

  // ── Payment options ───────────────────────────────────────────────────────
  const payLabel = useMemo(
    () => ({
      cash: tx('common.payment.cash'),
      card: tx('common.payment.card'),
      transfer: tx('common.payment.transfer'),
      debt: tx('common.payment.debt'),
    }),
    [tx]
  );

  const paymentOptions = useMemo(
    () => [
      { value: '', label: tx('sales.filters.allOption') },
      { value: 'cash', label: tx('common.payment.cash') },
      { value: 'card', label: tx('common.payment.card') },
      { value: 'transfer', label: tx('common.payment.transfer') },
      { value: 'debt', label: tx('common.payment.debt') },
    ],
    [tx]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync({
        ordering,
        paymentType: paymentType || undefined,
        clientIds: clientIdsStr || undefined,
        sellerIds: sellerIdsStr || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        amountFrom: amountFrom || undefined,
        amountTo: amountTo || undefined,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleReset = () => {
    resetFilters();
    setSelectedClients([]);
    setSelectedSellers([]);
  };

  const sellerLabel = (u: TenantUserListItem) =>
    [u.firstName, u.lastName].filter(Boolean).join(' ');

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('sales.listHeading')}
        links={[{ name: tx('common.navigation.sales'), href: paths.sales.root }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {showInitialLoader ? (
        <SalesListSkeleton headLabel={tableHead} />
      ) : (
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
                <TextField
                  select
                  fullWidth
                  size="small"
                  label={tx('sales.filters.paymentLabel')}
                  value={paymentType}
                  onChange={(e) =>
                    setFilters({ paymentType: e.target.value as '' | SalePaymentType })
                  }
                >
                  {paymentOptions.map((opt) => (
                    <MenuItem key={opt.value || 'all'} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>

                <AutocompleteInfinite<ClientListItem>
                  queryKeyBase={CLIENTS_QUERY_KEY_BASE}
                  fetcher={clientsInfiniteFetcher}
                  size="small"
                  value={selectedClients}
                  onChange={(clients) => {
                    setSelectedClients(clients);
                    setFilters({ clientIds: clients.map((c) => c.id).join(',') });
                  }}
                  getOptionLabel={(c) => c.name}
                  label={tx('sales.filters.client')}
                />

                <AutocompleteInfinite<TenantUserListItem>
                  queryKeyBase={SELLERS_QUERY_KEY_BASE}
                  fetcher={sellersInfiniteFetcher}
                  size="small"
                  value={selectedSellers}
                  onChange={(sellers) => {
                    setSelectedSellers(sellers);
                    setFilters({ sellerIds: sellers.map((s) => s.id).join(',') });
                  }}
                  getOptionLabel={sellerLabel}
                  label={tx('sales.filters.seller')}
                />

                <FilterFieldDateRange
                  label={tx('sales.filters.dateRange')}
                  fromLabel={tx('sales.filters.dateFrom')}
                  toLabel={tx('sales.filters.dateTo')}
                  fromValue={dateFrom}
                  toValue={dateTo}
                  onFromChange={(v) => setFilters({ dateFrom: v })}
                  onToChange={(v) => setFilters({ dateTo: v })}
                />

                <FilterFieldRange
                  label={tx('sales.filters.amountRange')}
                  minLabel={tx('sales.filters.amountMin')}
                  maxLabel={tx('sales.filters.amountMax')}
                  minValue={amountFrom}
                  maxValue={amountTo}
                  onMinChange={(v) => setFilters({ amountFrom: v })}
                  onMaxChange={(v) => setFilters({ amountTo: v })}
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
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        {canDetailSales ? (
                          <Link
                            component={RouterLink}
                            href={paths.sales.details(row.id)}
                            variant="subtitle2"
                          >
                            {row.id}
                          </Link>
                        ) : (
                          row.id
                        )}
                      </TableCell>
                      <TableCell>{row.clientName || '-'}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{row.createdByName || '-'}</TableCell>
                      <TableCell>{fCurrency(row.totalAmount)}</TableCell>
                      <TableCell>{payLabel[row.paymentType]}</TableCell>
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
      )}
    </>
  );
}
