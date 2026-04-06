import { useMemo, useState } from 'react';
// @mui
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
// utils
import { fCurrency } from 'src/utils/format-number';
// mock
import { MOCK_DEBTS, type MockDebt } from 'src/_mock/pos-app';
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
  { id: 'client', label: 'Клиент' },
  { id: 'total', label: 'Сумма' },
  { id: 'paid', label: 'Оплачено' },
  { id: 'rem', label: 'Остаток' },
  { id: 'status', label: 'Статус' },
];

export default function DebtsView() {
  const [rows] = useState<MockDebt[]>(() => [...MOCK_DEBTS]);
  const [status, setStatus] = useState<'all' | 'active' | 'closed'>('all');
  const table = useTable({ defaultRowsPerPage: 10 });

  const filtered = useMemo(() => {
    if (status === 'all') return rows;
    return rows.filter((r) => r.status === status);
  }, [rows, status]);

  const paginated = useMemo(
    () =>
      filtered.slice(
        table.page * table.rowsPerPage,
        table.page * table.rowsPerPage + table.rowsPerPage
      ),
    [filtered, table.page, table.rowsPerPage]
  );

  return (
    <>
      <CustomBreadcrumbs
        heading="Долги"
        links={[{ name: 'Долги', href: paths.debts.root }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Stack spacing={2} sx={{ p: 2 }}>
          <TextField
            select
            size="small"
            label="Статус"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'all' | 'active' | 'closed')}
            sx={{ maxWidth: 220 }}
          >
            <MenuItem value="all">Все</MenuItem>
            <MenuItem value="active">Активные</MenuItem>
            <MenuItem value="closed">Закрытые</MenuItem>
          </TextField>

          <Scrollbar>
            <Table size="small">
              <TableHeadCustom headLabel={TABLE_HEAD} />
              <TableBody>
                {paginated.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link component={RouterLink} href={paths.debts.details(row.id)} variant="subtitle2">
                        {row.clientName}
                      </Link>
                    </TableCell>
                    <TableCell>{fCurrency(row.totalAmount)}</TableCell>
                    <TableCell>{fCurrency(row.paidAmount)}</TableCell>
                    <TableCell>{fCurrency(row.remaining)}</TableCell>
                    <TableCell>{row.status === 'active' ? 'Активен' : 'Закрыт'}</TableCell>
                  </TableRow>
                ))}
                <TableNoData notFound={!paginated.length} />
              </TableBody>
            </Table>
          </Scrollbar>

          <TablePaginationCustom
            count={filtered.length}
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
