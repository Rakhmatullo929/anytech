import { useMemo } from 'react';
// locales
import { useLocales } from 'src/locales';
// @mui
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
// utils
import { fCurrency } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';
// routes
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';
import { RouterLink } from 'src/routes/components';
// components
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { TableHeadCustom } from 'src/components/table';
import EmptyContent from 'src/components/empty-content';
import { useSaleDetailQuery } from 'src/sections/app/sales/api';
import { SaleDetailsSkeleton } from 'src/sections/app/sales/skeleton';

// ----------------------------------------------------------------------

export default function SaleDetailsView() {
  const { tx } = useLocales();
  const { id = '' } = useParams();
  const { data: sale, isPending } = useSaleDetailQuery(id);

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
  const itemCount = sale?.items?.length ?? 0;

  if (isPending) {
    return (
      <Box>
        <SaleDetailsSkeleton headLabel={lineHead} />
      </Box>
    );
  }

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
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <Stack spacing={1} sx={{ flexGrow: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {tx('pages.sales.detail.client_line')} <strong>{sale.clientName || '-'}</strong>
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
            <Chip
              size="small"
              variant="soft"
              color={sale.paymentType === 'debt' ? 'warning' : 'default'}
              label={payLabel[sale.paymentType]}
            />
          </Stack>
        </Card>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Card sx={{ p: 2.5, flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {tx('shared.table.qty')}
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5 }}>
              {itemCount}
            </Typography>
          </Card>
          <Card sx={{ p: 2.5, flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {tx('shared.table.date')}
            </Typography>
            <Typography variant="subtitle1" sx={{ mt: 0.75 }}>
              {fDateTime(sale.createdAt)}
            </Typography>
          </Card>
        </Stack>

        <Card sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {tx('pages.sales.detail.lines_title')}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Table size="small">
            <TableHeadCustom headLabel={lineHead} />
            <TableBody>
              {sale.items.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>{line.productName}</TableCell>
                  <TableCell>{line.quantity}</TableCell>
                  <TableCell>{fCurrency(line.price)}</TableCell>
                </TableRow>
              ))}
              {!sale.items.length && (
                <TableRow>
                  <TableCell colSpan={3} sx={{ py: 6 }}>
                    <EmptyContent title={tx('pages.sales.detail.lines_title')} />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </Stack>

    </>
  );
}
