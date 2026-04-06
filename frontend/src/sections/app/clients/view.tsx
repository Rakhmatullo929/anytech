import { useMemo, useState, useEffect, type MouseEvent } from 'react';
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
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import LinearProgress from '@mui/material/LinearProgress';
// utils
import { fDateTime } from 'src/utils/format-time';
// routes
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hook';
import { RouterLink } from 'src/routes/components';
// components
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import { useSnackbar } from 'src/components/snackbar';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { useClientsListQuery } from 'src/sections/app/clients/api/use-clients-api';
import { ClientsListSkeleton } from 'src/sections/app/clients/skeleton';

// ----------------------------------------------------------------------

export default function ClientsView() {
  const { tx } = useLocales();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const actionsPopover = usePopover();

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
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

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

  const closeActions = () => {
    actionsPopover.onClose();
    setSelectedClientId(null);
  };

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
    closeActions();
    enqueueSnackbar('Edit will be connected soon.', { variant: 'info' });
  };

  const handleDelete = () => {
    closeActions();
    enqueueSnackbar('Delete will be connected soon.', { variant: 'info' });
  };

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('layout.nav.clients')}
        links={[{ name: tx('layout.nav.clients'), href: paths.clients.root }]}
        sx={{ mb: { xs: 3, md: 5 } }}
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
            <TextField
              size="small"
              placeholder={tx('pages.clients.search_placeholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{ maxWidth: 360 }}
            />

            <Scrollbar>
              <Table size="small">
                <TableHeadCustom headLabel={tableHead} />
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
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
              onPageChange={onChangePage}
              onRowsPerPageChange={onChangeRowsPerPage}
            />
          </Stack>
        </Card>
      )}

      <CustomPopover open={actionsPopover.open} onClose={closeActions} sx={{ width: 180, p: 1 }}>
        <MenuItem onClick={handleView}>
          <Iconify icon="solar:eye-bold" />
          View
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <Iconify icon="solar:pen-bold" />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Iconify icon="solar:trash-bin-trash-bold" />
          Delete
        </MenuItem>
      </CustomPopover>
    </>
  );
}
