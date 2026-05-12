import Grid from '@mui/material/Unstable_Grid2';
import { ChartCardSkeleton, StatCardSkeleton, TableCardSkeleton } from '../../components';

export default function EmployeeReportSkeleton() {
  return (
    <>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[0, 1, 2].map((i) => (
          <Grid key={i} xs={12} sm={6} md={4}>
            <StatCardSkeleton />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={12} md={6}>
          <ChartCardSkeleton height={240} sx={{ height: '100%' }} />
        </Grid>
        <Grid xs={12} md={6}>
          <ChartCardSkeleton height={240} sx={{ height: '100%' }} />
        </Grid>
      </Grid>

      <TableCardSkeleton rows={6} />
    </>
  );
}
