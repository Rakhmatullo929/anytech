import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import EmptyContent from 'src/components/empty-content';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import ProfileCover from 'src/components/profile-cover';
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';
import { RouterLink } from 'src/routes/components';
import { fDate, fDateTime } from 'src/utils/format-time';
import { useLocales } from 'src/locales';
import { useCheckPermission } from 'src/auth/hooks/use-check-permission';

import { useTenantUserDetailQuery } from '../api';
import { UserRoleLabel } from '../components';
import { UserDetailsSkeleton } from '../skeleton';

export default function UserDetailsView() {
  const { tx } = useLocales();
  const { canWritePage } = useCheckPermission();
  const { id = '' } = useParams();
  const { data: user, isPending } = useTenantUserDetailQuery(id);
  const canWriteUsers = canWritePage('users');
  const fullName = [user?.firstName, user?.lastName, user?.middleName].filter(Boolean).join(' ');
  const notSetLabel = '-';

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
        title={tx('users.detail.notFound')}
        action={
          <Button component={RouterLink} href={paths.admin.users.root} variant="contained">
            {tx('common.actions.backToList')}
          </Button>
        }
      />
    );
  }

  return (
    <>
      <CustomBreadcrumbs
        heading={fullName || user.phone || '-'}
        links={[
          { name: tx('common.navigation.admin'), href: paths.admin.users.root },
          { name: tx('admin.tabs.users'), href: paths.admin.users.root },
          { name: fullName || user.phone || '-', href: paths.admin.users.details(user.id) },
        ]}
        action={
          canWriteUsers ? (
            <Button component={RouterLink} href={paths.admin.users.edit(user.id)} variant="contained">
              {tx('common.actions.edit')}
            </Button>
          ) : null
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={2}>
        <ProfileCover
          title={fullName || user.phone || notSetLabel}
          subtitle={user.phone || ''}
          editHref={paths.admin.users.edit(user.id)}
          canEdit={canWriteUsers}
          editLabel={tx('common.actions.edit')}
          emptyLabel={notSetLabel}
          chips={[
            { key: 'role', icon: 'solar:shield-user-bold', label: tx(`users.roles.${user.role}`) },
            {
              key: 'gender',
              icon: user.gender === 'female' ? 'solar:female-bold' : 'solar:male-bold',
              label: user.gender ? tx(`users.genders.${user.gender}`) : notSetLabel,
            },
            {
              key: 'region',
              icon: 'solar:map-point-bold',
              label: user.region?.name || notSetLabel,
            },
            {
              key: 'district',
              icon: 'solar:city-bold',
              label: user.district?.name || notSetLabel,
            },
          ]}
        />

        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle1">{tx('users.detail.infoTitle')}</Typography>
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
                  {tx('common.table.email')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user.email || '-'}
                </Typography>
              </Stack>
            </Box>
            <Box>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {tx('clients.form.fields.name')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user.firstName || notSetLabel}
                </Typography>
              </Stack>
            </Box>
            <Box>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {tx('clients.form.fields.lastName')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user.lastName || notSetLabel}
                </Typography>
              </Stack>
            </Box>
            <Box>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {tx('clients.form.fields.middleName')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user.middleName || notSetLabel}
                </Typography>
              </Stack>
            </Box>
            <Box>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {tx('clients.form.fields.birthDate')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user.birthDate ? fDate(user.birthDate) : notSetLabel}
                </Typography>
              </Stack>
            </Box>
            <Box>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {tx('common.table.gender')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user.gender ? tx(`users.genders.${user.gender}`) : notSetLabel}
                </Typography>
              </Stack>
            </Box>
            <Box>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {tx('common.table.passportSeries')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user.passportSeries || notSetLabel}
                </Typography>
              </Stack>
            </Box>
            <Box>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {tx('users.form.region')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user.region?.name || notSetLabel}
                </Typography>
              </Stack>
            </Box>
            <Box>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {tx('clients.form.fields.city')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user.district?.name || notSetLabel}
                </Typography>
              </Stack>
            </Box>
            <Box>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Tenant ID
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user.tenantId || notSetLabel}
                </Typography>
              </Stack>
            </Box>
            <Box sx={{ gridColumn: { md: '1 / -1' }, display: 'flex', justifyContent: 'flex-end', pt: 0.5 }}>
              <UserRoleLabel role={user.role} label={tx(`users.roles.${user.role}`)} />
            </Box>
            <Box sx={{ gridColumn: { md: '1 / -1' } }}>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {tx('common.table.created')}
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
