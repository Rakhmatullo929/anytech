import { useState } from 'react';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';

import { useLocales } from 'src/locales';
import { useSnackbar } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useCheckPermission } from 'src/auth/hooks/use-check-permission';

import {
  useCashRegisterQuery,
  useCloseCashRegisterMutation,
  useOpenCashRegisterMutation,
} from '../api/use-cash-register-api';

export default function CashRegisterControls() {
  const { tx } = useLocales();
  const { enqueueSnackbar } = useSnackbar();
  const { canWritePage } = useCheckPermission();

  const { data, isPending } = useCashRegisterQuery();
  const openMutation = useOpenCashRegisterMutation();
  const closeMutation = useCloseCashRegisterMutation();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const canManage = canWritePage('cash_register');

  if (!canManage) return null;
  if (isPending) return <Skeleton variant="rounded" width={120} height={36} />;
  if (!data) return null;

  const isOpen = data.status === 'open';
  const isBusy = openMutation.isPending || closeMutation.isPending;

  const handleOpen = async () => {
    try {
      await openMutation.mutateAsync();
      enqueueSnackbar(tx('pos.cashRegister.openSuccess'), { variant: 'success' });
    } catch {
      // global error handler shows snackbar
    }
    setConfirmOpen(false);
  };

  const handleClose = async () => {
    try {
      await closeMutation.mutateAsync();
      enqueueSnackbar(tx('pos.cashRegister.closeSuccess'), { variant: 'success' });
    } catch {
      // global error handler shows snackbar
    }
    setConfirmClose(false);
  };

  return (
    <>
      <Stack direction="row" spacing={1}>
        {isOpen ? (
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => setConfirmClose(true)}
            disabled={isBusy}
          >
            {tx('pos.cashRegister.closeButton')}
          </Button>
        ) : (
          <Button
            size="small"
            variant="contained"
            color="success"
            onClick={() => setConfirmOpen(true)}
            disabled={isBusy}
          >
            {tx('pos.cashRegister.openButton')}
          </Button>
        )}
      </Stack>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={tx('pos.cashRegister.confirmOpenTitle')}
        content={tx('pos.cashRegister.confirmOpenDescription')}
        cancelText={tx('common.actions.cancel')}
        action={
          <Button
            variant="contained"
            color="success"
            onClick={handleOpen}
            disabled={openMutation.isPending}
          >
            {tx('pos.cashRegister.openButton')}
          </Button>
        }
      />

      <ConfirmDialog
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        title={tx('pos.cashRegister.confirmCloseTitle')}
        content={tx('pos.cashRegister.confirmCloseDescription')}
        cancelText={tx('common.actions.cancel')}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={handleClose}
            disabled={closeMutation.isPending}
          >
            {tx('pos.cashRegister.closeButton')}
          </Button>
        }
      />
    </>
  );
}
