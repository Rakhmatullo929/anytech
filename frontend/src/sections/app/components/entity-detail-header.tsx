import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

type HeaderChip = {
  icon: string;
  label: string;
  variant?: 'filled' | 'outlined' | 'soft';
};

type Props = {
  title: string;
  description: string;
  icon: string;
  chips?: HeaderChip[];
};

export default function EntityDetailHeader({ title, description, icon, chips = [] }: Props) {
  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: 'primary.lighter',
              color: 'primary.main',
              width: 44,
              height: 44,
            }}
          >
            <Iconify icon={icon} width={22} />
          </Avatar>
          <Stack spacing={0.5}>
            <Typography variant="h5">{title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Stack>
        </Stack>

        {chips.length ? <Divider /> : null}

        {chips.length ? (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
            {chips.map((chip) => (
              <Chip
                key={`${chip.icon}-${chip.label}`}
                icon={<Iconify icon={chip.icon} width={16} />}
                size="small"
                variant={chip.variant ?? 'soft'}
                label={chip.label}
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Card>
  );
}
