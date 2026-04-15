import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import EmptyContent from 'src/components/empty-content';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';
import { RouterLink } from 'src/routes/components';
import { fDateTime } from 'src/utils/format-time';
import { useLocales } from 'src/locales';

import { useTenantUserDetailQuery } from '../api';
import { UserRoleLabel } from '../components';
import { UserDetailsSkeleton } from '../skeleton';

export default function UserDetailsView() {
  const { tx } = useLocales();
  const { id = '' } = useParams();
  const { data: user, isPending } = useTenantUserDetailQuery(id);

  if (isPending) {
    return (
      <Box>
        <UserDetailsSkeleton />
      </Box>
    );
  }

  if (!user) {
    return (
      <EmptyContent
        filled
        title={tx('pages.users.detail.not_found')}
        action={
          <Button component={RouterLink} href={paths.admin.users.root} variant="contained">
            {tx('shared.actions.back_to_list')}
          </Button>
        }
      />
    );
  }

  return (
    <>
      <CustomBreadcrumbs
        heading={user.name || user.phone || '-'}
        links={[
          { name: tx('layout.nav.admin'), href: paths.admin.users.root },
          { name: tx('pages.admin.tabs.users'), href: paths.admin.users.root },
          { name: user.name || user.phone || '-', href: paths.admin.users.details(user.id) },
        ]}
        action={
          <Button component={RouterLink} href={paths.admin.users.edit(user.id)} variant="contained">
            {tx('shared.actions.edit')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Avatar sx={{ width: 52, height: 52, bgcolor: 'primary.main', fontWeight: 700 }}>
              {(user.name || user.phone || 'U').charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6">{user.name || '-'}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user.phone || '-'}
              </Typography>
            </Box>
            <UserRoleLabel role={user.role} label={tx(`pages.users.roles.${user.role}`)} />
          </Stack>
        </Card>

        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle1">{tx('pages.users.detail.info_title')}</Typography>
          <Divider sx={{ my: 2 }} />
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            }}
          >
            <Box>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {tx('shared.table.email')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user.email || '-'}
                </Typography>
              </Stack>
            </Box>
            <Box>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {tx('shared.table.gender')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user.gender ? tx(`pages.users.genders.${user.gender}`) : '-'}
                </Typography>
              </Stack>
            </Box>
            <Box>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {tx('shared.table.passport_series')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user.passportSeries || '-'}
                </Typography>
              </Stack>
            </Box>
            <Box>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Tenant ID
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user.tenantId || '-'}
                </Typography>
              </Stack>
            </Box>
            <Box sx={{ gridColumn: { md: '1 / -1' } }}>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {tx('shared.table.created')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {fDateTime(user.createdAt)}
                </Typography>
              </Stack>
            </Box>
          </Box>
        </Card>
      </Stack>
    </>
  );
}
