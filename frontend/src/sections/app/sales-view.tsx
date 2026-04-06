import { useMemo, useState } from 'react';
// locales
import { useLocales } from 'src/locales';
// @mui
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Link from '@mui/material/Link';
// utils
import { fCurrency } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';
// mock
import { MOCK_SALES } from 'src/_mock/pos-app';
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

// ----------------------------------------------------------------------

export default function SalesView() {
  const { tx } = useLocales();
  const [rows] = useState(() => [...MOCK_SALES]);
  const table = useTable({ defaultRowsPerPage: 10 });

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

  const payLabel = useMemo(
    () => ({
      cash: tx('shared.payment.cash'),
      card: tx('shared.payment.card'),
      debt: tx('shared.payment.debt'),
    }),
    [tx]
  );

  const paginated = useMemo(
    () => rows.slice(table.page * table.rowsPerPage, table.page * table.rowsPerPage + table.rowsPerPage),
    [rows, table.page, table.rowsPerPage]
  );

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('pages.sales.list_heading')}
        links={[{ name: tx('layout.nav.sales'), href: paths.sales.root }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Stack spacing={2} sx={{ p: 2 }}>
          <Scrollbar>
            <Table size="small">
              <TableHeadCustom headLabel={tableHead} />
              <TableBody>
                {paginated.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link component={RouterLink} href={paths.sales.details(row.id)} variant="subtitle2">
                        {row.id}
                      </Link>
                    </TableCell>
                    <TableCell>{row.clientName}</TableCell>
                    <TableCell>{fCurrency(row.totalAmount)}</TableCell>
                    <TableCell>{payLabel[row.paymentType as keyof typeof payLabel]}</TableCell>
                    <TableCell>{fDateTime(row.createdAt)}</TableCell>
                  </TableRow>
                ))}
                <TableNoData notFound={!paginated.length} />
              </TableBody>
            </Table>
          </Scrollbar>

          <TablePaginationCustom
            count={rows.length}
            page={table.page}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Stack>
      </Card>
    </>
  );
}
