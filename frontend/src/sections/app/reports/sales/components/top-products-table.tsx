import { useEffect, useMemo, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { fCurrency, fNumber } from 'src/utils/format-number';
import { useLocales } from 'src/locales';
import { TableHeadCustom, TableNoData, TablePaginationCustom, TableSkeleton } from 'src/components/table';
import { ReportChartCard } from '../../components';
import { useTopProductsQuery } from '../../api';

type Props = {
  dateFrom: string;
  dateTo: string;
};

export default function TopProductsTable({ dateFrom, dateTo }: Props) {
  const { tx } = useLocales();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => { setPage(1); }, [dateFrom, dateTo]);

  const params = useMemo(
    () => ({ dateFrom, dateTo, page, pageSize }),
    [dateFrom, dateTo, page, pageSize]
  );
  const { data, isPending, isFetching } = useTopProductsQuery(params);

  const tableHead = useMemo(
    () => [
      { id: 'rank', label: tx('reports.tables.rank') },
      { id: 'product', label: tx('reports.tables.product') },
      { id: 'qty', label: tx('reports.tables.qtySold') },
      { id: 'revenue', label: tx('reports.tables.revenue') },
    ],
    [tx]
  );

  const rows = data?.results ?? [];

  return (
    <ReportChartCard
      title={tx('reports.tables.topProducts')}
      isFetching={isFetching}
      hasPreviousData={!!data}
      contentSx={{ pt: 0 }}
      sx={{ height: '100%' }}
    >
      <Table size="small">
        <TableHeadCustom headLabel={tableHead} />
        <TableBody>
          {isPending && !data ? (
            Array.from({ length: pageSize }).map((_, i) => <TableSkeleton key={i} />)
          ) : (
            <>
              {rows.map((row, idx) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {(page - 1) * pageSize + idx + 1}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">{row.name}</Typography>
                  </TableCell>
                  <TableCell>{fNumber(row.totalQty)}</TableCell>
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
    </ReportChartCard>
  );
}
