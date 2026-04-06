import { useMemo } from 'react';
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

const LINE_HEAD = [
  { id: 'product', label: 'Товар' },
  { id: 'qty', label: 'Кол-во' },
  { id: 'price', label: 'Цена' },
];

const PAY_LABEL: Record<string, string> = {
  cash: 'Наличные',
  card: 'Карта',
  debt: 'В долг',
};

export default function SaleDetailsView() {
  const { id = '' } = useParams();

  const sale = useMemo(() => MOCK_SALES.find((s) => s.id === id), [id]);

  if (!sale) {
    return (
      <EmptyContent
        filled
        title="Продажа не найдена"
        action={
          <Button component={RouterLink} href={paths.sales.root} variant="contained">
            К списку
          </Button>
        }
      />
    );
  }

  return (
    <>
      <CustomBreadcrumbs
        heading={`Продажа ${sale.id}`}
        links={[
          { name: 'Продажи', href: paths.sales.root },
          { name: sale.id, href: paths.sales.details(sale.id) },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Клиент: <strong>{sale.clientName}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Дата: {fDateTime(sale.createdAt)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Оплата: {PAY_LABEL[sale.paymentType]}
            </Typography>
            <Typography variant="h6">Итого: {fCurrency(sale.totalAmount)}</Typography>
          </Stack>
        </Card>

        <Card sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Состав
          </Typography>
          <Table size="small">
            <TableHeadCustom headLabel={LINE_HEAD} />
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
