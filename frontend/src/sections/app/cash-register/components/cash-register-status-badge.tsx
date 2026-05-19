import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';

import { useLocales } from 'src/locales';

import { useCashRegisterQuery } from '../api/use-cash-register-api';

export default function CashRegisterStatusBadge() {
  const { tx } = useLocales();
  const { data, isPending } = useCashRegisterQuery();

  if (isPending) {
    return <Skeleton variant="rounded" width={90} height={22} />;
  }

  if (!data) return null;

  const isOpen = data.status === 'open';

  return (
    <Chip
      size="small"
      variant="soft"
      color={isOpen ? 'success' : 'error'}
      label={isOpen ? tx('pos.cashRegister.statusOpen') : tx('pos.cashRegister.statusClosed')}
    />
  );
}
