import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type Props = {
  stats: Array<{ label: string; value: string | number }>;
  infoItems: Array<{ label: string; value: string }>;
  title: string;
  emptyLabel: string;
};

export default function OverviewTabPanel({ stats, infoItems, title, emptyLabel }: Props) {
  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        {stats.map((item) => (
          <Grid key={item.label} item xs={12} sm={4}>
            <Card sx={{ p: 2.25 }}>
              <Typography variant="caption" color="text.secondary">
                {item.label}
              </Typography>
              <Typography variant="h5" sx={{ mt: 0.5 }}>
                {item.value}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ p: 2.5 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>
        <Grid container spacing={1.5}>
          {infoItems.map((item) => (
            <Grid key={item.label} item xs={12} sm={6} md={4}>
              <Stack spacing={0.35}>
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="body2" color={item.value ? 'text.primary' : 'text.secondary'}>
                  {item.value || emptyLabel}
                </Typography>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Card>
    </Stack>
  );
}
