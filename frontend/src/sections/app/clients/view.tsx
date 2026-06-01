import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import type { AutocompleteInfiniteFetcher } from 'src/components/autocomplete-infinite';
import AutocompleteInfinite from 'src/components/autocomplete-infinite';
// locales
import { useLocales } from 'src/locales';
// @mui
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
// utils
import { fCurrency } from 'src/utils/format-number';
import { fDate, fDateTime } from 'src/utils/format-time';
// routes
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hook';
import { RouterLink } from 'src/routes/components';
import { useDebounce } from 'src/hooks/use-debounce';
import { useSyncTableWithUrlListState } from 'src/hooks/use-url-query-state';
import { useCheckPermission } from 'src/auth/hooks/use-check-permission';
import Can from 'src/auth/components/can';
// components
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { ConfirmDialog } from 'src/components/custom-dialog';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import { useSnackbar } from 'src/components/snackbar';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';
import { FilterDrawer, FilterFieldMultiSelect } from 'src/components/filter-drawer';
import { fetchGroupsList } from 'src/sections/app/clients/groups/api/groups-requests';
import type { GroupListItem } from 'src/sections/app/clients/groups/api/types';

import {
  useClientsListQuery,
  useBulkDeleteClientsMutation,
  useBulkCreateClientsMutation,
  useDeleteClientMutation,
  useExportClientsMutation,
} from 'src/sections/app/clients/api/use-clients-api';
import { useClientsUrlState } from 'src/sections/app/clients/api/use-clients-url-state';
import { ClientsListSkeleton } from 'src/sections/app/clients/skeleton';
import ClientsTabs from 'src/sections/app/clients/components/clients-tabs';

// ----------------------------------------------------------------------

type HeadCell = { id: string; label: string; sortKey?: string };

const GROUPS_QUERY_KEY_BASE = ['clients-groups', 'infinite'] as const;

const groupsInfiniteFetcher: AutocompleteInfiniteFetcher<GroupListItem> = ({ page, search }) =>
  fetchGroupsList({ page, pageSize: 20, search: search || undefined });

export default function ClientsView() {
  const { tx } = useLocales();
  const router = useRouter();
  const { canWritePage, canDetailPage } = useCheckPermission();
  const { enqueueSnackbar } = useSnackbar();
  const actionsPopover = usePopover();
  const deleteMutation = useDeleteClientMutation();
  const bulkDeleteMutation = useBulkDeleteClientsMutation();
  const bulkCreateMutation = useBulkCreateClientsMutation();
  const exportMutation = useExportClientsMutation();
  const excelInputRef = useRef<HTMLInputElement | null>(null);

  // ── URL state ──────────────────────────────────────────────────────────
  const {
    page: pageParam,
    rowsPerPage,
    search: searchValue,
    ordering,
    gender,
    groupIds,
    activeFiltersCount,
    setSearch,
    setOrdering,
    setFilters,
    resetFilters,
    handlePageChange,
    handleRowsPerPageChange,
  } = useClientsUrlState();

  const debouncedSearch = useDebounce(searchValue.trim(), 400);

  // ── Sorting ────────────────────────────────────────────────────────────
  const tableHead: HeadCell[] = useMemo(
    () => [
      { id: 'name', label: tx('common.table.client'), sortKey: 'name' },
      { id: 'phone', label: tx('common.table.phone') },
      { id: 'last_purchase', label: tx('clients.detail.lastPurchase'), sortKey: 'last_purchase_at' },
      { id: 'total_purchases', label: tx('clients.detail.totalPurchasesAmount'), sortKey: 'total_purchases_amount' },
      { id: 'created', label: tx('common.table.created'), sortKey: 'created_at' },
      { id: '', label: '' },
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

  // ── Filter options ─────────────────────────────────────────────────────
  const [selectedGroups, setSelectedGroups] = useState<GroupListItem[]>([]);

  const genderOptions = useMemo(
    () => [
      { value: 'male', label: tx('clients.filters.genderMale') },
      { value: 'female', label: tx('clients.filters.genderFemale') },
    ],
    [tx]
  );

  // ── Table ──────────────────────────────────────────────────────────────
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const table = useTable({
    defaultCurrentPage: Math.max(0, pageParam - 1),
    defaultRowsPerPage: rowsPerPage,
  });
  const { setPage, setRowsPerPage } = table;
  const page = Math.max(0, pageParam - 1);

  const { data, isPending, isFetching } = useClientsListQuery({
    page: page + 1,
    pageSize: rowsPerPage,
    search: debouncedSearch || undefined,
    ordering,
    groupIds: groupIds.length ? groupIds : undefined,
    gender: gender || undefined,
  });

  const rows = useMemo(() => data?.results ?? [], [data?.results]);
  const total = data?.count ?? 0;
  const showInitialLoader = isPending && !data;
  const { selected: selectedIds, setSelected } = table;

  useEffect(() => {
    const rowIdSet = new Set(rows.map((row) => row.id));
    const nextSelected = selectedIds.filter((id) => rowIdSet.has(id));
    if (nextSelected.length !== selectedIds.length) {
      setSelected(nextSelected);
    }
  }, [rows, selectedIds, setSelected]);

  useSyncTableWithUrlListState({
    page: pageParam,
    rowsPerPage,
    tablePage: table.page,
    tableRowsPerPage: table.rowsPerPage,
    setTablePage: setPage,
    setTableRowsPerPage: setRowsPerPage,
  });

  // ── Action handlers ────────────────────────────────────────────────────
  const closeActions = (clearSelected = true) => {
    actionsPopover.onClose();
    if (clearSelected) setSelectedClientId(null);
  };

  const openActions = (event: MouseEvent<HTMLElement>, clientId: string) => {
    setSelectedClientId(clientId);
    actionsPopover.onOpen(event);
  };

  const handleView = () => {
    if (!selectedClientId) return;
    router.push(paths.clients.details(selectedClientId));
    closeActions();
  };

  const handleEdit = () => {
    if (!selectedClientId) return;
    router.push(paths.clients.edit(selectedClientId));
    closeActions(false);
  };

  const handleAskDelete = () => {
    closeActions(false);
    setDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteOpen(false);
    setSelectedClientId(null);
  };

  const handleOpenBulkDelete = () => setBulkDeleteOpen(true);
  const handleCloseBulkDelete = () => setBulkDeleteOpen(false);

  const handleDelete = async () => {
    if (!selectedClientId) return;
    try {
      await deleteMutation.mutateAsync(selectedClientId);
      enqueueSnackbar(tx('clients.toasts.deleted'), { variant: 'success' });
    } catch (error) {
      console.error(error);
    } finally {
      handleCloseDelete();
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    try {
      await bulkDeleteMutation.mutateAsync(selectedIds);
      enqueueSnackbar(tx('clients.toasts.bulkDeleted', { count: selectedIds.length }), { variant: 'success' });
      table.onUpdatePageDeleteRows({ totalRows: total, totalRowsInPage: rows.length, totalRowsFiltered: total });
      table.setSelected([]);
      handleCloseBulkDelete();
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenCreate = () => router.push(paths.clients.create);

  const handleOpenExcelPicker = () => excelInputRef.current?.click();

  const handleExcelFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const result = await bulkCreateMutation.mutateAsync(file);
      enqueueSnackbar(tx('clients.toasts.bulkCreated', { count: result.created }), { variant: 'success' });
    } catch (error) {
      console.error(error);
    }
  };

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync({
        search: debouncedSearch || undefined,
        ordering,
        groupIds: groupIds.length ? groupIds : undefined,
        gender: gender || undefined,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const deletingCurrent =
    deleteMutation.isPending && selectedClientId !== null && deleteMutation.variables === selectedClientId;
  const deletingBulk = bulkDeleteMutation.isPending;
  const canWriteClients = canWritePage('clients');
  const canDetailClients = canDetailPage('clients');

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('common.navigation.clients')}
        links={[{ name: tx('common.navigation.clients'), href: paths.clients.root }]}
        action={
          <Can page="clients" action="write">
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="eva:cloud-upload-fill" />}
                onClick={handleOpenExcelPicker}
                disabled={bulkCreateMutation.isPending}
              >
                {tx('clients.importExcelButton')}
              </Button>
              <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={handleOpenCreate}>
                {tx('clients.addButton')}
              </Button>
            </Stack>
          </Can>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <input
        ref={excelInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleExcelFileChange}
        style={{ display: 'none' }}
      />
      <ClientsTabs value="clients" />

      {showInitialLoader ? (
        <ClientsListSkeleton headLabel={tableHead} />
      ) : (
        <Card>
          {isFetching && data ? (
            <LinearProgress sx={{ borderRadius: 1 }} color="inherit" />
          ) : (
            <Box sx={{ height: 4 }} />
          )}

          <Stack spacing={2} sx={{ p: 2 }}>
            <Can page="clients" action="write">
              <TableSelectedAction
                numSelected={selectedIds.length}
                rowCount={rows.length}
                onSelectAllRows={(checked) => table.onSelectAllRows(checked, rows.map((row) => row.id))}
                action={
                  <Button color="error" onClick={handleOpenBulkDelete}>
                    {tx('common.actions.delete')}
                  </Button>
                }
              />
            </Can>

            {/* Toolbar: search (left) + filters + export (right) */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              <TextField
                size="small"
                placeholder={tx('clients.searchPlaceholder')}
                value={searchValue}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ width: { sm: 280 }, flexShrink: 0 }}
              />

              <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }} />

              <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-end', sm: 'flex-start' }}>
                <FilterDrawer
                  filtersCount={activeFiltersCount}
                  title={tx('common.actions.filters')}
                  resetLabel={tx('common.actions.reset')}
                  onReset={() => {
                    resetFilters();
                    setSelectedGroups([]);
                  }}
                >
                  <FilterFieldMultiSelect
                    label={tx('clients.filters.gender')}
                    options={genderOptions}
                    value={gender ? [gender] : []}
                    onChange={(vals) => setFilters({ gender: vals[vals.length - 1] ?? '' })}
                  />
                  <AutocompleteInfinite<GroupListItem>
                    queryKeyBase={GROUPS_QUERY_KEY_BASE}
                    fetcher={groupsInfiniteFetcher}
                    pageSize={20}
                    size="small"
                    value={selectedGroups}
                    onChange={(groups) => {
                      setSelectedGroups(groups);
                      setFilters({ groupIds: groups.map((g) => g.id).join(',') });
                    }}
                    getOptionLabel={(g) => g.name}
                    label={tx('clients.filters.group')}
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
                >
                  {tx('common.actions.export')}
                </Button>
              </Stack>
            </Stack>

            <Scrollbar>
              <Table size="small">
                <TableHeadCustom
                  order={tableOrder}
                  orderBy={tableOrderBy}
                  onSort={handleSort}
                  headLabel={tableHead}
                  rowCount={rows.length}
                  numSelected={selectedIds.length}
                  onSelectAllRows={(checked) => table.onSelectAllRows(checked, rows.map((row) => row.id))}
                />
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} hover selected={selectedIds.includes(row.id)}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(row.id)}
                          onClick={() => table.onSelectRow(row.id)}
                          disabled={!canWriteClients}
                        />
                      </TableCell>
                      <TableCell>
                        <Can
                          page="clients"
                          action="detail"
                          fallback={<Typography variant="subtitle2">{row.name}</Typography>}
                        >
                          <Link component={RouterLink} href={paths.clients.details(row.id)} variant="subtitle2">
                            {row.name}
                          </Link>
                        </Can>
                      </TableCell>
                      <TableCell>{row.phone}</TableCell>
                      <TableCell>{row.lastPurchaseAt ? fDate(row.lastPurchaseAt) : '—'}</TableCell>
                      <TableCell>{fCurrency(row.totalPurchasesAmount)}</TableCell>
                      <TableCell>{fDateTime(row.createdAt)}</TableCell>
                      <TableCell align="right">
                        {canDetailClients || canWriteClients ? (
                          <IconButton color="default" onClick={(event) => openActions(event, row.id)}>
                            <Iconify icon="eva:more-vertical-fill" />
                          </IconButton>
                        ) : null}
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
      )}

      <CustomPopover open={actionsPopover.open} onClose={() => closeActions()} sx={{ width: 180, p: 1 }}>
        <Can page="clients" action="detail">
          <MenuItem onClick={handleView}>
            <Iconify icon="solar:eye-bold" />
            {tx('common.actions.view')}
          </MenuItem>
        </Can>
        <Can page="clients" action="write">
          <MenuItem onClick={handleEdit}>
            <Iconify icon="solar:pen-bold" />
            {tx('common.actions.edit')}
          </MenuItem>
        </Can>
        <Can page="clients" action="write">
          <MenuItem onClick={handleAskDelete} sx={{ color: 'error.main' }} disabled={deletingCurrent}>
            <Iconify icon="solar:trash-bin-trash-bold" />
            {tx('common.actions.delete')}
          </MenuItem>
        </Can>
      </CustomPopover>

      <Can page="clients" action="write">
        <ConfirmDialog
          open={deleteOpen}
          onClose={handleCloseDelete}
          title={tx('clients.dialogs.delete.title')}
          content={tx('clients.dialogs.delete.description')}
          cancelText={tx('common.actions.cancel')}
          action={
            <Button color="error" variant="contained" onClick={handleDelete} disabled={deletingCurrent}>
              {tx('common.actions.delete')}
            </Button>
          }
        />
      </Can>

      <Can page="clients" action="write">
        <ConfirmDialog
          open={bulkDeleteOpen}
          onClose={handleCloseBulkDelete}
          title={tx('clients.dialogs.delete.bulkTitle')}
          content={tx('clients.dialogs.delete.bulkDescription', { count: selectedIds.length })}
          cancelText={tx('common.actions.cancel')}
          action={
            <Button color="error" variant="contained" onClick={handleBulkDelete} disabled={deletingBulk}>
              {tx('common.actions.delete')}
            </Button>
          }
        />
      </Can>
    </>
  );
}
