import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import Scrollbar from 'src/components/scrollbar';
import { TableHeadCustom, TableNoData, TablePaginationCustom, useTable } from 'src/components/table';
import { useDebounce } from 'src/hooks/use-debounce';
import { useSyncTableWithUrlListState, useUrlListState } from 'src/hooks/use-url-query-state';
import { useLocales } from 'src/locales';
import { paths } from 'src/routes/paths';
import { fDateTime } from 'src/utils/format-time';

import ClientsTabs from '../components/clients-tabs';
import { useGroupsListQuery } from './api/use-groups-api';
import { ClientGroupsListSkeleton } from './skeleton';

export default function ClientGroupsView() {
  const { tx } = useLocales();

  const tableHead = useMemo(
    () => [
      { id: 'name', label: tx('clients.groups.table.name') },
      { id: 'clientsCount', label: tx('clients.groups.table.clientsCount') },
      { id: 'createdAt', label: tx('common.table.created') },
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

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('common.navigation.clients')}
        links={[
          { name: tx('common.navigation.clients'), href: paths.clients.root },
          { name: tx('clients.tabs.groups'), href: paths.clients.groups },
        ]}
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
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.clientsCount}</TableCell>
                      <TableCell>{fDateTime(row.createdAt)}</TableCell>
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
    </>
  );
}
