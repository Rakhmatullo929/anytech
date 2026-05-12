import Grid from '@mui/material/Unstable_Grid2';
import { ChartCardSkeleton, StatCardSkeleton, TableCardSkeleton } from '../../components';

export default function CustomerReportSkeleton() {
  return (
    <>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[0, 1].map((i) => (
          <Grid key={i} xs={12} sm={6}>
            <StatCardSkeleton />
          </Grid>
        ))}
      </Grid>

      <ChartCardSkeleton height={280} sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        <Grid xs={12} md={7}>
          <TableCardSkeleton rows={5} />
        </Grid>
        <Grid xs={12} md={5}>
          <TableCardSkeleton rows={5} />
        </Grid>
      </Grid>
    </>
  );
}
