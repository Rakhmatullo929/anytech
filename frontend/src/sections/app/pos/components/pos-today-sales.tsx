import { useCallback, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import LinearProgress from '@mui/material/LinearProgress';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { useCheckPermission } from 'src/auth/hooks/use-check-permission';
import { useLocales } from 'src/locales';
import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';
import { fCurrency } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';
import Scrollbar from 'src/components/scrollbar';
import {
  TableHeadCustom,
  TableNoData,
  TablePaginationCustom,
} from 'src/components/table';
import { useSalesListQuery } from 'src/sections/app/sales/api';

// ----------------------------------------------------------------------

function getTodayStr(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

// ----------------------------------------------------------------------

export default function PosTodaySales() {
  const { tx } = useLocales();
  const { canDetailPage } = useCheckPermission();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Stable for the lifetime of the component — today won't change mid-session.
  const today = useMemo(getTodayStr, []);

  const { data, isFetching } = useSalesListQuery({
    page: page + 1,
    pageSize: rowsPerPage,
    ordering: '-created_at',
    dateFrom: today,
    dateTo: today,
  });

  const rows = useMemo(() => data?.results ?? [], [data?.results]);
  const total = data?.count ?? 0;
  const canDetailSales = canDetailPage('sales');

  const tableHead = useMemo(
    () => [
      { id: 'id', label: tx('common.table.saleId') },
      { id: 'client', label: tx('common.table.client') },
      { id: 'created_by', label: tx('common.table.createdBy') },
      { id: 'total', label: tx('common.table.total') },
      { id: 'pay', label: tx('common.table.pay') },
      { id: 'date', label: tx('common.table.date') },
    ],
    [tx]
  );

  const payLabel = useMemo(
    () => ({
      cash: tx('common.payment.cash'),
      card: tx('common.payment.card'),
      transfer: tx('common.payment.transfer'),
      debt: tx('common.payment.debt'),
    }),
    [tx]
  );

  const handlePageChange = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(e.target.value, 10));
      setPage(0);
    },
    []
  );

  return (
    <Card sx={{ borderRadius: { xs: 0, md: 2 }, '@media (max-width: 899px)': { boxShadow: 'none' } }}>
      {isFetching && data ? (
        <LinearProgress sx={{ borderRadius: 1 }} color="inherit" />
      ) : (
        <Box sx={{ height: 4 }} />
      )}

      <Stack spacing={2} sx={{ p: 2 }}>
        <Typography variant="h6">{tx('pos.todaySales.heading')}</Typography>

        <Scrollbar>
          <Table size="small">
            <TableHeadCustom headLabel={tableHead} />
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    {canDetailSales ? (
                      <Link
                        component={RouterLink}
                        href={paths.sales.details(row.id)}
                        variant="subtitle2"
                      >
                        {row.id}
                      </Link>
                    ) : (
                      row.id
                    )}
                  </TableCell>
                  <TableCell>{row.clientName || '-'}</TableCell>
                  <TableCell>{row.createdByName || '-'}</TableCell>
                  <TableCell>{fCurrency(row.totalAmount)}</TableCell>
                  <TableCell>{payLabel[row.paymentType]}</TableCell>
                  <TableCell>{fDateTime(row.createdAt)}</TableCell>
                </TableRow>
              ))}
              <TableNoData notFound={!rows.length} title={tx('pos.todaySales.empty')} />
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
  );
}
