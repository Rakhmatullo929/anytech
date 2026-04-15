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
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
// utils
import { fCurrency } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';
import {
  intParam,
  stringParam,
  useSyncTableWithUrlListState,
  useUrlQueryState,
} from 'src/hooks/use-url-query-state';
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
import { useSalesListQuery, type SalePaymentType } from 'src/sections/app/sales/api';
import { SalesListSkeleton } from 'src/sections/app/sales/skeleton';

// ----------------------------------------------------------------------

export default function SalesView() {
  const { tx } = useLocales();
  const { canDetailPage } = useCheckPermission();
  const { values, setValues } = useUrlQueryState({
    page: intParam(1),
    page_size: intParam(15),
    ordering: stringParam('-created_at'),
    payment_type: stringParam(''),
  });
  const pageParam = values.page as number;
  const rowsPerPage = values.page_size as number;
  const ordering = values.ordering as string;
  const paymentType = values.payment_type as '' | SalePaymentType;

  const table = useTable({
    defaultCurrentPage: Math.max(0, pageParam - 1),
    defaultRowsPerPage: rowsPerPage,
  });
  const { setPage, setRowsPerPage } = table;
  const page = Math.max(0, pageParam - 1);

  const tableHead = useMemo(
    () => [
      { id: 'id', label: tx('shared.table.sale_id') },
      { id: 'client', label: tx('shared.table.client') },
      { id: 'total', label: tx('shared.table.total') },
      { id: 'pay', label: tx('shared.table.pay') },
      { id: 'date', label: tx('shared.table.date') },
    ],
    [tx]
  );

  const { data, isPending, isFetching } = useSalesListQuery({
    page: page + 1,
    pageSize: rowsPerPage,
    ordering,
    paymentType: paymentType || undefined,
  });
  const rows = useMemo(() => data?.results ?? [], [data?.results]);
  const total = data?.count ?? 0;
  const showInitialLoader = isPending && !data;
  const canDetailSales = canDetailPage('sales');

  useSyncTableWithUrlListState({
    page: pageParam,
    rowsPerPage,
    tablePage: table.page,
    tableRowsPerPage: table.rowsPerPage,
    setTablePage: setPage,
    setTableRowsPerPage: setRowsPerPage,
  });

  const payLabel = useMemo(
    () => ({
      cash: tx('shared.payment.cash'),
      card: tx('shared.payment.card'),
      debt: tx('shared.payment.debt'),
    }),
    [tx]
  );
  const paymentOptions = useMemo(
    () => [
      { value: '', label: tx('pages.sales.filters.all_option') },
      { value: 'cash', label: tx('shared.payment.cash') },
      { value: 'card', label: tx('shared.payment.card') },
      { value: 'debt', label: tx('shared.payment.debt') },
    ],
    [tx]
  );

  const handlePaymentTypeChange = (nextPaymentType: '' | SalePaymentType) => {
    setValues({ payment_type: nextPaymentType, page: 1 });
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
        heading={tx('pages.sales.list_heading')}
        links={[{ name: tx('layout.nav.sales'), href: paths.sales.root }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {showInitialLoader ? (
        <SalesListSkeleton headLabel={tableHead} />
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
              label={tx('pages.sales.filters.payment_label')}
              value={paymentType}
              onChange={(event) => handlePaymentTypeChange(event.target.value as '' | SalePaymentType)}
              sx={{ maxWidth: 260 }}
            >
              {paymentOptions.map((option) => (
                <MenuItem key={option.value || 'all'} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <Scrollbar>
              <Table size="small">
                <TableHeadCustom headLabel={tableHead} />
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        {canDetailSales ? (
                          <Link component={RouterLink} href={paths.sales.details(row.id)} variant="subtitle2">
                            {row.id}
                          </Link>
                        ) : (
                          row.id
                        )}
                      </TableCell>
                      <TableCell>{row.clientName || '-'}</TableCell>
                      <TableCell>{fCurrency(row.totalAmount)}</TableCell>
                      <TableCell>{payLabel[row.paymentType]}</TableCell>
                      <TableCell>{fDateTime(row.createdAt)}</TableCell>
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
