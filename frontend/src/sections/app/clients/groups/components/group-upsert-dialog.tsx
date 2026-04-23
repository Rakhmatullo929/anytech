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
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';

import { useSnackbar } from 'src/components/snackbar';
import { useLocales } from 'src/locales';

import { useCreateGroupMutation, useUpdateGroupMutation } from '../api/use-groups-api';
import type { Group } from '../api/types';

type FormValues = {
  name: string;
  description: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  group?: Group | null;
};

const schema = Yup.object({
  name: Yup.string().trim().required('Name is required').max(255),
  description: Yup.string().max(1000),
});

export default function GroupUpsertDialog({ open, onClose, group }: Props) {
  const { tx } = useLocales();
  const { enqueueSnackbar } = useSnackbar();
  const isEdit = Boolean(group);

  const createMutation = useCreateGroupMutation();
  const updateMutation = useUpdateGroupMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: group?.name ?? '',
        description: group?.description ?? '',
      });
    }
  }, [open, group, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (isEdit && group) {
      updateMutation.mutate(
        { id: group.id, name: values.name, description: values.description },
        {
          onSuccess: () => {
            enqueueSnackbar(tx('clients.groups.toasts.updated'), { variant: 'success' });
            onClose();
          },
        }
      );
    } else {
      createMutation.mutate(
        { name: values.name, description: values.description },
        {
          onSuccess: () => {
            enqueueSnackbar(tx('clients.groups.toasts.created'), { variant: 'success' });
            onClose();
          },
        }
      );
    }
  });

  const title = isEdit
    ? tx('clients.groups.form.editTitle')
    : tx('clients.groups.form.createTitle');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle>{title}</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              {...register('name')}
              label={tx('clients.groups.form.fields.name')}
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
              autoFocus
              fullWidth
            />

            <TextField
              {...register('description')}
              label={tx('clients.groups.form.fields.description')}
              error={Boolean(errors.description)}
              helperText={errors.description?.message}
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={isPending}>
            {tx('common.actions.cancel')}
          </Button>
          <LoadingButton type="submit" variant="contained" loading={isPending}>
            {isEdit ? tx('common.actions.save') : tx('common.dictionary.create')}
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
