import { useMemo } from 'react';
// locales
import { useLocales } from 'src/locales';
// @mui
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
// utils
import { fCurrency } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';
// mock
import { MOCK_SALES } from 'src/_mock/pos-app';
// routes
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';
import { RouterLink } from 'src/routes/components';
// components
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { TableHeadCustom } from 'src/components/table';
import EmptyContent from 'src/components/empty-content';

// ----------------------------------------------------------------------

export default function SaleDetailsView() {
  const { tx } = useLocales();
  const { id = '' } = useParams();

  const lineHead = useMemo(
    () => [
      { id: 'product', label: tx('shared.table.product') },
      { id: 'qty', label: tx('shared.table.qty') },
      { id: 'price', label: tx('shared.table.price') },
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

  const sale = useMemo(() => MOCK_SALES.find((s) => s.id === id), [id]);

  if (!sale) {
    return (
      <EmptyContent
        filled
        title={tx('pages.sales.detail.not_found')}
        action={
          <Button component={RouterLink} href={paths.sales.root} variant="contained">
            {tx('shared.actions.back_to_list')}
          </Button>
        }
      />
    );
  }

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('pages.sales.detail.heading_detail', { id: sale.id })}
        links={[
          { name: tx('layout.nav.sales'), href: paths.sales.root },
          { name: sale.id, href: paths.sales.details(sale.id) },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              {tx('pages.sales.detail.client_line')} <strong>{sale.clientName}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tx('pages.sales.detail.date_line')} {fDateTime(sale.createdAt)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tx('pages.sales.detail.pay_line')} {payLabel[sale.paymentType]}
            </Typography>
            <Typography variant="h6">
              {tx('shared.labels.total')}: {fCurrency(sale.totalAmount)}
            </Typography>
          </Stack>
        </Card>

        <Card sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {tx('pages.sales.detail.lines_title')}
          </Typography>
          <Table size="small">
            <TableHeadCustom headLabel={lineHead} />
            <TableBody>
              {sale.lines.map((line, i) => (
                <TableRow key={i}>
                  <TableCell>{line.productName}</TableCell>
                  <TableCell>{line.quantity}</TableCell>
                  <TableCell>{fCurrency(line.price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Stack>
    </>
  );
}
