import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import LinearProgress from '@mui/material/LinearProgress';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import Can from 'src/auth/components/can';
import { useCheckPermission } from 'src/auth/hooks/use-check-permission';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { ConfirmDialog } from 'src/components/custom-dialog';
import EmptyContent from 'src/components/empty-content';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { useSnackbar } from 'src/components/snackbar';
import {
  TableHeadCustom,
  TableNoData,
  TablePaginationCustom,
  TableSelectedAction,
  useTable,
} from 'src/components/table';
import EntityDetailHeader from 'src/sections/app/components/entity-detail-header';
import { useBoolean } from 'src/hooks/use-boolean';
import { useDebounce } from 'src/hooks/use-debounce';
import { useSyncTableWithUrlListState, useUrlListState } from 'src/hooks/use-url-query-state';
import { useLocales } from 'src/locales';
import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';
import { fDateTime } from 'src/utils/format-time';

import { useClientsListQuery } from '../../api/use-clients-api';
import ClientsTabs from '../../components/clients-tabs';
import { AddClientsDialog } from '../components';
import {
  useAddClientsToGroupMutation,
  useGroupDetailQuery,
  useRemoveClientsFromGroupMutation,
} from '../api/use-groups-api';
import { ClientGroupDetailsSkeleton } from '../skeleton';

export default function ClientGroupDetailsView() {
  const { tx } = useLocales();
  const { enqueueSnackbar } = useSnackbar();
  const { canWritePage } = useCheckPermission();
  const { id = '' } = useParams();
  const { data, isPending } = useGroupDetailQuery(id);
  const addClientsMutation = useAddClientsToGroupMutation();
  const removeClientsMutation = useRemoveClientsFromGroupMutation();
  const addClientsDialog = useBoolean();
  const removeConfirmDialog = useBoolean();

  const canWrite = canWritePage('clients');

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
  const { selected: selectedIds } = table;

  const clientsQuery = useClientsListQuery({
    page: page + 1,
    pageSize: rowsPerPage,
    search: debouncedSearch || undefined,
    ordering,
    groupId: id,
  });

  useSyncTableWithUrlListState({
    page: pageParam,
    rowsPerPage,
    tablePage: table.page,
    tableRowsPerPage: table.rowsPerPage,
    setTablePage: table.setPage,
    setTableRowsPerPage: table.setRowsPerPage,
  });

  const rows = clientsQuery.data?.results ?? [];
  const total = clientsQuery.data?.count ?? 0;

  const tableHead = useMemo(
    () => [
      { id: 'name', label: tx('common.table.client') },
      { id: 'phone', label: tx('common.table.phone') },
    ],
    [tx]
  );

  const handleAddClients = async (clientIds: string[]) => {
    try {
      await addClientsMutation.mutateAsync({ groupId: id, clientIds });
      enqueueSnackbar(
        tx('clients.groups.addClientsDialog.successToast', { count: clientIds.length }),
        { variant: 'success' }
      );
      addClientsDialog.onFalse();
    } catch {
      // Global error handler inside useMutate shows the snackbar.
    }
  };

  const handleRemoveFromGroup = async () => {
    try {
      await removeClientsMutation.mutateAsync({ groupId: id, clientIds: selectedIds });
      enqueueSnackbar(
        tx('clients.groups.removeClientsDialog.successToast', { count: selectedIds.length }),
        { variant: 'success' }
      );
      table.setSelected([]);
      removeConfirmDialog.onFalse();
    } catch {
      // Global error handler inside useMutate shows the snackbar.
    }
  };

  if (isPending) {
    return <ClientGroupDetailsSkeleton />;
  }

  if (!data) {
    return <EmptyContent filled title={tx('clients.groups.notFound')} />;
  }

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('clients.groups.detailTitle')}
        links={[
          { name: tx('common.navigation.clients'), href: paths.clients.root },
          { name: tx('clients.tabs.groups'), href: paths.clients.groups },
          { name: data.name, href: paths.clients.groupsDetails(data.id) },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ClientsTabs value="groups" />

      <Stack spacing={3}>
        <EntityDetailHeader
          title={data.name}
          description={data.description || tx('clients.groups.emptyDescription')}
          icon="solar:users-group-rounded-bold"
          chips={[
            {
              icon: 'solar:user-id-bold',
              label: tx('clients.groups.clientsCount', { count: data.clientsCount }),
              variant: 'soft',
            },
            {
              icon: 'solar:calendar-mark-bold',
              label: fDateTime(data.createdAt),
              variant: 'outlined',
            },
          ]}
        />

        <Card sx={{ p: 2 }}>
          <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
            sx={{ px: 2, pt: 1 }}
          >
            <Stack spacing={0.5}>
              <Typography variant="subtitle1">{tx('clients.groups.clientsListTitle')}</Typography>
              <Typography variant="body2" color="text.secondary">
                {tx('clients.groups.clientsListHint')}
              </Typography>
            </Stack>

            <Can page="clients" action="write">
              <Button
                variant="contained"
                size="small"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={addClientsDialog.onTrue}
                sx={{ flexShrink: 0 }}
              >
                {tx('clients.groups.addClientsButton')}
              </Button>
            </Can>
          </Stack>

          {clientsQuery.isFetching && clientsQuery.data ? (
            <LinearProgress sx={{ borderRadius: 1 }} color="inherit" />
          ) : (
            <Box sx={{ height: 4 }} />
          )}

          <Stack spacing={2} sx={{ pt: 2 }}>
            <Can page="clients" action="write">
              <TableSelectedAction
                numSelected={selectedIds.length}
                rowCount={rows.length}
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(checked, rows.map((r) => r.id))
                }
                action={
                  <Button color="error" onClick={removeConfirmDialog.onTrue}>
                    {tx('clients.groups.removeClientsButton')}
                  </Button>
                }
              />
            </Can>

            <TextField
              size="small"
              placeholder={tx('clients.searchPlaceholder')}
              value={searchValue}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ maxWidth: 360, px: 2 }}
            />

            <Scrollbar>
              <Table size="small">
                <TableHeadCustom
                  headLabel={tableHead}
                  rowCount={rows.length}
                  numSelected={selectedIds.length}
                  onSelectAllRows={
                    canWrite
                      ? (checked) => table.onSelectAllRows(checked, rows.map((r) => r.id))
                      : undefined
                  }
                />
                <TableBody>
                  {rows.map((client) => (
                    <TableRow key={client.id} hover selected={selectedIds.includes(client.id)}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(client.id)}
                          onClick={() => table.onSelectRow(client.id)}
                          disabled={!canWrite}
                        />
                      </TableCell>
                      <TableCell>
                        <Can
                          page="clients"
                          action="detail"
                          fallback={
                            <Typography variant="subtitle2">{client.name}</Typography>
                          }
                        >
                          <Link
                            component={RouterLink}
                            href={paths.clients.details(client.id)}
                            variant="subtitle2"
                          >
                            {client.name}
                          </Link>
                        </Can>
                      </TableCell>
                      <TableCell>{client.phone}</TableCell>
                    </TableRow>
                  ))}
                  <TableNoData notFound={!rows.length} title={tx('common.table.noData')} />
                </TableBody>
              </Table>
            </Scrollbar>

            <Stack sx={{ px: 2, pb: 2 }}>
              <TablePaginationCustom
                count={total}
                page={page}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[5, 10, 15, 25]}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
              />
            </Stack>
          </Stack>
        </Card>
      </Stack>

      <Can page="clients" action="write">
        <AddClientsDialog
          open={addClientsDialog.value}
          groupId={id}
          loading={addClientsMutation.isPending}
          onClose={addClientsDialog.onFalse}
          onSubmit={handleAddClients}
        />
      </Can>

      <Can page="clients" action="write">
        <ConfirmDialog
          open={removeConfirmDialog.value}
          onClose={removeConfirmDialog.onFalse}
          title={tx('clients.groups.removeClientsDialog.title')}
          content={tx('clients.groups.removeClientsDialog.description', {
            count: selectedIds.length,
          })}
          cancelText={tx('common.actions.cancel')}
          action={
            <Button
              color="error"
              variant="contained"
              onClick={handleRemoveFromGroup}
              disabled={removeClientsMutation.isPending}
            >
              {tx('clients.groups.removeClientsButton')}
            </Button>
          }
        />
      </Can>
    </>
  );
}
