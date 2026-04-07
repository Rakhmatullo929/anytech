import { useEffect, useState } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import { useLocales } from 'src/locales';

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
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(initialValues?.name ?? '');
    setPhone(initialValues?.phone ?? '');
  }, [open, initialValues?.name, initialValues?.phone]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        {mode === 'create' ? tx('pages.clients.dialogs.create.title') : tx('pages.clients.dialogs.edit.title')}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label={tx('shared.table.client')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <TextField
            label={tx('shared.table.phone')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{tx('shared.actions.cancel')}</Button>
        <Button
          variant="contained"
          onClick={() =>
            onSubmit({
              name,
              phone,
            })
          }
          disabled={loading}
        >
          {tx('shared.actions.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
