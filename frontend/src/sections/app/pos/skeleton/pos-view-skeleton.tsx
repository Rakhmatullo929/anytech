import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

import PosCartSkeleton from './pos-cart-skeleton';
import PosProductListSkeleton from './pos-product-list-skeleton';

export default function PosViewSkeleton() {

  return (
    <Box sx={{ mx: { xs: -2, md: 0 } }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
        {/* Product list — matches PosProductList card styles exactly */}
        <Card
          sx={{
            flex: 1,
            p: 2,
            width: 1,
            borderRadius: { xs: 0, md: 2 },
            '@media (max-width: 899px)': { boxShadow: 'none' },
            overflow: { xs: 'visible', md: 'hidden' },
          }}
        >
          <Skeleton variant="text" width={140} height={28} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
          <PosProductListSkeleton />
        </Card>

        {/* Cart — desktop only, on mobile it lives in a drawer */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, flexShrink: 0 }}>
          <PosCartSkeleton />
        </Box>
      </Stack>
    </Box>
  );
}
