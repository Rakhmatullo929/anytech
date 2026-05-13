import Grid from '@mui/material/Unstable_Grid2';
import { useLocales } from 'src/locales';
import { fCurrency } from 'src/utils/format-number';
import { ReportStatCard } from '../../components';
import type { DebtReport } from '../../api/types';

type Props = {
  data: DebtReport | undefined;
  loading: boolean;
};

export default function DebtStatCards({ data, loading }: Props) {
  const { tx } = useLocales();

  const cards = [
    { key: 'reports.stats.totalDebts', value: data ? fCurrency(data.totalDebts) : '—', color: 'primary' },
    { key: 'reports.stats.paidDebts', value: data ? fCurrency(data.paidDebts) : '—', color: 'success' },
    { key: 'reports.stats.remainingDebts', value: data ? fCurrency(data.remainingDebts) : '—', color: 'warning' },
    { key: 'reports.stats.overdueDebts', value: data ? fCurrency(data.overdueDebts) : '—', color: 'error' },
  ] as const;

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {cards.map(({ key, value, color }) => (
        <Grid key={key} xs={12} sm={6} md={3}>
          <ReportStatCard title={tx(key)} value={value} color={color} loading={loading} />
        </Grid>
      ))}
    </Grid>
  );
}
