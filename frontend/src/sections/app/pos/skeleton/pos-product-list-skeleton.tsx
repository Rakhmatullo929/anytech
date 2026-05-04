import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

type Props = {
  rows?: number;
};

export default function PosProductListSkeleton({ rows = 8 }: Props) {
  return (
    <Stack spacing={0.5}>
      {Array.from({ length: rows }).map((_, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1,
            borderRadius: 1,
            border: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="text" width="40%" height={16} />
          </Box>
          <Skeleton variant="text" width={64} height={20} />
        </Box>
      ))}
    </Stack>
  );
}
