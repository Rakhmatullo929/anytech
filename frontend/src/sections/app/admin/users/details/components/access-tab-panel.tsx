import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type Props = {
  title: string;
  items: Array<{ label: string; value: string }>;
  emptyLabel: string;
};

export default function AccessTabPanel({ title, items, emptyLabel }: Props) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Grid container spacing={1.5}>
        {items.map((item) => (
          <Grid key={item.label} item xs={12} sm={6}>
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
  );
}
