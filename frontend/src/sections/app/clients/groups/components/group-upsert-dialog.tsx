import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';

import FormProvider, { RHFTextField } from 'src/components/hook-form';
import { useLocales } from 'src/locales';

import type { GroupListItem } from '../api/types';
import { getGroupFormSchema } from './utils/group-form-schema';

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  group: GroupListItem | null;
  loading?: boolean;
  onClose: VoidFunction;
  onSubmit: (values: { name: string; description: string }) => Promise<void>;
};

export default function GroupUpsertDialog({ open, mode, group, loading = false, onClose, onSubmit }: Props) {
  const { tx } = useLocales();
  const methods = useForm<{ name: string; description: string }>({
    resolver: yupResolver(getGroupFormSchema(tx)),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    if (!open) return;
    reset({
      name: group?.name || '',
      description: group?.description || '',
    });
  }, [group, open, reset]);

  const handleFormSubmit = handleSubmit(async (values) => {
    await onSubmit({
      name: values.name.trim(),
      description: values.description.trim(),
    });
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mode === 'create' ? tx('clients.groups.dialogs.createTitle') : tx('clients.groups.dialogs.editTitle')}</DialogTitle>
      <FormProvider methods={methods} onSubmit={handleFormSubmit}>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <RHFTextField name="name" label={`${tx('clients.groups.fields.name')} *`} />
            <RHFTextField name="description" label={tx('clients.groups.fields.description')} multiline minRows={3} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{tx('common.actions.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {tx('common.actions.save')}
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}
