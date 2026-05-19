import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';

export default function RolesListSkeleton() {
  return (
    <Card sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Skeleton variant="text" width={180} height={30} />
        <Skeleton variant="text" width={320} height={22} />
        <Skeleton variant="rounded" height={64} />
        <Skeleton variant="rounded" height={64} />
        <Skeleton variant="rounded" height={64} />
      </Stack>
    </Card>
  );
}
