import { useMemo, useState, useEffect, type MouseEvent } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import LinearProgress from '@mui/material/LinearProgress';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { fDateTime } from 'src/utils/format-time';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hook';
import { useDebounce } from 'src/hooks/use-debounce';
import { useUrlListState, useSyncTableWithUrlListState } from 'src/hooks/use-url-query-state';
import { useCheckPermission } from 'src/auth/hooks/use-check-permission';
import Can from 'src/auth/components/can';
import { useLocales } from 'src/locales';
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

import { ClientsTabs, type ClientsTabValue } from 'src/sections/app/clients/components';

import {
  useGroupsListQuery,
  useDeleteGroupMutation,
  useBulkDeleteGroupsMutation,
} from './api/use-groups-api';
import type { Group } from './api/types';
import { GroupsListSkeleton } from './skeleton';
import { GroupUpsertDialog } from './components';

// ----------------------------------------------------------------------

export default function GroupsView() {
  const { tx } = useLocales();
  const router = useRouter();
  const { canWritePage } = useCheckPermission();
  const { enqueueSnackbar } = useSnackbar();
  const actionsPopover = usePopover();
  const deleteMutation = useDeleteGroupMutation();
  const bulkDeleteMutation = useBulkDeleteGroupsMutation();

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const tableHead = useMemo(
    () => [
      { id: 'name', label: tx('clients.groups.table.name') },
      { id: 'clientCount', label: tx('clients.groups.table.clients') },
      { id: 'createdAt', label: tx('clients.groups.table.created') },
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
  const page = Math.max(0, pageParam - 1);

  const table = useTable({
    defaultCurrentPage: page,
    defaultRowsPerPage: rowsPerPage,
  });
  const { setPage, setRowsPerPage } = table;
  const { selected: selectedIds, setSelected } = table;

  const { data, isPending, isFetching } = useGroupsListQuery({
    page: page + 1,
    pageSize: rowsPerPage,
    search: debouncedSearch || undefined,
    ordering,
  });

  const rows = useMemo(() => data?.results ?? [], [data?.results]);
  const total = data?.count ?? 0;
  const showInitialLoader = isPending && !data;

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

  const handleCloseActions = () => {
    actionsPopover.onClose();
    setSelectedGroupId(null);
  };

  const openActions = (event: MouseEvent<HTMLElement>, groupId: string) => {
    setSelectedGroupId(groupId);
    actionsPopover.onOpen(event);
  };

  const handleOpenCreate = () => {
    setEditingGroup(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = () => {
    const group = rows.find((r) => r.id === selectedGroupId) ?? null;
    setEditingGroup(group);
    actionsPopover.onClose();
    setSelectedGroupId(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingGroup(null);
  };

  const handleAskDelete = () => {
    actionsPopover.onClose();
    setDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteOpen(false);
    setSelectedGroupId(null);
  };

  const handleDelete = async () => {
    if (!selectedGroupId) return;
    try {
      await deleteMutation.mutateAsync(selectedGroupId);
      enqueueSnackbar(tx('clients.groups.toasts.deleted'), { variant: 'success' });
    } catch {
      // handled globally
    } finally {
      handleCloseDelete();
    }
  };

  const handleOpenBulkDelete = () => setBulkDeleteOpen(true);
  const handleCloseBulkDelete = () => setBulkDeleteOpen(false);

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    try {
      await bulkDeleteMutation.mutateAsync(selectedIds);
      enqueueSnackbar(tx('clients.groups.toasts.bulkDeleted', { count: selectedIds.length }), {
        variant: 'success',
      });
      table.onUpdatePageDeleteRows({
        totalRows: total,
        totalRowsInPage: rows.length,
        totalRowsFiltered: total,
      });
      table.setSelected([]);
      handleCloseBulkDelete();
    } catch {
      // handled globally
    }
  };

  const tabLabels: Record<ClientsTabValue, string> = {
    clients: tx('clients.tabs.clients'),
    groups: tx('clients.tabs.groups'),
  };
  const handleTabChange = (nextTab: ClientsTabValue) => {
    router.push(nextTab === 'clients' ? paths.clients.root : paths.clients.groups);
  };

  const canWrite = canWritePage('clients');
  const deletingCurrent =
    deleteMutation.isPending &&
    selectedGroupId !== null &&
    deleteMutation.variables === selectedGroupId;
  const deletingBulk = bulkDeleteMutation.isPending;

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('clients.tabs.groups')}
        links={[
          { name: tx('common.navigation.clients'), href: paths.clients.root },
          { name: tx('clients.tabs.groups'), href: paths.clients.groups },
        ]}
        action={
          <Stack direction="row" spacing={1}>
            <Can page="clients" action="write">
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={handleOpenCreate}
              >
                {tx('clients.groups.addButton')}
              </Button>
            </Can>
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ClientsTabs value="groups" onChange={handleTabChange} labels={tabLabels} />

      {showInitialLoader ? (
        <GroupsListSkeleton headLabel={tableHead} />
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
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    rows.map((row) => row.id)
                  )
                }
                action={
                  <Button color="error" onClick={handleOpenBulkDelete}>
                    {tx('common.actions.delete')}
                  </Button>
                }
              />
            </Can>

            <TextField
              size="small"
              placeholder={tx('clients.groups.searchPlaceholder')}
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
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      rows.map((row) => row.id)
                    )
                  }
                />
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} hover selected={selectedIds.includes(row.id)}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(row.id)}
                          onClick={() => table.onSelectRow(row.id)}
                          disabled={!canWrite}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">{row.name}</Typography>
                      </TableCell>
                      <TableCell>{row.clientCount}</TableCell>
                      <TableCell>{fDateTime(row.createdAt)}</TableCell>
                      <TableCell align="right">
                        {canWrite ? (
                          <IconButton
                            color="default"
                            onClick={(event) => openActions(event, row.id)}
                          >
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

      <CustomPopover
        open={actionsPopover.open}
        onClose={handleCloseActions}
        sx={{ width: 180, p: 1 }}
      >
        <Can page="clients" action="write">
          <MenuItem onClick={handleOpenEdit}>
            <Iconify icon="solar:pen-bold" />
            {tx('common.actions.edit')}
          </MenuItem>
        </Can>
        <Can page="clients" action="write">
          <MenuItem
            onClick={handleAskDelete}
            sx={{ color: 'error.main' }}
            disabled={deletingCurrent}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            {tx('common.actions.delete')}
          </MenuItem>
        </Can>
      </CustomPopover>

      <GroupUpsertDialog open={dialogOpen} onClose={handleCloseDialog} group={editingGroup} />

      <Can page="clients" action="write">
        <ConfirmDialog
          open={deleteOpen}
          onClose={handleCloseDelete}
          title={tx('clients.groups.dialogs.delete.title')}
          content={tx('clients.groups.dialogs.delete.description')}
          cancelText={tx('common.actions.cancel')}
          action={
            <Button
              color="error"
              variant="contained"
              onClick={handleDelete}
              disabled={deletingCurrent}
            >
              {tx('common.actions.delete')}
            </Button>
          }
        />
      </Can>

      <Can page="clients" action="write">
        <ConfirmDialog
          open={bulkDeleteOpen}
          onClose={handleCloseBulkDelete}
          title={tx('clients.groups.dialogs.delete.bulkTitle')}
          content={tx('clients.groups.dialogs.delete.bulkDescription', {
            count: selectedIds.length,
          })}
          cancelText={tx('common.actions.cancel')}
          action={
            <Button
              color="error"
              variant="contained"
              onClick={handleBulkDelete}
              disabled={deletingBulk}
            >
              {tx('common.actions.delete')}
            </Button>
          }
        />
      </Can>
    </>
  );
}
