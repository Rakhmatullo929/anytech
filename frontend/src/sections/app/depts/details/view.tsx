import { useEffect, useMemo, useState } from 'react';
// locales
import { useLocales } from 'src/locales';
// @mui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
// utils
import { fCurrency } from 'src/utils/format-number';
import { fDate, fDateTime } from 'src/utils/format-time';
// routes
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';
import { RouterLink } from 'src/routes/components';
import { useCheckPermission } from 'src/auth/hooks/use-check-permission';
// components
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content';
import { TableHeadCustom } from 'src/components/table';

import { useDebtDetailQuery, usePayDebtMutation, type DebtPaymentMethod } from '../api';

// ----------------------------------------------------------------------

function daysLabel(deadline: string | null | undefined, tx: (key: string, opts?: Record<string, string | number>) => string): { label: string; overdue: boolean } | null {
  if (!deadline) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(deadline);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - now.getTime()) / 86400000);
  if (diff > 0) return { label: tx('debts.detail.daysLeft', { count: diff }), overdue: false };
  if (diff === 0) return { label: tx('debts.detail.dueToday'), overdue: false };
  return { label: tx('debts.detail.daysOverdue', { count: Math.abs(diff) }), overdue: true };
}

// ----------------------------------------------------------------------

export default function DebtDetailsView() {
  const { tx } = useLocales();
  const { canWritePage } = useCheckPermission();
  const { id = '' } = useParams();
  const canWriteDebts = canWritePage('debts');

  const { data: debt, isPending, isFetching, isError } = useDebtDetailQuery(id);
  const payMutation = usePayDebtMutation(id);

  const [payOpen, setPayOpen] = useState(false);

  const payHead = useMemo(
    () => [
      { id: 'amount', label: tx('common.table.amount') },
      { id: 'method', label: tx('common.payment.method') },
      { id: 'date', label: tx('common.table.date') },
    ],
    [tx]
  );

  const deadlineInfo = useMemo(() => daysLabel(debt?.deadline, tx), [debt?.deadline, tx]);

  const handlePaySubmit = async (amount: string, method: DebtPaymentMethod, full: boolean) => {
    if (!debt) return;
    const finalAmount = full ? debt.remaining : amount;
    await payMutation.mutateAsync({ amount: finalAmount, paymentMethod: method });
    setPayOpen(false);
  };

  if (isPending && !debt) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !debt) {
    return (
      <EmptyContent
        filled
        title={tx('debts.detail.notFound')}
        action={
          <Button component={RouterLink} href={paths.debts.root} variant="contained">
            {tx('common.actions.backToList')}
          </Button>
        }
      />
    );
  }

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('debts.detail.headingDetail', { name: debt.clientName })}
        links={[
          { name: tx('common.navigation.debts'), href: paths.debts.root },
          { name: debt.clientName, href: paths.debts.details(debt.id) },
        ]}
        action={
          debt.status === 'active' && canWriteDebts ? (
            <Button variant="contained" onClick={() => setPayOpen(true)}>
              {tx('debts.detail.addPayment')}
            </Button>
          ) : null
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {isFetching && debt ? <LinearProgress sx={{ mb: 2, borderRadius: 1 }} color="inherit" /> : <Box sx={{ mb: 2, height: 4 }} />}

      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            <InfoRow label={tx('debts.detail.clientLine')} value={debt.clientName} />
            <InfoRow label={tx('debts.detail.totalLine')} value={fCurrency(debt.totalAmount)} />
            <InfoRow label={tx('debts.detail.paidLine')} value={fCurrency(debt.paidAmount)} />
            <InfoRow label={tx('debts.detail.remLine')} value={fCurrency(debt.remaining)} />
            <InfoRow
              label={tx('debts.detail.statusLine')}
              value={
                debt.status === 'active'
                  ? tx('common.status.rowActive')
                  : tx('common.status.rowClosed')
              }
            />
            <InfoRow label={tx('debts.detail.createdLine')} value={fDate(debt.createdAt)} />
            {debt.deadline && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130 }}>
                  {tx('debts.detail.deadlineLine')}
                </Typography>
                <Typography variant="body2">{fDate(debt.deadline)}</Typography>
                {deadlineInfo && (
                  <Chip
                    size="small"
                    label={deadlineInfo.label}
                    color={deadlineInfo.overdue ? 'error' : 'success'}
                    variant="soft"
                  />
                )}
              </Stack>
            )}
          </Stack>
        </Card>

        <Card sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {tx('debts.detail.paymentsSectionTitle')}
          </Typography>
          <Table size="small">
            <TableHeadCustom headLabel={payHead} />
            <TableBody>
              {debt.payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{fCurrency(p.amount)}</TableCell>
                  <TableCell>{p.paymentMethod ? tx(`common.payment.${p.paymentMethod}`) : '—'}</TableCell>
                  <TableCell>{fDateTime(p.createdAt)}</TableCell>
                </TableRow>
              ))}
              {debt.payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                    {tx('common.table.noData')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </Stack>

      {canWriteDebts && debt.status === 'active' ? (
        <PaymentDialog
          open={payOpen}
          maxAmount={debt.remaining}
          isPaying={payMutation.isPending}
          onClose={() => setPayOpen(false)}
          onSubmit={handlePaySubmit}
        />
      ) : null}
    </>
  );
}

// ----------------------------------------------------------------------

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1} alignItems="flex-start">
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}

// ----------------------------------------------------------------------

type PaymentDialogProps = {
  open: boolean;
  maxAmount: string;
  isPaying: boolean;
  onClose: () => void;
  onSubmit: (amount: string, method: DebtPaymentMethod, full: boolean) => void;
};

function PaymentDialog({ open, maxAmount, isPaying, onClose, onSubmit }: PaymentDialogProps) {
  const { tx } = useLocales();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<DebtPaymentMethod>('cash');

  useEffect(() => {
    if (open) {
      setAmount('');
      setMethod('cash');
    }
  }, [open]);

  const max = parseFloat(maxAmount) || 0;
  const amountNum = parseFloat(amount) || 0;
  const partialValid = amountNum > 0 && amountNum <= max;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{tx('debts.paymentDialog.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {tx('debts.paymentDialog.maxAmount')} {fCurrency(maxAmount)}
          </Typography>

          <TextField
            fullWidth
            label={tx('common.table.amount')}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputProps={{ min: 0.01, max, step: 'any' }}
          />

          <TextField
            select
            fullWidth
            label={tx('common.payment.method')}
            value={method}
            onChange={(e) => setMethod(e.target.value as DebtPaymentMethod)}
          >
            <MenuItem value="cash">{tx('common.payment.cash')}</MenuItem>
            <MenuItem value="card">{tx('common.payment.card')}</MenuItem>
            <MenuItem value="transfer">{tx('common.payment.transfer')}</MenuItem>
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPaying}>
          {tx('common.actions.cancel')}
        </Button>
        <Button
          variant="outlined"
          disabled={!partialValid || isPaying}
          onClick={() => onSubmit(amount, method, false)}
        >
          {isPaying ? <CircularProgress size={18} color="inherit" /> : tx('debts.paymentDialog.payButton')}
        </Button>
        <Button
          variant="contained"
          color="success"
          disabled={isPaying}
          onClick={() => onSubmit('', method, true)}
        >
          {tx('debts.paymentDialog.payFullButton')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
