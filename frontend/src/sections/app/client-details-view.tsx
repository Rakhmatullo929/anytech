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
import Link from '@mui/material/Link';
// utils
import { fCurrency } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';
// mock
import { MOCK_CLIENTS, MOCK_SALES } from 'src/_mock/pos-app';
// routes
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';
import { RouterLink } from 'src/routes/components';
// components
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { TableHeadCustom, TableNoData } from 'src/components/table';
import EmptyContent from 'src/components/empty-content';

// ----------------------------------------------------------------------

export default function ClientDetailsView() {
  const { tx } = useLocales();
  const { id = '' } = useParams();

  const saleHead = useMemo(
    () => [
      { id: 'id', label: tx('shared.table.sale_id') },
      { id: 'total', label: tx('shared.table.total') },
      { id: 'date', label: tx('shared.table.date') },
    ],
    [tx]
  );

  const client = useMemo(() => MOCK_CLIENTS.find((c) => c.id === id), [id]);

  const sales = useMemo(
    () => MOCK_SALES.filter((s) => s.clientId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [id]
  );

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
          <Typography variant="subtitle2" color="text.secondary">
            {tx('pages.clients.detail.phone_label')}
          </Typography>
          <Typography variant="body1">{client.phone}</Typography>
        </Card>

        <Card sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {tx('pages.clients.detail.purchase_history')}
          </Typography>
          <Table size="small">
            <TableHeadCustom headLabel={saleHead} />
            <TableBody>
              {sales.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link component={RouterLink} href={paths.sales.details(s.id)} variant="subtitle2">
                      {s.id}
                    </Link>
                  </TableCell>
                  <TableCell>{fCurrency(s.totalAmount)}</TableCell>
                  <TableCell>{fDateTime(s.createdAt)}</TableCell>
                </TableRow>
              ))}
              <TableNoData notFound={!sales.length} />
            </TableBody>
          </Table>
        </Card>
      </Stack>
    </>
  );
}
