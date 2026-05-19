import { useMemo, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { fCurrency } from 'src/utils/format-number';
import { useLocales } from 'src/locales';
import { TableHeadCustom, TableNoData, TablePaginationCustom, TableSkeleton } from 'src/components/table';
import { useTopDebtorsQuery } from '../api';
import ReportChartCard from './report-chart-card';

export default function TopDebtorsPaginatedTable() {
  const { tx } = useLocales();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const params = useMemo(() => ({ page, pageSize }), [page, pageSize]);
  const { data, isPending, isFetching } = useTopDebtorsQuery(params);

  const tableHead = useMemo(
    () => [
      { id: 'rank', label: tx('reports.tables.rank') },
      { id: 'name', label: tx('reports.tables.name') },
      { id: 'phone', label: tx('reports.tables.phone') },
      { id: 'remaining', label: tx('reports.tables.remaining') },
    ],
    [tx]
  );

  const rows = data?.results ?? [];

  return (
    <ReportChartCard
      title={tx('reports.tables.topDebtors')}
      isFetching={isFetching}
      hasPreviousData={!!data}
      contentSx={{ pt: 0 }}
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
                    <Typography variant="subtitle2">{row.name || '—'}</Typography>
                  </TableCell>
                  <TableCell>{row.phone || '—'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="error.main" fontWeight={600}>
                      {fCurrency(row.remaining)}
                    </Typography>
                  </TableCell>
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
