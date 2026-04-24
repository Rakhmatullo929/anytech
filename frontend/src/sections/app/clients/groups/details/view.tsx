import { useMemo } from 'react';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { TableHeadCustom, TableNoData, TablePaginationCustom, useTable } from 'src/components/table';
import { useDebounce } from 'src/hooks/use-debounce';
import { useSyncTableWithUrlListState, useUrlListState } from 'src/hooks/use-url-query-state';
import { useLocales } from 'src/locales';
import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';
import { fDateTime } from 'src/utils/format-time';

import { useClientsListQuery } from '../../api/use-clients-api';
import ClientsTabs from '../../components/clients-tabs';
import { useGroupDetailQuery } from '../api/use-groups-api';
import { ClientGroupDetailsSkeleton } from '../skeleton';

export default function ClientGroupDetailsView() {
  const { tx } = useLocales();
  const { id = '' } = useParams();
  const { data, isPending } = useGroupDetailQuery(id);
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

  if (isPending) {
    return <ClientGroupDetailsSkeleton />;
  }

  if (!data) {
    return (
      <EmptyContent
        filled
        title={tx('clients.groups.notFound')}
      />
    );
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
        <Card sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar
                variant="rounded"
                sx={{
                  bgcolor: 'primary.lighter',
                  color: 'primary.main',
                  width: 44,
                  height: 44,
                }}
              >
                <Iconify icon="solar:users-group-rounded-bold" width={22} />
              </Avatar>
              <Stack spacing={0.5}>
                <Typography variant="h5">{data.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {data.description || tx('clients.groups.emptyDescription')}
                </Typography>
              </Stack>
            </Stack>

            <Divider />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
              <Chip
                icon={<Iconify icon="solar:user-id-bold" width={16} />}
                size="small"
                variant="soft"
                label={tx('clients.groups.clientsCount', { count: data.clientsCount })}
              />
              <Chip
                icon={<Iconify icon="solar:calendar-mark-bold" width={16} />}
                size="small"
                variant="outlined"
                label={fDateTime(data.createdAt)}
              />
            </Stack>
          </Stack>
        </Card>

        <Card sx={{ p: 2 }}>
          <Stack spacing={0.5} sx={{ px: 2, pt: 1 }}>
            <Typography variant="subtitle1">{tx('clients.groups.clientsListTitle')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {tx('clients.groups.clientsListHint')}
            </Typography>
          </Stack>
          {clientsQuery.isFetching && clientsQuery.data ? (
            <LinearProgress sx={{ borderRadius: 1 }} color="inherit" />
          ) : (
            <Box sx={{ height: 4 }} />
          )}
          <Stack spacing={2} sx={{ pt: 2 }}>
            <TextField
              size="small"
              placeholder={tx('clients.searchPlaceholder')}
              value={searchValue}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ maxWidth: 360, px: 2 }}
            />
          <Scrollbar>
            <Table size="small">
              <TableHeadCustom headLabel={tableHead} rowCount={rows.length} />
              <TableBody>
                {rows.map((client) => (
                  <TableRow key={client.id} hover>
                    <TableCell>
                      <Link component={RouterLink} href={paths.clients.details(client.id)} variant="subtitle2">
                        {client.name}
                      </Link>
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
    </>
  );
}
