import { useCallback, useMemo } from 'react';

import { useLocales } from 'src/locales';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { fCurrency } from 'src/utils/format-number';
import { fDate } from 'src/utils/format-time';
import { useSyncTableWithUrlListState } from 'src/hooks/use-url-query-state';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useCheckPermission } from 'src/auth/hooks/use-check-permission';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { FilterDrawer, FilterFieldDateRange, FilterFieldRange } from 'src/components/filter-drawer';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';
import ReportStatCard from 'src/sections/app/reports/components/stat-card';
import { DebtsListSkeleton } from 'src/sections/app/depts/skeleton';

import {
  useCustomerDebtSummaryQuery,
  useCustomerDebtStatsQuery,
  useExportCustomerDebtSummaryMutation,
  useCustomerDebtsUrlState,
  type CustomerDebtStatus,
} from './api';

// ----------------------------------------------------------------------

type HeadCell = { id: string; label: string; sortKey?: string; sx?: object };

const STATUS_COLOR: Record<CustomerDebtStatus, 'error' | 'warning' | 'info' | 'success'> = {
  overdue: 'error',
  active: 'info',
  partially_paid: 'warning',
  paid: 'success',
};

function CustomerStatusChip({ status, tx }: { status: CustomerDebtStatus; tx: (k: string) => string }) {
  return (
    <Chip
      size="small"
      variant="soft"
      color={STATUS_COLOR[status]}
      label={tx(`debts.customerDebts.status.${status}`)}
    />
  );
}

// ----------------------------------------------------------------------

export default function CustomerDebtsTab() {
  const { tx } = useLocales();
  const { canDetailPage } = useCheckPermission();
  const exportMutation = useExportCustomerDebtSummaryMutation();

  const {
    page: pageParam,
    rowsPerPage,
    ordering,
    search,
    dateFrom,
    dateTo,
    amountFrom,
    amountTo,
    activeFiltersCount,
    setOrdering,
    setFilters,
    resetFilters,
    handlePageChange,
    handleRowsPerPageChange,
  } = useCustomerDebtsUrlState();

  const tableHead: HeadCell[] = useMemo(
    () => [
      { id: 'clientName', label: tx('common.table.client'), sortKey: 'client_name' },
      { id: 'clientPhone', label: tx('common.table.phone'), sx: { display: { xs: 'none', md: 'table-cell' } } },
      { id: 'totalDebt', label: tx('common.table.total'), sortKey: 'total_debt', sx: { display: { xs: 'none', sm: 'table-cell' } } },
      { id: 'totalPaid', label: tx('common.table.paid'), sortKey: 'total_paid', sx: { display: { xs: 'none', sm: 'table-cell' } } },
      { id: 'remaining', label: tx('common.table.rem'), sortKey: 'remaining' },
      { id: 'debtCount', label: tx('debts.customerDebts.columns.debtCount'), sortKey: 'debt_count', sx: { display: { xs: 'none', md: 'table-cell' } } },
      { id: 'lastDebtDate', label: tx('debts.customerDebts.columns.lastDebtDate'), sortKey: 'last_debt_date', sx: { display: { xs: 'none', sm: 'table-cell' } } },
      { id: 'lastPaymentDate', label: tx('debts.customerDebts.columns.lastPaymentDate'), sx: { display: { xs: 'none', md: 'table-cell' } } },
      { id: 'status', label: tx('common.table.status') },
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

  const table = useTable({
    defaultCurrentPage: Math.max(0, pageParam - 1),
    defaultRowsPerPage: rowsPerPage,
  });
  const { setPage, setRowsPerPage } = table;
  const page = Math.max(0, pageParam - 1);

  const { data, isPending, isFetching } = useCustomerDebtSummaryQuery({
    page: page + 1,
    pageSize: rowsPerPage,
    ordering,
    search: search || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    amountFrom: amountFrom || undefined,
    amountTo: amountTo || undefined,
  });

  const { data: stats, isPending: statsLoading } = useCustomerDebtStatsQuery();

  const rows = useMemo(() => data?.results ?? [], [data?.results]);
  const total = data?.count ?? 0;
  const showInitialLoader = isPending && !data;
  const canDetailClients = canDetailPage('clients');

  useSyncTableWithUrlListState({
    page: pageParam,
    rowsPerPage,
    tablePage: table.page,
    tableRowsPerPage: table.rowsPerPage,
    setTablePage: setPage,
    setTableRowsPerPage: setRowsPerPage,
  });

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync({
        ordering,
        search: search || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        amountFrom: amountFrom || undefined,
        amountTo: amountTo || undefined,
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (showInitialLoader) {
    return (
      <>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[0, 1, 2, 3].map((i) => (
            <Grid key={i} item xs={12} sm={6} md={3}>
              <ReportStatCard title="" value="—" loading />
            </Grid>
          ))}
        </Grid>
        <DebtsListSkeleton headLabel={tableHead} />
      </>
    );
  }

  return (
    <>
      {/* Summary cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <ReportStatCard
            title={tx('debts.customerDebts.stats.totalOutstanding')}
            value={stats ? fCurrency(stats.totalOutstanding) : '—'}
            color="error"
            icon={<Iconify icon="solar:wallet-money-bold" width={24} />}
            loading={statsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ReportStatCard
            title={tx('debts.customerDebts.stats.customersWithDebt')}
            value={stats?.customersWithDebt ?? '—'}
            color="warning"
            icon={<Iconify icon="solar:users-group-rounded-bold" width={24} />}
            loading={statsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ReportStatCard
            title={tx('debts.customerDebts.stats.overdueCustomers')}
            value={stats?.overdueCustomers ?? '—'}
            color="error"
            icon={<Iconify icon="solar:clock-circle-bold" width={24} />}
            loading={statsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ReportStatCard
            title={tx('debts.customerDebts.stats.averageDebt')}
            value={stats ? fCurrency(stats.averageDebt) : '—'}
            color="info"
            icon={<Iconify icon="solar:chart-bold" width={24} />}
            loading={statsLoading}
          />
        </Grid>
      </Grid>

      {/* Main table card */}
      <Card>
        {isFetching && data ? (
          <LinearProgress sx={{ borderRadius: 1 }} color="inherit" />
        ) : (
          <Box sx={{ height: 4 }} />
        )}

        <Stack spacing={2} sx={{ p: 2 }}>
          {/* Toolbar */}
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              placeholder={tx('debts.customerDebts.searchPlaceholder')}
              value={search}
              onChange={(e) => setFilters({ search: e.target.value })}
              sx={{ width: { xs: '100%', sm: 240 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ flexGrow: 1 }} />

            <FilterDrawer
              filtersCount={activeFiltersCount}
              title={tx('common.actions.filters')}
              resetLabel={tx('common.actions.reset')}
              onReset={resetFilters}
            >
              <FilterFieldDateRange
                label={tx('debts.filters.dateRange')}
                fromLabel={tx('debts.filters.dateFrom')}
                toLabel={tx('debts.filters.dateTo')}
                fromValue={dateFrom}
                toValue={dateTo}
                onFromChange={(v) => setFilters({ dateFrom: v })}
                onToChange={(v) => setFilters({ dateTo: v })}
              />

              <FilterFieldRange
                label={tx('debts.filters.amountRange')}
                minLabel={tx('debts.filters.amountMin')}
                maxLabel={tx('debts.filters.amountMax')}
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
                  <TableRow key={row.clientId} hover>
                    <TableCell>
                      {canDetailClients ? (
                        <Link
                          component={RouterLink}
                          href={`${paths.clients.details(row.clientId)}?tab=debts`}
                          variant="subtitle2"
                        >
                          {row.clientName}
                        </Link>
                      ) : (
                        row.clientName
                      )}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      {row.clientPhone ?? '—'}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      {fCurrency(row.totalDebt)}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      {fCurrency(row.totalPaid)}
                    </TableCell>
                    <TableCell>{fCurrency(row.remaining)}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      {row.debtCount}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      {row.lastDebtDate ? fDate(row.lastDebtDate) : '—'}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      {row.lastPaymentDate ? fDate(row.lastPaymentDate) : '—'}
                    </TableCell>
                    <TableCell>
                      <CustomerStatusChip status={row.status} tx={tx} />
                    </TableCell>
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
    </>
  );
}
