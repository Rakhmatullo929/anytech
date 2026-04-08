import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';

export default function ProductDetailsSkeleton() {
  return (
    <Stack spacing={3}>
      <Card sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Avatar sx={{ width: 52, height: 52 }}>
            <Skeleton variant="circular" width={52} height={52} />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton width={220} height={30} />
            <Skeleton width={180} height={22} />
          </Box>
        </Stack>
      </Card>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} sx={{ p: 2.5, flex: 1 }}>
            <Skeleton width={120} height={18} />
            <Skeleton width={110} height={34} />
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
