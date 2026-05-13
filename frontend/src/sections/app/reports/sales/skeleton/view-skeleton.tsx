import Grid from '@mui/material/Unstable_Grid2';
import { ChartCardSkeleton, StatCardSkeleton, TableCardSkeleton } from '../../components';

export default function SalesReportSkeleton() {
  return (
    <>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[0, 1, 2, 3].map((i) => (
          <Grid key={i} xs={12} sm={6} md={3}>
            <StatCardSkeleton />
          </Grid>
        ))}
      </Grid>

      <ChartCardSkeleton height={280} sx={{ mb: 3 }} />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={12} md={4}>
          <ChartCardSkeleton height={260} sx={{ height: '100%' }} />
        </Grid>
        <Grid xs={12} md={8}>
          <TableCardSkeleton rows={6} sx={{ height: '100%' }} />
        </Grid>
      </Grid>

      <TableCardSkeleton rows={5} />
    </>
  );
}
