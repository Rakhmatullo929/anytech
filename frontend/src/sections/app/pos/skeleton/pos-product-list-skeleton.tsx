import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

type Props = {
  rows?: number;
};

export default function PosProductListSkeleton({ rows = 8 }: Props) {
  return (
    <Stack spacing={0.5} sx={{ pb: { xs: 10, md: 0 } }}>
      {Array.from({ length: rows }).map((_, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 1.5,
            minHeight: { xs: 64, md: 48 },
            borderRadius: 1,
            border: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          {/* Name + caption */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Skeleton variant="text" width="55%" height={20} />
            <Skeleton variant="text" width="35%" height={16} />
          </Box>

          {/* Price + mobile add-button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            <Skeleton variant="text" width={56} height={20} />
            <Skeleton
              variant="rounded"
              width={38}
              height={38}
              sx={{ display: { xs: 'block', md: 'none' }, borderRadius: 1.5, flexShrink: 0 }}
            />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}
