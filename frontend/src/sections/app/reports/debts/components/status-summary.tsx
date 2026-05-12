import { useMemo } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { fCurrency } from 'src/utils/format-number';
import { useLocales } from 'src/locales';
import type { DebtStatusBreakdown } from '../../api/types';

type Props = {
  data: DebtStatusBreakdown[];
};

export default function DebtStatusSummary({ data }: Props) {
  const { tx } = useLocales();

  const statusLabels: Record<string, string> = useMemo(
    () => ({
      active: tx('common.status.rowActive'),
      closed: tx('common.status.rowClosed'),
    }),
    [tx]
  );

  if (!data.length) return null;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          {data.map((s) => (
            <Stack key={s.status} direction="row" spacing={1} alignItems="center">
              <Chip
                label={statusLabels[s.status] ?? s.status}
                color={s.status === 'active' ? 'warning' : 'success'}
                size="small"
              />
              <Typography variant="body2">
                {s.count} — {fCurrency(s.total)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
