import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { fCurrency } from 'src/utils/format-number';
import { useLocales } from 'src/locales';
import { TableHeadCustom, TableNoData, TablePaginationCustom, TableSkeleton } from 'src/components/table';
import { useTopCategoriesQuery } from '../../api';

type Props = {
  dateFrom: string;
  dateTo: string;
};

export default function ByCategoryTable({ dateFrom, dateTo }: Props) {
  const { tx } = useLocales();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => { setPage(1); }, [dateFrom, dateTo]);

  const params = useMemo(
    () => ({ dateFrom, dateTo, page, pageSize }),
    [dateFrom, dateTo, page, pageSize]
  );
  const { data, isPending, isFetching } = useTopCategoriesQuery(params);

  const tableHead = useMemo(
    () => [
      { id: 'category', label: tx('reports.tables.category') },
      { id: 'revenue', label: tx('reports.tables.revenue') },
    ],
    [tx]
  );

  const rows = data?.results ?? [];

  return (
    <Card>
      {isFetching && !!data ? <LinearProgress sx={{ borderRadius: 1 }} /> : <Box sx={{ height: 4 }} />}
      <CardHeader title={tx('reports.charts.byCategory')} />
      <CardContent sx={{ pt: 0 }}>
        <Table size="small">
          <TableHeadCustom headLabel={tableHead} />
          <TableBody>
            {isPending && !data ? (
              Array.from({ length: pageSize }).map((_, i) => <TableSkeleton key={i} />)
            ) : (
              <>
                {rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{row.name}</Typography>
                    </TableCell>
                    <TableCell>{fCurrency(row.totalRevenue)}</TableCell>
                  </TableRow>
                ))}
                <TableNoData notFound={!rows.length} title={tx('common.table.noData')} />
              </>
            )}
          </TableBody>
        </Table>
        <TablePaginationCustom
          count={data?.count ?? 0}
          page={page - 1}
          rowsPerPage={pageSize}
          rowsPerPageOptions={[5, 10, 20, 50]}
          onPageChange={(_, newPage) => setPage(newPage + 1)}
          onRowsPerPageChange={(e) => {
            setPageSize(parseInt(e.target.value, 10));
            setPage(1);
          }}
        />
      </CardContent>
    </Card>
  );
}
