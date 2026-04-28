import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
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
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content';
import Scrollbar from 'src/components/scrollbar';
import { TableHeadCustom, TableNoData, TablePaginationCustom, useTable } from 'src/components/table';
import EntityDetailHeader from 'src/sections/app/components/entity-detail-header';
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
                      <Can
                        page="clients"
                        action="detail"
                        fallback={<Typography variant="subtitle2">{client.name}</Typography>}
                      >
                        <Link component={RouterLink} href={paths.clients.details(client.id)} variant="subtitle2">
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
    </>
  );
}
