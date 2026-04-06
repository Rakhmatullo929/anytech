import { useState, useEffect } from 'react';
// @mui
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
// utils
import { fCurrency } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';
// mock
import { MOCK_DEBTS, type MockDebt, type MockDebtPayment } from 'src/_mock/pos-app';
// routes
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';
import { RouterLink } from 'src/routes/components';
// components
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { TableHeadCustom } from 'src/components/table';
import EmptyContent from 'src/components/empty-content';

// ----------------------------------------------------------------------

const PAY_HEAD = [
  { id: 'amount', label: 'Сумма' },
  { id: 'date', label: 'Дата' },
];

export default function DebtDetailsView() {
  const { id = '' } = useParams();
  const [debt, setDebt] = useState<MockDebt | undefined>(() => MOCK_DEBTS.find((d) => d.id === id));

  const [payOpen, setPayOpen] = useState(false);

  useEffect(() => {
    setDebt(MOCK_DEBTS.find((d) => d.id === id));
  }, [id]);

  const applyPayment = (amount: number) => {
    if (!debt || amount <= 0 || amount > debt.remaining) return;
    const payment: MockDebtPayment = { amount, createdAt: new Date().toISOString() };
    const paidAmount = debt.paidAmount + amount;
    const remaining = debt.totalAmount - paidAmount;
    setDebt({
      ...debt,
      paidAmount,
      remaining: Math.max(0, remaining),
      status: remaining <= 0 ? 'closed' : 'active',
      payments: [...debt.payments, payment],
    });
    setPayOpen(false);
  };

  if (!debt) {
    return (
      <EmptyContent
        filled
        title="Долг не найден"
        action={
          <Button component={RouterLink} href={paths.debts.root} variant="contained">
            К списку
          </Button>
        }
      />
    );
  }

  return (
    <>
      <CustomBreadcrumbs
        heading={`Долг · ${debt.clientName}`}
        links={[
          { name: 'Долги', href: paths.debts.root },
          { name: debt.clientName, href: paths.debts.details(debt.id) },
        ]}
        action={
          debt.status === 'active' ? (
            <Button variant="contained" onClick={() => setPayOpen(true)}>
              Добавить платёж
            </Button>
          ) : null
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={1}>
            <Typography>Клиент: {debt.clientName}</Typography>
            <Typography>Всего: {fCurrency(debt.totalAmount)}</Typography>
            <Typography>Оплачено: {fCurrency(debt.paidAmount)}</Typography>
            <Typography>Остаток: {fCurrency(debt.remaining)}</Typography>
            <Typography>Статус: {debt.status === 'active' ? 'Активен' : 'Закрыт'}</Typography>
          </Stack>
        </Card>

        <Card sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Платежи
          </Typography>
          <Table size="small">
            <TableHeadCustom headLabel={PAY_HEAD} />
            <TableBody>
              {debt.payments.map((p, i) => (
                <TableRow key={i}>
                  <TableCell>{fCurrency(p.amount)}</TableCell>
                  <TableCell>{fDateTime(p.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Stack>

      <PaymentDialog
        open={payOpen}
        maxAmount={debt.remaining}
        onClose={() => setPayOpen(false)}
        onSubmit={applyPayment}
      />
    </>
  );
}

function PaymentDialog({
  open,
  maxAmount,
  onClose,
  onSubmit,
}: {
  open: boolean;
  maxAmount: number;
  onClose: () => void;
  onSubmit: (n: number) => void;
}) {
  const [val, setVal] = useState('');

  useEffect(() => {
    if (open) setVal('');
  }, [open]);

  const submit = () => {
    const n = Number(val);
    if (n <= 0 || n > maxAmount) return;
    onSubmit(n);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Платёж</DialogTitle>
      <DialogContent>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          Максимум: {fCurrency(maxAmount)}
        </Typography>
        <TextField
          fullWidth
          label="Сумма"
          type="number"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" onClick={submit}>
          Оплатить
        </Button>
      </DialogActions>
    </Dialog>
  );
}
