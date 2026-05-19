import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Unstable_Grid2';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { ChartCardSkeleton, StatCardSkeleton, TableCardSkeleton } from '../../components';

export default function DebtReportSkeleton() {
  return (
    <>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[0, 1, 2, 3].map((i) => (
          <Grid key={i} xs={12} sm={6} md={3}>
            <StatCardSkeleton />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={12} md={4}>
          <ChartCardSkeleton height={260} sx={{ height: '100%' }} />
        </Grid>
        <Grid xs={12} md={8}>
          <ChartCardSkeleton height={260} sx={{ height: '100%' }} />
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2}>
            <Skeleton variant="rounded" width={100} height={24} />
            <Skeleton variant="rounded" width={100} height={24} />
          </Stack>
        </CardContent>
      </Card>

      <TableCardSkeleton rows={5} />
    </>
  );
}
