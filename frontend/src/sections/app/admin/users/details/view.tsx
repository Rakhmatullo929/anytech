import { useMemo } from 'react';
import { useLocales } from 'src/locales';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import EmptyContent from 'src/components/empty-content';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import ProfileCover from 'src/components/profile-cover';
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';
import { RouterLink } from 'src/routes/components';
import { fDate, fDateTime } from 'src/utils/format-time';
import { useCheckPermission } from 'src/auth/hooks/use-check-permission';
import { stringParam, useUrlQueryState } from 'src/hooks/use-url-query-state';

import { useTenantUserDetailQuery } from '../api';
import { UserDetailsSkeleton } from '../skeleton';
import { AccessTabPanel, ContactsTabPanel, DetailsTabs, OverviewTabPanel, type UserDetailsTabValue } from './components';

export default function UserDetailsView() {
  const { tx } = useLocales();
  const { canWritePage } = useCheckPermission();
  const { id = '' } = useParams();
  const { data: user, isPending } = useTenantUserDetailQuery(id);
  const canWriteUsers = canWritePage('users');
  const { values, setValues } = useUrlQueryState({ tab: stringParam('overview') });
  const fullName = useMemo(
    () => [user?.firstName, user?.lastName, user?.middleName].filter(Boolean).join(' '),
    [user?.firstName, user?.lastName, user?.middleName]
  );
  const notSetLabel = tx('clients.detail.notSet');
  const activeTab = ((): UserDetailsTabValue => {
    const raw = values.tab;
    if (raw === 'overview' || raw === 'contacts' || raw === 'access') {
      return raw;
    }
    return 'overview';
  })();
  const tabLabels: Record<UserDetailsTabValue, string> = {
    overview: tx('users.detail.tabs.overview'),
    contacts: tx('users.detail.tabs.contacts'),
    access: tx('users.detail.tabs.access'),
  };
  const getRoleLabel = (role: string) => {
    const key = `users.roles.${role}`;
    const translated = tx(key);
    return translated === key ? role : translated;
  };

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
        sx={{ mb: { xs: 3, md: 4 } }}
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
            { key: 'role', title: tx('users.table.role'), icon: 'solar:shield-user-bold', label: getRoleLabel(user.role) },
            {
              key: 'gender',
              title: tx('common.table.gender'),
              icon: user.gender === 'female' ? 'mdi:gender-female' : 'mdi:gender-male',
              label: user.gender ? tx(`users.genders.${user.gender}`) : notSetLabel,
            },
            {
              key: 'region',
              title: tx('users.form.region'),
              icon: 'solar:map-point-bold',
              label: user.region?.name || notSetLabel,
            },
            {
              key: 'district',
              title: tx('clients.form.fields.city'),
              icon: 'solar:city-bold',
              label: user.district?.name || notSetLabel,
            },
          ]}
        />

        <DetailsTabs value={activeTab} onChange={(nextTab) => setValues({ tab: nextTab })} labels={tabLabels} />

        {activeTab === 'overview' ? (
          <OverviewTabPanel
            title={tx('users.detail.sections.personal')}
            emptyLabel={notSetLabel}
            stats={[
              { label: tx('users.table.role'), value: getRoleLabel(user.role) },
              { label: tx('common.table.created'), value: fDateTime(user.createdAt) },
              { label: tx('common.table.phone'), value: user.phone || notSetLabel },
            ]}
            infoItems={[
              { label: tx('clients.form.fields.name'), value: user.firstName || '' },
              { label: tx('clients.form.fields.lastName'), value: user.lastName || '' },
              { label: tx('clients.form.fields.middleName'), value: user.middleName || '' },
              { label: tx('clients.form.fields.birthDate'), value: user.birthDate ? fDate(user.birthDate) : '' },
              { label: tx('common.table.gender'), value: user.gender ? tx(`users.genders.${user.gender}`) : '' },
              { label: tx('users.form.region'), value: user.region?.name || '' },
              { label: tx('clients.form.fields.city'), value: user.district?.name || '' },
            ]}
          />
        ) : null}

        {activeTab === 'contacts' ? (
          <ContactsTabPanel
            phoneTitle={tx('users.detail.sections.contacts')}
            emptyLabel={notSetLabel}
            contactItems={[
              { key: 'phone', icon: 'solar:phone-bold', label: tx('common.table.phone'), value: user.phone || '' },
              { key: 'email', icon: 'solar:letter-bold', label: tx('common.table.email'), value: user.email || '' },
            ]}
          />
        ) : null}

        {activeTab === 'access' ? (
          <AccessTabPanel
            title={tx('users.detail.sections.access')}
            emptyLabel={notSetLabel}
            items={[
              { label: tx('users.table.role'), value: getRoleLabel(user.role) },
              { label: tx('common.table.passportSeries'), value: user.passportSeries || '' },
              { label: tx('common.table.created'), value: fDateTime(user.createdAt) },
            ]}
          />
        ) : null}
      </Stack>
    </>
  );
}
