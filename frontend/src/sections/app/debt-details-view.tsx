import { useState, useEffect, useMemo } from 'react';
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

export default function DebtDetailsView() {
  const { tx } = useLocales();
  const { id = '' } = useParams();

  const payHead = useMemo(
    () => [
      { id: 'amount', label: tx('shared.table.amount') },
      { id: 'date', label: tx('shared.table.date') },
    ],
    [tx]
  );
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
        title={tx('pages.debts.detail.not_found')}
        action={
          <Button component={RouterLink} href={paths.debts.root} variant="contained">
            {tx('shared.actions.back_to_list')}
          </Button>
        }
      />
    );
  }

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('pages.debts.detail.heading_detail', { name: debt.clientName })}
        links={[
          { name: tx('layout.nav.debts'), href: paths.debts.root },
          { name: debt.clientName, href: paths.debts.details(debt.id) },
        ]}
        action={
          debt.status === 'active' ? (
            <Button variant="contained" onClick={() => setPayOpen(true)}>
              {tx('pages.debts.detail.add_payment')}
            </Button>
          ) : null
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={1}>
            <Typography>
              {tx('pages.debts.detail.client_line')} {debt.clientName}
            </Typography>
            <Typography>
              {tx('pages.debts.detail.total_line')} {fCurrency(debt.totalAmount)}
            </Typography>
            <Typography>
              {tx('pages.debts.detail.paid_line')} {fCurrency(debt.paidAmount)}
            </Typography>
            <Typography>
              {tx('pages.debts.detail.rem_line')} {fCurrency(debt.remaining)}
            </Typography>
            <Typography>
              {tx('pages.debts.detail.status_line')}{' '}
              {debt.status === 'active'
                ? tx('shared.status.row_active')
                : tx('shared.status.row_closed')}
            </Typography>
          </Stack>
        </Card>

        <Card sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {tx('pages.debts.detail.payments_section_title')}
          </Typography>
          <Table size="small">
            <TableHeadCustom headLabel={payHead} />
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
  const { tx } = useLocales();
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
      <DialogTitle>{tx('pages.debts.payment_dialog.title')}</DialogTitle>
      <DialogContent>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          {tx('pages.debts.payment_dialog.max_amount')} {fCurrency(maxAmount)}
        </Typography>
        <TextField
          fullWidth
          label={tx('shared.table.amount')}
          type="number"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{tx('shared.actions.cancel')}</Button>
        <Button variant="contained" onClick={submit}>
          {tx('pages.debts.payment_dialog.pay_button')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
