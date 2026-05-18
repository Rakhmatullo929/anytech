import { useMemo, useState } from 'react';
import { useLocales } from 'src/locales';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';
import { fDate } from 'src/utils/format-time';
import { TableHeadCustom, TableNoData, TablePaginationCustom } from 'src/components/table';
import { useDebtsListQuery } from 'src/sections/app/depts/api';

function getDeadlineDiff(deadline: string | null): number | null {
  if (!deadline) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(deadline);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - now.getTime()) / 86400000);
}

function DeadlineChip({ diff, tx }: { diff: number; tx: (k: string, o?: Record<string, string | number>) => string }) {
  if (diff > 0) {
    return <Chip size="small" variant="soft" label={tx('debts.list.daysLeft', { count: diff })} color="success" />;
  }
  if (diff === 0) {
    return <Chip size="small" variant="soft" label={tx('debts.detail.dueToday')} color="warning" />;
  }
  return <Chip size="small" variant="soft" label={tx('debts.list.daysOverdue', { count: Math.abs(diff) })} color="error" />;
}

type Props = {
  clientId: string;
};

export default function DebtsTabPanel({ clientId }: Props) {
  const { tx } = useLocales();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const tableHead = useMemo(
    () => [
      { id: 'total', label: tx('common.table.total') },
      { id: 'paid', label: tx('common.table.paid') },
      { id: 'rem', label: tx('common.table.rem') },
      { id: 'date', label: tx('common.table.date') },
      { id: 'deadline', label: tx('debts.list.deadline') },
      { id: 'status', label: tx('common.table.status') },
    ],
    [tx]
  );

  const { data, isPending } = useDebtsListQuery({ page, pageSize: rowsPerPage, clientIds: clientId });

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
        {tx('clients.detail.tabs.debts')}
      </Typography>
      <Divider sx={{ mb: 1.5 }} />
      <Table size="small">
        <TableHeadCustom headLabel={tableHead} />
        <TableBody>
          {rows.map((row) => {
            const diff = getDeadlineDiff(row.deadline);
            const isOverdue = row.status === 'active' && diff !== null && diff < 0;

            return (
              <TableRow key={row.id} sx={isOverdue ? { bgcolor: 'error.lighter' } : undefined}>
                <TableCell>{fCurrency(row.totalAmount)}</TableCell>
                <TableCell>{fCurrency(row.paidAmount)}</TableCell>
                <TableCell>{fCurrency(row.remaining)}</TableCell>
                <TableCell>{fDate(row.createdAt)}</TableCell>
                <TableCell>
                  {row.deadline && diff !== null ? (
                    <Stack spacing={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        {fDate(row.deadline)}
                      </Typography>
                      {row.status !== 'closed' && <DeadlineChip diff={diff} tx={tx} />}
                    </Stack>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  {row.status === 'active'
                    ? tx('common.status.rowActive')
                    : tx('common.status.rowClosed')}
                </TableCell>
              </TableRow>
            );
          })}
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
