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
// utils
import { fDateTime } from 'src/utils/format-time';
// routes
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hook';
import { RouterLink } from 'src/routes/components';
import { useDebounce } from 'src/hooks/use-debounce';
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
  useCreateClientMutation,
  useDeleteClientMutation,
  useUpdateClientMutation,
} from 'src/sections/app/clients/api/use-clients-api';
import type { ClientListItem } from 'src/sections/app/clients/api/types';
import { ClientUpsertDialog } from 'src/sections/app/clients/components';
import { ClientsListSkeleton } from 'src/sections/app/clients/skeleton';

// ----------------------------------------------------------------------

export default function ClientsView() {
  const { tx } = useLocales();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const actionsPopover = usePopover();
  const createMutation = useCreateClientMutation();
  const deleteMutation = useDeleteClientMutation();
  const bulkDeleteMutation = useBulkDeleteClientsMutation();
  const bulkCreateMutation = useBulkCreateClientsMutation();
  const updateMutation = useUpdateClientMutation();
  const excelInputRef = useRef<HTMLInputElement | null>(null);

  const tableHead = useMemo(
    () => [
      { id: 'name', label: tx('shared.table.client') },
      { id: 'phone', label: tx('shared.table.phone') },
      { id: 'created', label: tx('shared.table.created') },
      { id: '', label: '' },
    ],
    [tx]
  );

  const [query, setQuery] = useState('');
  const debouncedSearch = useDebounce(query.trim(), 400);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [upsertOpen, setUpsertOpen] = useState(false);
  const [upsertMode, setUpsertMode] = useState<'create' | 'edit'>('create');
  const [editingClient, setEditingClient] = useState<ClientListItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const table = useTable({ defaultRowsPerPage: 15 });
  const { onResetPage, page, rowsPerPage, onChangePage, onChangeRowsPerPage } = table;

  useEffect(() => {
    onResetPage();
  }, [debouncedSearch, onResetPage]);

  const { data, isPending, isFetching } = useClientsListQuery({
    page: page + 1,
    pageSize: rowsPerPage,
    search: debouncedSearch || undefined,
  });

  const rows = useMemo(() => data?.results ?? [], [data?.results]);
  const total = data?.count ?? 0;
  const showInitialLoader = isPending && !data;
  const selectedIds = table.selected;
  const setSelected = table.setSelected;

  useEffect(() => {
    const rowIdSet = new Set(rows.map((row) => row.id));
    const nextSelected = selectedIds.filter((id) => rowIdSet.has(id));
    if (nextSelected.length !== selectedIds.length) {
      setSelected(nextSelected);
    }
  }, [rows, selectedIds, setSelected]);

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
    const client = rows.find((row) => row.id === selectedClientId);
    if (!client) {
      closeActions();
      return;
    }
    setEditingClient(client);
    setUpsertMode('edit');
    setUpsertOpen(true);
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
      enqueueSnackbar(tx('pages.clients.toasts.deleted'), { variant: 'success' });
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
      enqueueSnackbar(tx('pages.clients.toasts.bulk_deleted', { count: selectedIds.length }), {
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
    setUpsertMode('create');
    setEditingClient(null);
    setUpsertOpen(true);
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
      enqueueSnackbar(tx('pages.clients.toasts.bulk_created', { count: result.created }), {
        variant: 'success',
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleCloseUpsert = () => {
    setUpsertOpen(false);
    setEditingClient(null);
  };

  const handleSubmitUpsert = async (values: { name: string; phone: string }) => {
    if (!values.name.trim() || !values.phone.trim()) {
      enqueueSnackbar(tx('pages.clients.toasts.required_fields'), { variant: 'warning' });
      return;
    }
    try {
      if (upsertMode === 'create') {
        await createMutation.mutateAsync({
          name: values.name.trim(),
          phone: values.phone.trim(),
        });
        enqueueSnackbar(tx('pages.clients.toasts.created'), { variant: 'success' });
      } else if (editingClient) {
        await updateMutation.mutateAsync({
          id: editingClient.id,
          name: values.name.trim(),
          phone: values.phone.trim(),
        });
        enqueueSnackbar(tx('pages.clients.toasts.updated'), { variant: 'success' });
      }
      handleCloseUpsert();
      onResetPage();
      setQuery('');
    } catch (error) {
      console.error(error);
    }
  };

  const deletingCurrent =
    deleteMutation.isPending &&
    selectedClientId !== null &&
    deleteMutation.variables === selectedClientId;
  const deletingBulk = bulkDeleteMutation.isPending;
  const upsertLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('layout.nav.clients')}
        links={[{ name: tx('layout.nav.clients'), href: paths.clients.root }]}
        action={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:cloud-upload-fill" />}
              onClick={handleOpenExcelPicker}
              disabled={bulkCreateMutation.isPending}
            >
              {tx('pages.clients.import_excel_button')}
            </Button>
            <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={handleOpenCreate}>
              {tx('pages.clients.add_button')}
            </Button>
          </Stack>
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
            <TableSelectedAction
              numSelected={selectedIds.length}
              rowCount={rows.length}
              onSelectAllRows={(checked) => table.onSelectAllRows(checked, rows.map((row) => row.id))}
              action={
                <Button color="error" onClick={handleOpenBulkDelete}>
                  {tx('shared.actions.delete')}
                </Button>
              }
            />
            <TextField
              size="small"
              placeholder={tx('pages.clients.search_placeholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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
                        />
                      </TableCell>
                      <TableCell>
                        <Link component={RouterLink} href={paths.clients.details(row.id)} variant="subtitle2">
                          {row.name}
                        </Link>
                      </TableCell>
                      <TableCell>{row.phone}</TableCell>
                      <TableCell>{fDateTime(row.createdAt)}</TableCell>
                      <TableCell align="right">
                        <IconButton color="default" onClick={(event) => openActions(event, row.id)}>
                          <Iconify icon="eva:more-vertical-fill" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableNoData notFound={!rows.length} />
                </TableBody>
              </Table>
            </Scrollbar>

            <TablePaginationCustom
              count={total}
              page={page}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[5, 10, 15, 25]}
              onPageChange={onChangePage}
              onRowsPerPageChange={onChangeRowsPerPage}
            />
          </Stack>
        </Card>
      )}

      <CustomPopover open={actionsPopover.open} onClose={handleCloseActions} sx={{ width: 180, p: 1 }}>
        <MenuItem onClick={handleView}>
          <Iconify icon="solar:eye-bold" />
          {tx('shared.actions.view')}
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <Iconify icon="solar:pen-bold" />
          {tx('shared.actions.edit')}
        </MenuItem>
        <MenuItem onClick={handleAskDelete} sx={{ color: 'error.main' }} disabled={deletingCurrent}>
          <Iconify icon="solar:trash-bin-trash-bold" />
          {tx('shared.actions.delete')}
        </MenuItem>
      </CustomPopover>

      <ClientUpsertDialog
        open={upsertOpen}
        mode={upsertMode}
        loading={upsertLoading}
        initialValues={
          upsertMode === 'edit' && editingClient
            ? {
                name: editingClient.name,
                phone: editingClient.phone,
              }
            : undefined
        }
        onClose={handleCloseUpsert}
        onSubmit={handleSubmitUpsert}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={handleCloseDelete}
        title={tx('pages.clients.dialogs.delete.title')}
        content={tx('pages.clients.dialogs.delete.description')}
        cancelText={tx('shared.actions.cancel')}
        action={
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deletingCurrent}>
            {tx('shared.actions.delete')}
          </Button>
        }
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={handleCloseBulkDelete}
        title={tx('pages.clients.dialogs.delete.bulk_title')}
        content={tx('pages.clients.dialogs.delete.bulk_description', { count: selectedIds.length })}
        cancelText={tx('shared.actions.cancel')}
        action={
          <Button color="error" variant="contained" onClick={handleBulkDelete} disabled={deletingBulk}>
            {tx('shared.actions.delete')}
          </Button>
        }
      />
    </>
  );
}
