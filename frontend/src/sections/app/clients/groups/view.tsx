import { useMemo, useState, type MouseEvent } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';

import Can from 'src/auth/components/can';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { ConfirmDialog } from 'src/components/custom-dialog';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { useSnackbar } from 'src/components/snackbar';
import { TableHeadCustom, TableNoData, TablePaginationCustom, useTable } from 'src/components/table';
import { useDebounce } from 'src/hooks/use-debounce';
import { useSyncTableWithUrlListState, useUrlListState } from 'src/hooks/use-url-query-state';
import { useLocales } from 'src/locales';
import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';
import { fDateTime } from 'src/utils/format-time';

import ClientsTabs from '../components/clients-tabs';
import { GroupUpsertDialog } from './components';
import type { GroupListItem } from './api/types';
import { useCreateGroupMutation, useDeleteGroupMutation, useGroupsListQuery, useUpdateGroupMutation } from './api/use-groups-api';
import { ClientGroupsListSkeleton } from './skeleton';

export default function ClientGroupsView() {
  const { tx } = useLocales();
  const { enqueueSnackbar } = useSnackbar();
  const actionsPopover = usePopover();
  const createMutation = useCreateGroupMutation();
  const updateMutation = useUpdateGroupMutation();
  const deleteMutation = useDeleteGroupMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedGroup, setSelectedGroup] = useState<GroupListItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const tableHead = useMemo(
    () => [
      { id: 'name', label: tx('clients.groups.table.name') },
      { id: 'clientsCount', label: tx('clients.groups.table.clientsCount') },
      { id: 'createdAt', label: tx('common.table.created') },
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

  const table = useTable({
    defaultCurrentPage: Math.max(0, pageParam - 1),
    defaultRowsPerPage: rowsPerPage,
  });
  const page = Math.max(0, pageParam - 1);

  const { data, isPending, isFetching } = useGroupsListQuery({
    page: page + 1,
    pageSize: rowsPerPage,
    search: debouncedSearch || undefined,
    ordering,
  });

  useSyncTableWithUrlListState({
    page: pageParam,
    rowsPerPage,
    tablePage: table.page,
    tableRowsPerPage: table.rowsPerPage,
    setTablePage: table.setPage,
    setTableRowsPerPage: table.setRowsPerPage,
  });

  const rows = useMemo(() => data?.results ?? [], [data?.results]);
  const total = data?.count ?? 0;
  const showInitialLoader = isPending && !data;

  const closeActions = (clearSelected = true) => {
    actionsPopover.onClose();
    if (clearSelected) {
      setSelectedGroup(null);
    }
  };

  const openActions = (event: MouseEvent<HTMLElement>, group: GroupListItem) => {
    setSelectedGroup(group);
    actionsPopover.onOpen(event);
  };

  const handleOpenCreate = () => {
    setDialogMode('create');
    setSelectedGroup(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = () => {
    if (!selectedGroup) return;
    setDialogMode('edit');
    setDialogOpen(true);
    closeActions(false);
  };

  const handleCloseDialog = () => {
    if (createMutation.isPending || updateMutation.isPending) return;
    setDialogOpen(false);
    if (dialogMode === 'edit') {
      setSelectedGroup(null);
    }
  };

  const handleSubmitGroup = async (values: { name: string; description: string }) => {
    try {
      if (dialogMode === 'create') {
        await createMutation.mutateAsync(values);
        enqueueSnackbar(tx('clients.groups.toasts.created'), { variant: 'success' });
      } else if (selectedGroup) {
        await updateMutation.mutateAsync({ id: selectedGroup.id, ...values });
        enqueueSnackbar(tx('clients.groups.toasts.updated'), { variant: 'success' });
      }
      setDialogOpen(false);
      setSelectedGroup(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAskDelete = () => {
    closeActions(false);
    setDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    if (deleteMutation.isPending) return;
    setDeleteOpen(false);
    setSelectedGroup(null);
  };

  const handleDelete = async () => {
    if (!selectedGroup) return;
    try {
      await deleteMutation.mutateAsync(selectedGroup.id);
      enqueueSnackbar(tx('clients.groups.toasts.deleted'), { variant: 'success' });
      handleCloseDelete();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('common.navigation.clients')}
        links={[
          { name: tx('common.navigation.clients'), href: paths.clients.root },
          { name: tx('clients.tabs.groups'), href: paths.clients.groups },
        ]}
        action={
          <Can page="clients" action="write">
            <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={handleOpenCreate}>
              {tx('clients.groups.addButton')}
            </Button>
          </Can>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ClientsTabs value="groups" />

      {showInitialLoader ? (
        <ClientGroupsListSkeleton headLabel={tableHead} />
      ) : (
        <Card>
          {isFetching && data ? <LinearProgress sx={{ borderRadius: 1 }} color="inherit" /> : <Box sx={{ height: 4 }} />}

          <Stack spacing={2} sx={{ p: 2 }}>
            <TextField
              size="small"
              placeholder={tx('clients.groups.searchPlaceholder')}
              value={searchValue}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ maxWidth: 360 }}
            />

            <Scrollbar>
              <Table size="small">
                <TableHeadCustom headLabel={tableHead} rowCount={rows.length} />
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Link component={RouterLink} href={paths.clients.groupsDetails(row.id)} variant="subtitle2">
                          {row.name}
                        </Link>
                      </TableCell>
                      <TableCell>{row.clientsCount}</TableCell>
                      <TableCell>{fDateTime(row.createdAt)}</TableCell>
                      <TableCell align="right">
                        <Can page="clients" action="write">
                          <IconButton color="default" onClick={(event) => openActions(event, row)}>
                            <Iconify icon="eva:more-vertical-fill" />
                          </IconButton>
                        </Can>
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

      <CustomPopover open={actionsPopover.open} onClose={() => closeActions()} sx={{ width: 220, p: 1 }}>
        <MenuItem onClick={handleOpenEdit}>
          <Iconify icon="solar:pen-bold" />
          {tx('common.actions.edit')}
        </MenuItem>
        <MenuItem onClick={handleAskDelete} sx={{ color: 'error.main' }}>
          <Iconify icon="solar:trash-bin-trash-bold" />
          {tx('common.actions.delete')}
        </MenuItem>
      </CustomPopover>

      <Can page="clients" action="write">
        <GroupUpsertDialog
          open={dialogOpen}
          mode={dialogMode}
          group={selectedGroup}
          loading={createMutation.isPending || updateMutation.isPending}
          onClose={handleCloseDialog}
          onSubmit={handleSubmitGroup}
        />
      </Can>

      <Can page="clients" action="write">
        <ConfirmDialog
          open={deleteOpen}
          onClose={handleCloseDelete}
          title={tx('clients.groups.dialogs.deleteTitle')}
          content={tx('clients.groups.dialogs.deleteDescription')}
          cancelText={tx('common.actions.cancel')}
          action={
            <Button color="error" variant="contained" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {tx('common.actions.delete')}
            </Button>
          }
        />
      </Can>
    </>
  );
}
