import { useCallback, useMemo, useState } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AutocompleteInfinite from 'src/components/autocomplete-infinite';
import { useLocales } from 'src/locales';

import { fetchClientsList } from '../../api/clients-requests';
import type { ClientListItem } from '../../api/types';

// ---------------------------------------------------------------------------

type Props = {
  open: boolean;
  groupId: string;
  loading?: boolean;
  onClose: VoidFunction;
  onSubmit: (clientIds: string[]) => Promise<void>;
};

// ---------------------------------------------------------------------------

export default function AddClientsDialog({
  open,
  groupId,
  loading = false,
  onClose,
  onSubmit,
}: Props) {
  const { tx } = useLocales();
  const [selected, setSelected] = useState<ClientListItem[]>([]);

  // Query key is scoped to the specific group so caches for different groups
  // don't collide. The AutocompleteInfinite component appends the search term.
  const queryKeyBase = useMemo(
    () => ['clients', 'autocomplete', groupId],
    [groupId]
  );

  // Stable fetcher — fetchClientsList is imported from the module level, so
  // useCallback dependencies are intentionally empty.
  const fetcher = useCallback(
    ({ page, search }: { page: number; search: string; signal: AbortSignal }) =>
      fetchClientsList({ page, pageSize: 20, search: search || undefined }),
    []
  );

  const getOptionLabel = useCallback(
    (client: ClientListItem) =>
      [client.name, client.lastName].filter(Boolean).join(' '),
    []
  );

  const renderOptionContent = useCallback(
    (client: ClientListItem) => (
      <Stack>
        <Typography variant="body2">
          {[client.name, client.lastName].filter(Boolean).join(' ')}
        </Typography>
        {client.phone && (
          <Typography variant="caption" color="text.secondary">
            {client.phone}
          </Typography>
        )}
      </Stack>
    ),
    []
  );

  const handleClose = useCallback(() => {
    setSelected([]);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (!selected.length) return;
    await onSubmit(selected.map((c) => c.id));
    setSelected([]);
  }, [onSubmit, selected]);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{tx('clients.groups.addClientsDialog.title')}</DialogTitle>

      <DialogContent>
        <Stack sx={{ pt: 1 }}>
          <AutocompleteInfinite<ClientListItem>
            queryKeyBase={queryKeyBase}
            fetcher={fetcher}
            value={selected}
            onChange={setSelected}
            getOptionLabel={getOptionLabel}
            renderOptionContent={renderOptionContent}
            label={tx('clients.groups.addClientsDialog.searchLabel')}
            placeholder={tx('clients.groups.addClientsDialog.searchPlaceholder')}
            noOptionsText={tx('common.table.noData')}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {tx('common.actions.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || selected.length === 0}
        >
          {selected.length > 0
            ? `${tx('clients.groups.addClientsDialog.submitButton')} (${selected.length})`
            : tx('clients.groups.addClientsDialog.submitButton')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
