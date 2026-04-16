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
import EmptyContent from 'src/components/empty-content';
import { TableHeadCustom } from 'src/components/table';
import { fCurrency } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';

type Sale = {
  id: string;
  totalAmount: string;
  paymentType: 'cash' | 'card' | 'debt';
  createdAt: string;
};

type Props = {
  title: string;
  emptyDescription: string;
  headLabel: { id: string; label: string }[];
  sales: Sale[];
  canDetailSales: boolean;
  getSaleHref: (id: string) => string;
  payLabels: Record<Sale['paymentType'], string>;
};

export default function PurchasesTabPanel({
  title,
  emptyDescription,
  headLabel,
  sales,
  canDetailSales,
  getSaleHref,
  payLabels,
}: Props) {
  return (
    <Card sx={{ p: 2.25 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Divider sx={{ mb: 1.5 }} />
      <Table size="small">
        <TableHeadCustom headLabel={headLabel} />
        <TableBody>
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell>
                {canDetailSales ? (
                  <Link component={RouterLink} href={getSaleHref(sale.id)} variant="subtitle2">
                    {sale.id}
                  </Link>
                ) : (
                  sale.id
                )}
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  variant="soft"
                  label={payLabels[sale.paymentType]}
                  color={sale.paymentType === 'debt' ? 'warning' : 'default'}
                />
              </TableCell>
              <TableCell>{fCurrency(sale.totalAmount)}</TableCell>
              <TableCell>{fDateTime(sale.createdAt)}</TableCell>
            </TableRow>
          ))}
          {!sales.length && (
            <TableRow>
              <TableCell colSpan={4} sx={{ py: 6 }}>
                <EmptyContent title={title} description={emptyDescription} />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
