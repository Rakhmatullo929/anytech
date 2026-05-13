import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

type Props = {
  title: string;
  value: string | number;
  color?: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
  icon?: ReactNode;
  loading?: boolean;
};

export default function ReportStatCard({ title, value, color = 'primary', icon, loading }: Props) {
  const theme = useTheme();
  const palette = theme.palette[color];

  return (
    <Card
      sx={{
        p: 3,
        bgcolor: alpha(palette.main, 0.08),
        border: `1px solid ${alpha(palette.main, 0.16)}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {loading && (
        <LinearProgress
          color={color}
          sx={{ position: 'absolute', top: 0, left: 0, right: 0, borderRadius: 0 }}
        />
      )}

      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Stack spacing={0.5}>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h4" color={`${color}.dark`}>
            {loading && !value ? '—' : value}
          </Typography>
        </Stack>

        {icon && (
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(palette.main, 0.16),
              color: `${color}.dark`,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        )}
      </Stack>
    </Card>
  );
}
