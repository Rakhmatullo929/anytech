import Grid from '@mui/material/Unstable_Grid2';
import { useLocales } from 'src/locales';
import { fCurrency } from 'src/utils/format-number';
import { ReportStatCard } from '../../components';
import type { SalesReport } from '../../api/types';

type Props = {
  data: SalesReport | undefined;
  loading: boolean;
};

export default function SalesStatCards({ data, loading }: Props) {
  const { tx } = useLocales();

  const cards = [
    { key: 'reports.stats.totalSales', value: data?.totalSales ?? '—', color: 'primary' },
    { key: 'reports.stats.totalRevenue', value: data ? fCurrency(data.totalRevenue) : '—', color: 'success' },
    { key: 'reports.stats.totalProfit', value: data ? fCurrency(data.totalProfit) : '—', color: 'info' },
    { key: 'reports.stats.avgOrderValue', value: data ? fCurrency(data.avgOrderValue) : '—', color: 'warning' },
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
