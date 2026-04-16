import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { useLocales } from 'src/locales';
import { useAppUserProfile } from 'src/hooks/use-app-user-profile';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { fDateTime } from 'src/utils/format-time';

export default function ProfileView() {
  const { tx } = useLocales();
  const { user } = useAppUserProfile();
  const { role } = user;

  const displayName = user.displayName || '-';
  const email = user.email || '-';
  const phone = user.phoneNumber || '-';
  const gender = user.gender ? tx(`users.genders.${user.gender}`) : '-';
  const passportSeries = user.passportSeries || '-';
  const createdAt = user.createdAt ? fDateTime(user.createdAt) : '';

  const avatarInitial = displayName.trim().charAt(0).toUpperCase() || 'U';

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('profile.heading')}
        links={[{ name: tx('profile.heading'), href: '/profile' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        <Card
          sx={{
            p: 3,
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.primary.lighter} 0%, ${theme.palette.background.paper} 65%)`,
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontWeight: 700, fontSize: 28 }}>
              {avatarInitial}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4">{displayName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {email}
              </Typography>
            </Box>
            <Chip color="primary" variant="soft" label={tx(`users.roles.${role}`)} />
          </Stack>
        </Card>

        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle1">{tx('profile.personalInfo')}</Typography>
          <Divider sx={{ my: 2 }} />

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            }}
          >
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                {tx('common.table.phone')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {phone}
              </Typography>
            </Stack>

            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                {tx('common.table.gender')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {gender}
              </Typography>
            </Stack>

            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                {tx('common.table.passportSeries')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {passportSeries}
              </Typography>
            </Stack>

            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                {tx('common.table.created')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {createdAt || '-'}
              </Typography>
            </Stack>
          </Box>
        </Card>
      </Stack>
    </>
  );
}
