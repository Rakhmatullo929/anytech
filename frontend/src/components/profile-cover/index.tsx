import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { RouterLink } from 'src/routes/components';
import Iconify from 'src/components/iconify';

export type ProfileCoverChip = {
  key: string;
  icon: string;
  label: string;
};

type Props = {
  title: string;
  subtitle?: string;
  subtitleIcon?: string;
  editHref?: string;
  canEdit?: boolean;
  chips?: ProfileCoverChip[];
  editLabel: string;
  emptyLabel: string;
};

export default function ProfileCover({
  title,
  subtitle = '',
  subtitleIcon = 'solar:phone-calling-rounded-bold',
  editHref = '',
  canEdit = false,
  chips = [],
  editLabel,
  emptyLabel,
}: Props) {
  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2.5}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              width: 60,
              height: 60,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.14),
              color: 'primary.main',
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            {title.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ lineHeight: 1.2 }} noWrap>
              {title}
            </Typography>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.35 }}>
              <Iconify icon={subtitleIcon} width={15} />
              <Typography variant="body2" color="text.secondary">
                {subtitle || emptyLabel}
              </Typography>
            </Stack>
          </Box>
        </Stack>
        {canEdit && editHref ? (
          <Button
            component={RouterLink}
            href={editHref}
            variant="contained"
            color="inherit"
            size="medium"
            startIcon={<Iconify icon="solar:pen-bold" />}
            sx={{
              borderRadius: 1.5,
              px: 2,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              bgcolor: 'background.paper',
              color: 'text.primary',
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
                bgcolor: 'background.paper',
              },
            }}
          >
            {editLabel}
          </Button>
        ) : null}
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {chips.map((item) => (
          <Chip
            key={item.key}
            size="small"
            icon={<Iconify icon={item.icon} width={14} />}
            label={item.label}
            sx={{
              height: 34,
              borderRadius: 1.5,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
              border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
                border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
              },
              '& .MuiChip-label': {
                px: 1.1,
                fontSize: 13,
                fontWeight: 600,
                color: (theme) =>
                  item.label === emptyLabel ? theme.palette.text.disabled : theme.palette.text.primary,
              },
              '& .MuiChip-icon': {
                ml: 0.9,
                color: (theme) => (item.label === emptyLabel ? theme.palette.text.disabled : theme.palette.primary.main),
              },
            }}
          />
        ))}
      </Stack>
    </Card>
  );
}
