import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function GroupsPlaceholder() {
  return (
    <Card>
      <Stack spacing={1} sx={{ p: 3 }}>
        <Typography variant="h6">Groups</Typography>
        <Typography variant="body2" color="text.secondary">
          This section is intentionally empty for now.
        </Typography>
      </Stack>
    </Card>
  );
}
