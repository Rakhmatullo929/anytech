import type { SxProps } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import { TableSkeleton } from 'src/components/table';

export function StatCardSkeleton() {
  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Stack spacing={1}>
          <Skeleton width={120} height={14} />
          <Skeleton width={80} height={36} />
        </Stack>
        <Skeleton variant="rounded" width={44} height={44} />
      </Stack>
    </Card>
  );
}

type ChartCardSkeletonProps = { height?: number; sx?: SxProps };

export function ChartCardSkeleton({ height = 280, sx }: ChartCardSkeletonProps) {
  return (
    <Card sx={sx}>
      <Box sx={{ height: 4 }} />
      <CardHeader title={<Skeleton width={200} />} />
      <CardContent>
        <Skeleton variant="rounded" height={height} />
      </CardContent>
    </Card>
  );
}

type TableCardSkeletonProps = { rows?: number; sx?: SxProps };

export function TableCardSkeleton({ rows = 5, sx }: TableCardSkeletonProps) {
  return (
    <Card sx={sx}>
      <Box sx={{ height: 4 }} />
      <CardHeader title={<Skeleton width={160} />} />
      <CardContent sx={{ pt: 0 }}>
        <Table size="small">
          <TableBody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableSkeleton key={i} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
