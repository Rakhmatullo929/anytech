import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content';
import ProfileCover from 'src/components/profile-cover';
import { useLocales } from 'src/locales';
import { paths } from 'src/routes/paths';
import { fDate, fDateTime } from 'src/utils/format-time';
import { stringParam, useUrlQueryState } from 'src/hooks/use-url-query-state';

import { UserDetailsSkeleton } from '../admin/users/skeleton';
import {
  AccessTabPanel,
  ContactsTabPanel,
  DetailsTabs,
  OverviewTabPanel,
  type UserDetailsTabValue,
} from '../admin/users/details/components';
import { useMyProfileQuery } from './api';

// ----------------------------------------------------------------------

export default function ProfileView() {
  const { tx } = useLocales();
  const { data: user, isPending, isError } = useMyProfileQuery();
  const { values, setValues } = useUrlQueryState({ tab: stringParam('overview') });

  const fullName = useMemo(
    () => [user?.firstName, user?.lastName, user?.middleName].filter(Boolean).join(' '),
    [user?.firstName, user?.lastName, user?.middleName]
  );

  const notSetLabel = tx('clients.detail.notSet');

  const activeTab = ((): UserDetailsTabValue => {
    const raw = values.tab;
    if (raw === 'overview' || raw === 'contacts' || raw === 'access') return raw;
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

  if (isError || !user) {
    return <EmptyContent filled title={tx('users.detail.notFound')} />;
  }

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('profile.heading')}
        links={[{ name: tx('profile.heading'), href: paths.profile }]}
        sx={{ mb: { xs: 3, md: 4 } }}
      />

      <Stack spacing={2}>
        <ProfileCover
          title={fullName || user.phone || notSetLabel}
          subtitle={user.phone || ''}
          emptyLabel={notSetLabel}
          editLabel={tx('common.actions.edit')}
          chips={[
            {
              key: 'role',
              title: tx('users.table.role'),
              icon: 'solar:shield-user-bold',
              label: getRoleLabel(user.role),
            },
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

        <DetailsTabs
          value={activeTab}
          onChange={(nextTab) => setValues({ tab: nextTab })}
          labels={tabLabels}
        />

        {activeTab === 'overview' && (
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
              {
                label: tx('clients.form.fields.birthDate'),
                value: user.birthDate ? fDate(user.birthDate) : '',
              },
              {
                label: tx('common.table.gender'),
                value: user.gender ? tx(`users.genders.${user.gender}`) : '',
              },
              { label: tx('users.form.region'), value: user.region?.name || '' },
              { label: tx('clients.form.fields.city'), value: user.district?.name || '' },
            ]}
          />
        )}

        {activeTab === 'contacts' && (
          <ContactsTabPanel
            phoneTitle={tx('users.detail.sections.contacts')}
            emptyLabel={notSetLabel}
            contactItems={[
              {
                key: 'phone',
                icon: 'solar:phone-bold',
                label: tx('common.table.phone'),
                value: user.phone || '',
              },
              {
                key: 'email',
                icon: 'solar:letter-bold',
                label: tx('common.table.email'),
                value: user.email || '',
              },
            ]}
          />
        )}

        {activeTab === 'access' && (
          <AccessTabPanel
            title={tx('users.detail.sections.access')}
            emptyLabel={notSetLabel}
            items={[
              { label: tx('users.table.role'), value: getRoleLabel(user.role) },
              { label: tx('common.table.passportSeries'), value: user.passportSeries || '' },
              { label: tx('common.table.created'), value: fDateTime(user.createdAt) },
            ]}
          />
        )}
      </Stack>
    </>
  );
}
