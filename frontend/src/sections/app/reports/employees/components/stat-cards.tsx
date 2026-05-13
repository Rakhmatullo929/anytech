import Grid from '@mui/material/Unstable_Grid2';
import { useLocales } from 'src/locales';
import { fCurrency } from 'src/utils/format-number';
import { ReportStatCard } from '../../components';
import type { EmployeeReport } from '../../api/types';

type Props = {
  data: EmployeeReport | undefined;
  loading: boolean;
};

export default function EmployeeStatCards({ data, loading }: Props) {
  const { tx } = useLocales();

  const cards = [
    { key: 'reports.stats.totalEmployees', value: data?.totalEmployees ?? '—', color: 'primary' },
    { key: 'reports.stats.totalSales', value: data?.totalSalesCount ?? '—', color: 'info' },
    { key: 'reports.stats.totalRevenue', value: data ? fCurrency(data.totalRevenue) : '—', color: 'success' },
  ] as const;

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {cards.map(({ key, value, color }) => (
        <Grid key={key} xs={12} sm={6} md={4}>
          <ReportStatCard title={tx(key)} value={value} color={color} loading={loading} />
        </Grid>
      ))}
    </Grid>
  );
}
