import { useMemo } from 'react';
// locales
import { useLocales } from 'src/locales';
// @mui
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
// utils
import { fCurrency } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';
// routes
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';
import { RouterLink } from 'src/routes/components';
import { useCheckPermission } from 'src/auth/hooks/use-check-permission';
// components
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { TableHeadCustom } from 'src/components/table';
import EmptyContent from 'src/components/empty-content';
import Iconify from 'src/components/iconify';
import { useClientDetailQuery } from 'src/sections/app/clients/api/use-clients-api';
import { ClientDetailsSkeleton } from 'src/sections/app/clients/skeleton';

// ----------------------------------------------------------------------

export default function ClientDetailsView() {
  const { tx } = useLocales();
  const { canDetailPage } = useCheckPermission();
  const { id = '' } = useParams();
  const { data: client, isPending } = useClientDetailQuery(id);
  const canDetailSales = canDetailPage('sales');

  const saleHead = useMemo(
    () => [
      { id: 'id', label: tx('shared.table.sale_id') },
      { id: 'pay', label: tx('shared.table.pay') },
      { id: 'total', label: tx('shared.table.total') },
      { id: 'date', label: tx('shared.table.date') },
    ],
    [tx]
  );

  const sales = useMemo(
    () => [...(client?.sales ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [client?.sales]
  );
  const payLabel = useMemo(
    () => ({
      cash: tx('shared.payment.cash'),
      card: tx('shared.payment.card'),
      debt: tx('shared.payment.debt'),
    }),
    [tx]
  );
  const totalSpent = useMemo(
    () => sales.reduce((acc, sale) => acc + Number(sale.totalAmount || 0), 0),
    [sales]
  );

  if (isPending) {
    return (
      <Box>
        <ClientDetailsSkeleton headLabel={saleHead} />
      </Box>
    );
  }

  if (!client) {
    return (
      <EmptyContent
        filled
        title={tx('pages.clients.detail.not_found')}
        action={
          <Button component={RouterLink} href={paths.clients.root} variant="contained">
            {tx('shared.actions.back_to_list')}
          </Button>
        }
      />
    );
  }

  return (
    <>
      <CustomBreadcrumbs
        heading={client.name}
        links={[
          { name: tx('layout.nav.clients'), href: paths.clients.root },
          { name: client.name, href: paths.clients.details(client.id) },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Avatar sx={{ width: 52, height: 52, bgcolor: 'primary.main', fontWeight: 700 }}>
              {client.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6">{client.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {tx('pages.clients.detail.phone_label')}: {client.phone}
              </Typography>
            </Box>
            <Chip
              icon={<Iconify icon="solar:wallet-money-bold" />}
              color={Number(client.totalDebt) > 0 ? 'warning' : 'success'}
              label={`${tx('shared.labels.total')}: ${fCurrency(client.totalDebt || '0')}`}
              variant="soft"
            />
          </Stack>
        </Card>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Card sx={{ p: 2.5, flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {tx('layout.nav.sales')}
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5 }}>
              {sales.length}
            </Typography>
          </Card>
          <Card sx={{ p: 2.5, flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {tx('shared.labels.total')}
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5 }}>
              {fCurrency(String(totalSpent || 0))}
            </Typography>
          </Card>
          <Card sx={{ p: 2.5, flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {tx('shared.table.date')}
            </Typography>
            <Typography variant="subtitle1" sx={{ mt: 0.75 }}>
              {sales[0] ? fDateTime(sales[0].createdAt) : '-'}
            </Typography>
          </Card>
        </Stack>

        <Card sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {tx('pages.clients.detail.purchase_history')}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Table size="small">
            <TableHeadCustom headLabel={saleHead} />
            <TableBody>
              {sales.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    {canDetailSales ? (
                      <Link component={RouterLink} href={paths.sales.details(s.id)} variant="subtitle2">
                        {s.id}
                      </Link>
                    ) : (
                      s.id
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      variant="soft"
                      label={payLabel[s.paymentType]}
                      color={s.paymentType === 'debt' ? 'warning' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{fCurrency(s.totalAmount)}</TableCell>
                  <TableCell>{fDateTime(s.createdAt)}</TableCell>
                </TableRow>
              ))}
              {!sales.length && (
                <TableRow>
                  <TableCell colSpan={4} sx={{ py: 6 }}>
                    <EmptyContent
                      title={tx('pages.clients.detail.purchase_history')}
                      description={tx('pages.clients.detail.no_purchases')}
                    />
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
