import { useMemo } from 'react';
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
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import LinearProgress from '@mui/material/LinearProgress';
// utils
import { fCurrency } from 'src/utils/format-number';
import { intParam, stringParam, useSyncTableWithUrlListState, useUrlQueryState } from 'src/hooks/use-url-query-state';
import { useCheckPermission } from 'src/auth/hooks/use-check-permission';
// routes
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
// components
import Scrollbar from 'src/components/scrollbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';
import { useDebtsListQuery, type DebtStatus } from 'src/sections/app/depts/api';
import { DebtsListSkeleton } from 'src/sections/app/depts/skeleton';

// ----------------------------------------------------------------------

export default function DebtsView() {
  const { tx } = useLocales();
  const { canDetailPage } = useCheckPermission();

  const tableHead = useMemo(
    () => [
      { id: 'client', label: tx('shared.table.client') },
      { id: 'total', label: tx('shared.table.total') },
      { id: 'paid', label: tx('shared.table.paid') },
      { id: 'rem', label: tx('shared.table.rem') },
      { id: 'status', label: tx('shared.table.status') },
    ],
    [tx]
  );

  const { values, setValues } = useUrlQueryState({
    page: intParam(1),
    page_size: intParam(15),
    ordering: stringParam('-created_at'),
    status: stringParam(''),
  });
  const pageParam = values.page as number;
  const rowsPerPage = values.page_size as number;
  const ordering = values.ordering as string;
  const status = values.status as '' | DebtStatus;

  const table = useTable({
    defaultCurrentPage: Math.max(0, pageParam - 1),
    defaultRowsPerPage: rowsPerPage,
  });
  const { setPage, setRowsPerPage } = table;
  const page = Math.max(0, pageParam - 1);

  const { data, isPending, isFetching } = useDebtsListQuery({
    page: page + 1,
    pageSize: rowsPerPage,
    ordering,
    status: status || undefined,
  });
  const rows = useMemo(() => data?.results ?? [], [data?.results]);
  const total = data?.count ?? 0;
  const showInitialLoader = isPending && !data;
  const canDetailDebts = canDetailPage('debts');

  useSyncTableWithUrlListState({
    page: pageParam,
    rowsPerPage,
    tablePage: table.page,
    tableRowsPerPage: table.rowsPerPage,
    setTablePage: setPage,
    setTableRowsPerPage: setRowsPerPage,
  });

  const handleStatusChange = (nextStatus: '' | DebtStatus) => {
    setValues({ status: nextStatus, page: 1 });
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setValues({ page: newPage + 1 });
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextRowsPerPage = parseInt(event.target.value, 10);
    if (!Number.isInteger(nextRowsPerPage) || nextRowsPerPage <= 0) return;
    setValues({ page_size: nextRowsPerPage, page: 1 });
  };

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('layout.nav.debts')}
        links={[{ name: tx('layout.nav.debts'), href: paths.debts.root }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {showInitialLoader ? (
        <DebtsListSkeleton headLabel={tableHead} />
      ) : (
        <Card>
          {isFetching && data ? (
            <LinearProgress sx={{ borderRadius: 1 }} color="inherit" />
          ) : (
            <Box sx={{ height: 4 }} />
          )}

          <Stack spacing={2} sx={{ p: 2 }}>
            <TextField
              select
              size="small"
              label={tx('shared.status.filter_label')}
              value={status}
              onChange={(event) => handleStatusChange(event.target.value as '' | DebtStatus)}
              sx={{ maxWidth: 220 }}
            >
              <MenuItem value="">{tx('shared.status.filter_all')}</MenuItem>
              <MenuItem value="active">{tx('shared.status.filter_active')}</MenuItem>
              <MenuItem value="closed">{tx('shared.status.filter_closed')}</MenuItem>
            </TextField>

            <Scrollbar>
              <Table size="small">
                <TableHeadCustom headLabel={tableHead} />
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        {canDetailDebts ? (
                          <Link component={RouterLink} href={paths.debts.details(row.id)} variant="subtitle2">
                            {row.clientName}
                          </Link>
                        ) : (
                          row.clientName
                        )}
                      </TableCell>
                      <TableCell>{fCurrency(row.totalAmount)}</TableCell>
                      <TableCell>{fCurrency(row.paidAmount)}</TableCell>
                      <TableCell>{fCurrency(row.remaining)}</TableCell>
                      <TableCell>
                        {row.status === 'active'
                          ? tx('shared.status.row_active')
                          : tx('shared.status.row_closed')}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableNoData notFound={!rows.length} title={tx('shared.table.no_data')} />
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
