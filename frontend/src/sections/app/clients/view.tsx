import { useMemo, useRef, useState, useEffect, type MouseEvent } from 'react';
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
import { fDateTime } from 'src/utils/format-time';
// routes
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hook';
import { RouterLink } from 'src/routes/components';
import { useDebounce } from 'src/hooks/use-debounce';
import { useUrlListState, useSyncTableWithUrlListState } from 'src/hooks/use-url-query-state';
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

import {
  useClientsListQuery,
  useBulkDeleteClientsMutation,
  useBulkCreateClientsMutation,
  useDeleteClientMutation,
} from 'src/sections/app/clients/api/use-clients-api';
import { ClientsListSkeleton } from 'src/sections/app/clients/skeleton';

// ----------------------------------------------------------------------

export default function ClientsView() {
  const { tx } = useLocales();
  const router = useRouter();
  const { canWritePage, canDetailPage } = useCheckPermission();
  const { enqueueSnackbar } = useSnackbar();
  const actionsPopover = usePopover();
  const deleteMutation = useDeleteClientMutation();
  const bulkDeleteMutation = useBulkDeleteClientsMutation();
  const bulkCreateMutation = useBulkCreateClientsMutation();
  const excelInputRef = useRef<HTMLInputElement | null>(null);

  const tableHead = useMemo(
    () => [
      { id: 'name', label: tx('common.table.client') },
      { id: 'phone', label: tx('common.table.phone') },
      { id: 'created', label: tx('common.table.created') },
      { id: '', label: '' },
    ],
    [tx]
  );

  const {
    page: pageParam,
    rowsPerPage,
    search: searchValue,
    ordering,
    setSearch,
    handlePageChange,
    handleRowsPerPageChange,
  } = useUrlListState({
    pageKey: 'page',
    pageSizeKey: 'page_size',
    searchKey: 'search',
    orderingKey: 'ordering',
    defaultPage: 1,
    defaultPageSize: 15,
    defaultOrdering: '-created_at',
  });
  const debouncedSearch = useDebounce(searchValue.trim(), 400);
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

  const closeActions = (clearSelected = true) => {
    actionsPopover.onClose();
    if (clearSelected) {
      setSelectedClientId(null);
    }
  };
  const handleCloseActions = () => closeActions();

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

  const handleOpenBulkDelete = () => {
    setBulkDeleteOpen(true);
  };

  const handleCloseBulkDelete = () => {
    setBulkDeleteOpen(false);
  };

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
      enqueueSnackbar(tx('clients.toasts.bulkDeleted', { count: selectedIds.length }), {
        variant: 'success',
      });
      table.onUpdatePageDeleteRows({
        totalRows: total,
        totalRowsInPage: rows.length,
        totalRowsFiltered: total,
      });
      table.setSelected([]);
      handleCloseBulkDelete();
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenCreate = () => {
    router.push(paths.clients.create);
  };

  const handleOpenExcelPicker = () => {
    excelInputRef.current?.click();
  };

  const handleExcelFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const result = await bulkCreateMutation.mutateAsync(file);
      enqueueSnackbar(tx('clients.toasts.bulkCreated', { count: result.created }), {
        variant: 'success',
      });
    } catch (error) {
      console.error(error);
    }
  };


  const deletingCurrent =
    deleteMutation.isPending &&
    selectedClientId !== null &&
    deleteMutation.variables === selectedClientId;
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
            <TextField
              size="small"
              placeholder={tx('clients.searchPlaceholder')}
              value={searchValue}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ maxWidth: 360 }}
            />

            <Scrollbar>
              <Table size="small">
                <TableHeadCustom
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

      <CustomPopover open={actionsPopover.open} onClose={handleCloseActions} sx={{ width: 180, p: 1 }}>
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
