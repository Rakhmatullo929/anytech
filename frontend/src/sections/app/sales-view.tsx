import { useMemo, useState } from 'react';
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

const TABLE_HEAD = [
  { id: 'id', label: 'Продажа' },
  { id: 'client', label: 'Клиент' },
  { id: 'total', label: 'Сумма' },
  { id: 'pay', label: 'Оплата' },
  { id: 'date', label: 'Дата' },
];

const PAY_LABEL: Record<string, string> = {
  cash: 'Наличные',
  card: 'Карта',
  debt: 'В долг',
};

export default function SalesView() {
  const [rows] = useState(() => [...MOCK_SALES]);
  const table = useTable({ defaultRowsPerPage: 10 });

  const paginated = useMemo(
    () => rows.slice(table.page * table.rowsPerPage, table.page * table.rowsPerPage + table.rowsPerPage),
    [rows, table.page, table.rowsPerPage]
  );

  return (
    <>
      <CustomBreadcrumbs
        heading="История продаж"
        links={[{ name: 'Продажи', href: paths.sales.root }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Stack spacing={2} sx={{ p: 2 }}>
          <Scrollbar>
            <Table size="small">
              <TableHeadCustom headLabel={TABLE_HEAD} />
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
                    <TableCell>{PAY_LABEL[row.paymentType]}</TableCell>
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
