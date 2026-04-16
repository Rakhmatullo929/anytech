import { useMemo, useState, type MouseEvent } from 'react';
import { useDebounce } from 'src/hooks/use-debounce';
import { useUrlListState, useSyncTableWithUrlListState } from 'src/hooks/use-url-query-state';
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
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
// utils
import { fDateTime } from 'src/utils/format-time';
// routes
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hook';
import { RouterLink } from 'src/routes/components';
// components
import Scrollbar from 'src/components/scrollbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { ConfirmDialog } from 'src/components/custom-dialog';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { useAppUserProfile } from 'src/hooks/use-app-user-profile';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import { useCheckPermission } from 'src/auth/hooks/use-check-permission';
import Can from 'src/auth/components/can';

import {
  useDeleteTenantUserMutation,
  useImpersonateTenantUserMutation,
  useTenantUsersListQuery,
} from './api';
import { UserRoleLabel } from './components';
import AdminTabs from './components/admin-tabs';
import { UsersListSkeleton } from './skeleton';

export default function UsersView() {
  const { tx } = useLocales();
  const router = useRouter();
  const { canWritePage, canDetailPage } = useCheckPermission();
  const { enqueueSnackbar } = useSnackbar();
  const { user: currentUser } = useAppUserProfile();
  const actionsPopover = usePopover();
  const deleteMutation = useDeleteTenantUserMutation();
  const impersonateMutation = useImpersonateTenantUserMutation();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const tableHead = useMemo(
    () => [
      { id: 'name', label: tx('common.table.name') },
      { id: 'phone', label: tx('common.table.phone') },
      { id: 'email', label: tx('common.table.email') },
      { id: 'role', label: tx('users.table.role') },
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

  const table = useTable({
    defaultCurrentPage: Math.max(0, pageParam - 1),
    defaultRowsPerPage: rowsPerPage,
  });
  const page = Math.max(0, pageParam - 1);

  const { data, isPending, isFetching } = useTenantUsersListQuery({
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

  const handleImpersonate = async (targetUserId: string) => {
    try {
      await impersonateMutation.mutateAsync(targetUserId);
      enqueueSnackbar(tx('users.toasts.loginAsSuccess'), { variant: 'success' });
      router.replace(paths.pos);
    } catch (error) {
      console.error(error);
    }
  };

  const openActions = (event: MouseEvent<HTMLElement>, userId: string) => {
    setSelectedUserId(userId);
    actionsPopover.onOpen(event);
  };

  const closeActions = (clearSelected = true) => {
    actionsPopover.onClose();
    if (clearSelected) {
      setSelectedUserId(null);
    }
  };

  const handleEdit = () => {
    if (!selectedUserId) return;
    router.push(paths.admin.users.edit(selectedUserId));
    closeActions(false);
  };

  const handleAskDelete = () => {
    closeActions(false);
    setDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteOpen(false);
    setSelectedUserId(null);
  };

  const handleDelete = async () => {
    if (!selectedUserId) return;
    try {
      await deleteMutation.mutateAsync(selectedUserId);
      enqueueSnackbar(tx('users.toasts.deleted'), { variant: 'success' });
    } catch (error) {
      console.error(error);
    } finally {
      handleCloseDelete();
    }
  };

  const deletingCurrent =
    deleteMutation.isPending && selectedUserId !== null && deleteMutation.variables === selectedUserId;
  const canWriteUsers = canWritePage('users');
  const canDetailUsers = canDetailPage('users');

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('common.navigation.admin')}
        links={[
          { name: tx('common.navigation.admin'), href: paths.admin.users.root },
          { name: tx('admin.tabs.users'), href: paths.admin.users.root },
        ]}
        action={
          <Can page="users" action="write">
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => router.push(paths.admin.users.create)}
            >
              {tx('users.addButton')}
            </Button>
          </Can>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <AdminTabs value="users" />

      {showInitialLoader ? (
        <UsersListSkeleton headLabel={tableHead} />
      ) : (
        <Card>
          {isFetching && data ? (
            <LinearProgress sx={{ borderRadius: 1 }} color="inherit" />
          ) : (
            <Box sx={{ height: 4 }} />
          )}

          <Stack spacing={2} sx={{ p: 2 }}>
            <TextField
              size="small"
              placeholder={tx('users.searchPlaceholder')}
              value={searchValue}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ maxWidth: 360 }}
            />

            <Scrollbar>
              <Table size="small">
                <TableHeadCustom headLabel={tableHead} rowCount={rows.length} />
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Can page="users" action="detail" fallback={row.name || '-'}>
                          <Link component={RouterLink} href={paths.admin.users.details(row.id)} variant="subtitle2">
                            {row.name || '-'}
                          </Link>
                        </Can>
                      </TableCell>
                      <TableCell>{row.phone || '-'}</TableCell>
                      <TableCell>{row.email || '-'}</TableCell>
                      <TableCell>
                        <UserRoleLabel role={row.role} label={tx(`users.roles.${row.role}`)} />
                      </TableCell>
                      <TableCell>{fDateTime(row.createdAt)}</TableCell>
                      <TableCell align="right">
                        {canDetailUsers || canWriteUsers ? (
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

      <CustomPopover open={actionsPopover.open} onClose={() => closeActions()} sx={{ width: 220, p: 1 }}>
        <Can page="users" action="detail">
          <MenuItem
            onClick={() => {
              if (selectedUserId) {
                router.push(paths.admin.users.details(selectedUserId));
              }
              closeActions();
            }}
          >
            <Iconify icon="solar:eye-bold" />
            {tx('common.actions.view')}
          </MenuItem>
        </Can>
        {canWriteUsers && selectedUserId !== currentUser.id && (
          <MenuItem
            onClick={() => {
              if (selectedUserId) {
                handleImpersonate(selectedUserId);
              }
              closeActions();
            }}
            disabled={impersonateMutation.isPending}
          >
            <Iconify icon="solar:login-3-bold" />
            {tx('users.actions.loginAs')}
          </MenuItem>
        )}
        <Can page="users" action="write">
          <MenuItem onClick={handleEdit}>
            <Iconify icon="solar:pen-bold" />
            {tx('common.actions.edit')}
          </MenuItem>
        </Can>
        <Can page="users" action="write">
          <MenuItem
            onClick={handleAskDelete}
            sx={{ color: 'error.main' }}
            disabled={selectedUserId === currentUser.id}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            {tx('common.actions.delete')}
          </MenuItem>
        </Can>
      </CustomPopover>

      <Can page="users" action="write">
        <ConfirmDialog
          open={deleteOpen}
          onClose={handleCloseDelete}
          title={tx('users.dialogs.delete.title')}
          content={tx('users.dialogs.delete.description')}
          cancelText={tx('common.actions.cancel')}
          action={
            <Button color="error" variant="contained" onClick={handleDelete} disabled={deletingCurrent}>
              {tx('common.actions.delete')}
            </Button>
          }
        />
      </Can>
    </>
  );
}
