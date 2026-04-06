import { useMemo, useState, useEffect } from 'react';
// locales
import { useLocales } from 'src/locales';
// @mui
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
// utils
import { fDateTime } from 'src/utils/format-time';
// routes
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
// components
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { useClientsListQuery } from 'src/sections/app/clients/api/use-clients-api';

// ----------------------------------------------------------------------

export default function ClientsView() {
  const { tx } = useLocales();

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
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(query.trim()), 400);
    return () => window.clearTimeout(id);
  }, [query]);

  const table = useTable({ defaultRowsPerPage: 20 });
  const { onResetPage, page, rowsPerPage, onChangePage, onChangeRowsPerPage } = table;

  useEffect(() => {
    onResetPage();
  }, [debouncedSearch, onResetPage]);

  const { data, isPending, isFetching } = useClientsListQuery({
    page: page + 1,
    pageSize: rowsPerPage,
    search: debouncedSearch || undefined,
  });

  const rows = data?.results ?? [];
  const total = data?.count ?? 0;
  const showInitialLoader = isPending && !data;

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('layout.nav.clients')}
        links={[{ name: tx('layout.nav.clients'), href: paths.clients.root }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        {isFetching && data ? (
          <LinearProgress sx={{ borderRadius: 1 }} color="inherit" />
        ) : (
          <Box sx={{ height: 4 }} />
        )}

        <Stack spacing={2} sx={{ p: 2 }}>
          <TextField
            size="small"
            placeholder={tx('pages.clients.search_placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ maxWidth: 360 }}
          />

          {showInitialLoader ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Scrollbar>
                <Table size="small">
                  <TableHeadCustom headLabel={tableHead} />
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.phone}</TableCell>
                        <TableCell>{fDateTime(row.createdAt)}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            component={RouterLink}
                            href={paths.clients.details(row.id)}
                            color="default"
                          >
                            <Iconify icon="solar:eye-bold" />
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
                onPageChange={onChangePage}
                onRowsPerPageChange={onChangeRowsPerPage}
              />
            </>
          )}
        </Stack>
      </Card>
    </>
  );
}
