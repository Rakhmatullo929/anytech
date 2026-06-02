import { useCallback, useMemo, useState } from 'react';
import type { AutocompleteInfiniteFetcher } from 'src/components/autocomplete-infinite';
import AutocompleteInfinite from 'src/components/autocomplete-infinite';
// locales
import { useLocales } from 'src/locales';
// @mui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
// utils
import { fCurrency } from 'src/utils/format-number';
import { fDate } from 'src/utils/format-time';
import { useSyncTableWithUrlListState } from 'src/hooks/use-url-query-state';
import { useCheckPermission } from 'src/auth/hooks/use-check-permission';
// routes
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hook';
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
import {
  useDebtsListQuery,
  useExportDebtsMutation,
  useDebtsUrlState,
  type DebtStatus,
  type DebtListItem,
} from 'src/sections/app/depts/api';
import { DebtsListSkeleton } from 'src/sections/app/depts/skeleton';
import PaymentHistoryView from './payment-history-view';

// ----------------------------------------------------------------------

type HeadCell = { id: string; label: string; sortKey?: string; sx?: object };

const CLIENTS_QUERY_KEY_BASE = ['debts-clients', 'infinite'] as const;
const clientsInfiniteFetcher: AutocompleteInfiniteFetcher<ClientListItem> = ({ page, search }) =>
  fetchClientsList({ page, pageSize: 20, search: search || undefined });

// ----------------------------------------------------------------------

function getDeadlineInfo(deadline: string | null): { diff: number } | null {
  if (!deadline) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(deadline);
  due.setHours(0, 0, 0, 0);
  return { diff: Math.round((due.getTime() - now.getTime()) / 86400000) };
}

function DeadlineCell({
  row,
  tx,
  sx,
}: {
  row: DebtListItem;
  tx: (k: string, o?: Record<string, string | number>) => string;
  sx?: object;
}) {
  if (!row.deadline) return <TableCell sx={sx}>—</TableCell>;
  const info = getDeadlineInfo(row.deadline);
  if (!info) return <TableCell sx={sx}>—</TableCell>;
  const { diff } = info;

  if (row.status === 'closed') {
    return (
      <TableCell sx={sx}>
        <Typography variant="body2" color="text.secondary">
          {fDate(row.deadline)}
        </Typography>
      </TableCell>
    );
  }
  if (diff > 0) {
    return (
      <TableCell sx={sx}>
        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">{fDate(row.deadline)}</Typography>
          <Chip size="small" label={tx('debts.list.daysLeft', { count: diff })} color="success" variant="soft" />
        </Stack>
      </TableCell>
    );
  }
  if (diff === 0) {
    return (
      <TableCell sx={sx}>
        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">{fDate(row.deadline)}</Typography>
          <Chip size="small" label={tx('debts.detail.dueToday')} color="warning" variant="soft" />
        </Stack>
      </TableCell>
    );
  }
  return (
    <TableCell sx={sx}>
      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">{fDate(row.deadline)}</Typography>
        <Chip size="small" label={tx('debts.list.daysOverdue', { count: Math.abs(diff) })} color="error" variant="soft" />
      </Stack>
    </TableCell>
  );
}

// ----------------------------------------------------------------------

function DebtsListTab() {
  const { tx } = useLocales();
  const { canDetailPage } = useCheckPermission();
  const exportMutation = useExportDebtsMutation();

  const {
    page: pageParam,
    rowsPerPage,
    ordering,
    status,
    clientIds,
    dateFrom,
    dateTo,
    deadlineFrom,
    deadlineTo,
    amountFrom,
    amountTo,
    activeFiltersCount,
    setOrdering,
    setFilters,
    resetFilters,
    handlePageChange,
    handleRowsPerPageChange,
  } = useDebtsUrlState();

  const [selectedClients, setSelectedClients] = useState<ClientListItem[]>([]);

  const tableHead: HeadCell[] = useMemo(
    () => [
      { id: 'client', label: tx('common.table.client'), sortKey: 'client__name' },
      { id: 'total', label: tx('common.table.total'), sortKey: 'total_amount', sx: { display: { xs: 'none', sm: 'table-cell' } } },
      { id: 'paid', label: tx('common.table.paid'), sortKey: 'paid_amount', sx: { display: { xs: 'none', sm: 'table-cell' } } },
      { id: 'rem', label: tx('common.table.rem'), sortKey: 'remaining_amount' },
      { id: 'deadline', label: tx('debts.list.deadline'), sortKey: 'deadline', sx: { display: { xs: 'none', sm: 'table-cell' } } },
      { id: 'status', label: tx('common.table.status'), sortKey: 'status' },
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

  const clientIdsStr = clientIds.join(',');

  const { data, isPending, isFetching } = useDebtsListQuery({
    page: page + 1,
    pageSize: rowsPerPage,
    ordering,
    status: status || undefined,
    clientIds: clientIdsStr || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    deadlineFrom: deadlineFrom || undefined,
    deadlineTo: deadlineTo || undefined,
    amountFrom: amountFrom || undefined,
    amountTo: amountTo || undefined,
  });
  const rows = useMemo(() => data?.results ?? [], [data?.results]);
  const total = data?.count ?? 0;
  const showInitialLoader = isPending && !data;
  const canDetailDebts = canDetailPage('debts');

  useSyncTableWithUrlListState({
    page: pageParam,
    rowsPerPage,
    tablePage: table.page,
    tableRowsPerPage: table.rowsPerPage,
    setTablePage: setPage,
    setTableRowsPerPage: setRowsPerPage,
  });

  const statusOptions = useMemo(
    () => [
      { value: '', label: tx('common.status.filterAll') },
      { value: 'active', label: tx('common.status.filterActive') },
      { value: 'closed', label: tx('common.status.filterClosed') },
    ],
    [tx]
  );

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync({
        ordering,
        status: status || undefined,
        clientIds: clientIdsStr || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        deadlineFrom: deadlineFrom || undefined,
        deadlineTo: deadlineTo || undefined,
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
  };

  if (showInitialLoader) {
    return <DebtsListSkeleton headLabel={tableHead} />;
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
            <TextField
              select
              fullWidth
              size="small"
              label={tx('common.status.filterLabel')}
              value={status}
              onChange={(e) => setFilters({ status: e.target.value as '' | DebtStatus })}
            >
              {statusOptions.map((opt) => (
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
              label={tx('debts.filters.client')}
            />

            <FilterFieldDateRange
              label={tx('debts.filters.dateRange')}
              fromLabel={tx('debts.filters.dateFrom')}
              toLabel={tx('debts.filters.dateTo')}
              fromValue={dateFrom}
              toValue={dateTo}
              onFromChange={(v) => setFilters({ dateFrom: v })}
              onToChange={(v) => setFilters({ dateTo: v })}
            />

            <FilterFieldDateRange
              label={tx('debts.filters.deadlineRange')}
              fromLabel={tx('debts.filters.deadlineFrom')}
              toLabel={tx('debts.filters.deadlineTo')}
              fromValue={deadlineFrom}
              toValue={deadlineTo}
              onFromChange={(v) => setFilters({ deadlineFrom: v })}
              onToChange={(v) => setFilters({ deadlineTo: v })}
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
              {rows.map((row) => {
                const isOverdue =
                  row.status === 'active' &&
                  row.deadline != null &&
                  (getDeadlineInfo(row.deadline)?.diff ?? 1) < 0;

                return (
                  <TableRow
                    key={row.id}
                    hover
                    sx={isOverdue ? { bgcolor: 'error.lighter' } : undefined}
                  >
                    <TableCell>
                      {canDetailDebts ? (
                        <Link
                          component={RouterLink}
                          href={paths.debts.details(row.id)}
                          variant="subtitle2"
                        >
                          {row.clientName}
                        </Link>
                      ) : (
                        row.clientName
                      )}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{fCurrency(row.totalAmount)}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{fCurrency(row.paidAmount)}</TableCell>
                    <TableCell>{fCurrency(row.remaining)}</TableCell>
                    <DeadlineCell row={row} tx={tx} sx={{ display: { xs: 'none', sm: 'table-cell' } }} />
                    <TableCell>
                      {row.status === 'active'
                        ? tx('common.status.rowActive')
                        : tx('common.status.rowClosed')}
                    </TableCell>
                  </TableRow>
                );
              })}
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

// ----------------------------------------------------------------------

export default function DebtsView() {
  const { tx } = useLocales();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') === 'payments' ? 'payments' : 'debts';

  const handleTabChange = (_: React.SyntheticEvent, value: string) => {
    router.replace(`${paths.debts.root}?tab=${value}`);
  };

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('common.navigation.debts')}
        links={[{ name: tx('common.navigation.debts'), href: paths.debts.root }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        sx={{ mb: 3 }}
      >
        <Tab value="debts" label={tx('debts.tabs.debts')} />
        <Tab value="payments" label={tx('debts.tabs.paymentHistory')} />
      </Tabs>

      {currentTab === 'debts' && <DebtsListTab />}
      {currentTab === 'payments' && <PaymentHistoryView />}
    </>
  );
}
