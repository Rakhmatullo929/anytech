import { useMemo, useState } from 'react';
import { useLocales } from 'src/locales';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';
import { useCheckPermission } from 'src/auth/hooks/use-check-permission';
import { TableHeadCustom, TableNoData, TablePaginationCustom } from 'src/components/table';
import { fCurrency } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';
import { useSalesListQuery } from 'src/sections/app/sales/api';

type Props = {
  clientId: string;
};

export default function PurchasesTabPanel({ clientId }: Props) {
  const { tx } = useLocales();
  const { canDetailPage } = useCheckPermission();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const canDetailSales = canDetailPage('sales');

  const tableHead = useMemo(
    () => [
      { id: 'id', label: tx('common.table.saleId') },
      { id: 'pay', label: tx('common.table.pay') },
      { id: 'total', label: tx('common.table.total') },
      { id: 'date', label: tx('common.table.date') },
    ],
    [tx]
  );

  const payLabel: Record<string, string> = useMemo(
    () => ({
      cash: tx('common.payment.cash'),
      card: tx('common.payment.card'),
      transfer: tx('common.payment.transfer'),
      debt: tx('common.payment.debt'),
    }),
    [tx]
  );

  const { data, isPending } = useSalesListQuery({ page, pageSize: rowsPerPage, clientId });

  const rows = data?.results ?? [];
  const total = data?.count ?? 0;

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage + 1);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = parseInt(event.target.value, 10);
    if (Number.isInteger(next) && next > 0) {
      setRowsPerPage(next);
      setPage(1);
    }
  };

  return (
    <Card sx={{ p: 2.25 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {tx('clients.detail.purchaseHistory')}
      </Typography>
      <Divider sx={{ mb: 1.5 }} />
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
              <TableCell>
                <Chip
                  size="small"
                  variant="soft"
                  label={payLabel[row.paymentType] ?? row.paymentType}
                  color={row.paymentType === 'debt' ? 'warning' : 'default'}
                />
              </TableCell>
              <TableCell>{fCurrency(row.totalAmount)}</TableCell>
              <TableCell>{fDateTime(row.createdAt)}</TableCell>
            </TableRow>
          ))}
          <TableNoData notFound={!isPending && !rows.length} title={tx('common.table.noData')} />
        </TableBody>
      </Table>
      <TablePaginationCustom
        count={total}
        page={page - 1}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 15, 25]}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </Card>
  );
}
