import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';

import { useLocales } from 'src/locales';
import FormProvider, { RHFTextField } from 'src/components/hook-form';
import { getClientUpsertSchema } from './utils/client-upsert-schema';

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  loading: boolean;
  initialValues?: {
    name: string;
    phone: string;
  };
  onClose: () => void;
  onSubmit: (values: { name: string; phone: string }) => void;
};

export default function ClientUpsertDialog({
  open,
  mode,
  loading,
  initialValues,
  onClose,
  onSubmit,
}: Props) {
  const { tx } = useLocales();
  const schema = getClientUpsertSchema(tx);
  const methods = useForm<{ name: string; phone: string }>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      phone: '',
    },
  });
  const { reset, handleSubmit } = methods;

  useEffect(() => {
    if (!open) return;
    reset({
      name: initialValues?.name ?? '',
      phone: initialValues?.phone ?? '',
    });
  }, [open, reset, initialValues?.name, initialValues?.phone]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        {mode === 'create' ? tx('pages.clients.dialogs.create.title') : tx('pages.clients.dialogs.edit.title')}
      </DialogTitle>
      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <RHFTextField name="name" label={`${tx('shared.table.client')} *`} />
            <RHFTextField name="phone" label={`${tx('shared.table.phone')} *`} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{tx('shared.actions.cancel')}</Button>
          <Button variant="contained" type="submit" disabled={loading}>
            {tx('shared.actions.save')}
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}
