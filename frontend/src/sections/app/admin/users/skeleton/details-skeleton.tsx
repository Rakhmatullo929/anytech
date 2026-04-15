import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

export default function UserDetailsSkeleton() {
  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Skeleton variant="rounded" width={240} height={32} />
        <Skeleton variant="rounded" width="100%" height={84} />
        <Skeleton variant="rounded" width="100%" height={140} />
      </Stack>
    </Card>
  );
}
