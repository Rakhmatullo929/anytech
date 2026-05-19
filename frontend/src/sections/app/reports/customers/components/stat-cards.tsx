import Grid from '@mui/material/Unstable_Grid2';
import { useLocales } from 'src/locales';
import { ReportStatCard } from '../../components';
import type { CustomerReport } from '../../api/types';

type Props = {
  data: CustomerReport | undefined;
  loading: boolean;
};

export default function CustomerStatCards({ data, loading }: Props) {
  const { tx } = useLocales();
  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid xs={12} sm={6}>
        <ReportStatCard
          title={tx('reports.stats.totalCustomers')}
          value={data?.totalCustomers ?? '—'}
          color="primary"
          loading={loading}
        />
      </Grid>
      <Grid xs={12} sm={6}>
        <ReportStatCard
          title={tx('reports.stats.newInPeriod')}
          value={data?.newInPeriod ?? '—'}
          color="info"
          loading={loading}
        />
      </Grid>
    </Grid>
  );
}
