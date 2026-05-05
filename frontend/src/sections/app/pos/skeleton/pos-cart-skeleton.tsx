import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

import { useSettingsContext } from 'src/components/settings';

export default function PosCartSkeleton() {
  const settings = useSettingsContext();

  return (
    <Card
      sx={{
        width: { xs: 1, md: 380 },
        p: 2,
        position: { md: 'sticky' },
        top: settings.themeLayout === 'horizontal' ? 88 : 24,
        alignSelf: 'flex-start',
      }}
    >
      <Skeleton variant="text" width={120} height={28} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="80%" height={20} />

      <Divider sx={{ my: 2 }} />

      <Stack spacing={2}>
        <Skeleton variant="rounded" height={40} />
        <Skeleton variant="rounded" height={40} />
        <Stack direction="row" justifyContent="space-between">
          <Skeleton variant="text" width={60} />
          <Skeleton variant="text" width={80} />
        </Stack>
        <Skeleton variant="rounded" height={42} />
      </Stack>
    </Card>
  );
}
