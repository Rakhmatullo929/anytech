import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';

import { useLocales } from 'src/locales';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

type RoleCreateValues = {
  name: string;
};

type Props = {
  open: boolean;
  loading: boolean;
  title?: string;
  submitLabel?: string;
  initialName?: string;
  onClose: () => void;
  onSubmit: (values: RoleCreateValues) => void;
};

export default function RoleCreateDialog({
  open,
  loading,
  title,
  submitLabel,
  initialName,
  onClose,
  onSubmit,
}: Props) {
  const { tx } = useLocales();
  const schema = Yup.object({
    name: Yup.string().trim().required(tx('common.validation.roleRequired')),
  });

  const methods = useForm<RoleCreateValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { name: '' },
  });

  const { reset, handleSubmit } = methods;

  useEffect(() => {
    if (!open) return;
    reset({ name: initialName ?? '' });
  }, [open, reset, initialName]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title || tx('admin.roles.dialogs.create.title')}</DialogTitle>
      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <RHFTextField
              autoFocus
              name="name"
              label={tx('admin.roles.dialogs.create.fields.name')}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{tx('common.actions.cancel')}</Button>
          <Button variant="contained" disabled={loading} type="submit">
            {submitLabel || tx('admin.roles.dialogs.create.submit')}
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}
