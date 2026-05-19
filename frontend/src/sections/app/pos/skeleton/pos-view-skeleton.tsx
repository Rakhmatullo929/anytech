import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

import PosCartSkeleton from './pos-cart-skeleton';
import PosProductListSkeleton from './pos-product-list-skeleton';

export default function PosViewSkeleton() {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
      <Card sx={{ flex: 1, p: 2 }}>
        <Skeleton variant="text" width={140} height={28} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
        <PosProductListSkeleton />
      </Card>

      <PosCartSkeleton />
    </Stack>
  );
}
