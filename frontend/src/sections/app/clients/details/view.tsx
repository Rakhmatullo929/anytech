import { useMemo } from 'react';
import { useLocales } from 'src/locales';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import { fCurrency } from 'src/utils/format-number';
import { fDate, fDateTime } from 'src/utils/format-time';
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';
import { RouterLink } from 'src/routes/components';
import { useCheckPermission } from 'src/auth/hooks/use-check-permission';
import { stringParam, useUrlQueryState } from 'src/hooks/use-url-query-state';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content';
import ProfileCover from 'src/components/profile-cover';
import { useClientDetailQuery } from 'src/sections/app/clients/api/use-clients-api';
import { ClientDetailsSkeleton } from 'src/sections/app/clients/skeleton';
import {
  AddressesTabPanel,
  ContactsTabPanel,
  DebtsTabPanel,
  DetailsTabs,
  OverviewTabPanel,
  PurchasesTabPanel,
  type ClientDetailsTabValue,
} from './components';

const SKELETON_HEAD = [
  { id: 'id', label: '' },
  { id: 'pay', label: '' },
  { id: 'total', label: '' },
  { id: 'date', label: '' },
];

export default function ClientDetailsView() {
  const { tx } = useLocales();
  const notSetLabel = tx('clients.detail.notSet');
  const { canWritePage } = useCheckPermission();
  const { id = '' } = useParams();
  const { data: client, isPending } = useClientDetailQuery(id);
  const canEditClient = canWritePage('clients');
  const { values, setValues } = useUrlQueryState({ tab: stringParam('overview') });

  const fullName = useMemo(
    () => [client?.name, client?.lastName, client?.middleName].filter(Boolean).join(' '),
    [client?.name, client?.lastName, client?.middleName]
  );

  const genderLabel = useMemo(() => {
    if (client?.gender === 'male') return tx('users.genders.male');
    if (client?.gender === 'female') return tx('users.genders.female');
    return '';
  }, [client?.gender, tx]);

  const maritalLabel = useMemo(() => {
    if (client?.maritalStatus === 'married') return tx('clients.form.marital.married');
    if (client?.maritalStatus === 'single') return tx('clients.form.marital.single');
    return '';
  }, [client?.maritalStatus, tx]);

  const genderIcon = (() => {
    if (client?.gender === 'female') return 'solar:female-bold';
    if (client?.gender === 'male') return 'solar:male-bold';
    return 'solar:user-bold';
  })();

  const socialItems = useMemo(
    () => [
      { key: 'email', icon: 'solar:letter-bold', label: tx('common.table.email'), value: client?.socialNetworks?.email || '' },
      { key: 'telegram', icon: 'logos:telegram', label: tx('clients.form.fields.telegram'), value: client?.socialNetworks?.telegram || '' },
      { key: 'instagram', icon: 'skill-icons:instagram', label: tx('clients.form.fields.instagram'), value: client?.socialNetworks?.instagram || '' },
      { key: 'facebook', icon: 'logos:facebook', label: tx('clients.form.fields.facebook'), value: client?.socialNetworks?.facebook || '' },
    ],
    [client?.socialNetworks, tx]
  );

  const metadataChips = [
    {
      key: 'gender',
      title: tx('clients.form.fields.gender'),
      icon: genderIcon,
      label: genderLabel || notSetLabel,
    },
    {
      key: 'marital',
      title: tx('clients.form.fields.maritalStatus'),
      icon: 'solar:users-group-two-rounded-bold',
      label: maritalLabel || notSetLabel,
    },
  ];

  const tabLabels: Record<ClientDetailsTabValue, string> = {
    overview: tx('clients.detail.tabs.overview'),
    contacts: tx('clients.detail.tabs.contacts'),
    addresses: tx('clients.detail.tabs.addresses'),
    purchases: tx('clients.detail.tabs.purchases'),
    debts: tx('clients.detail.tabs.debts'),
  };

  const activeTab = ((): ClientDetailsTabValue => {
    const raw = values.tab;
    if (raw === 'overview' || raw === 'contacts' || raw === 'addresses' || raw === 'purchases' || raw === 'debts') {
      return raw;
    }
    return 'overview';
  })();

  if (isPending) {
    return (
      <Box>
        <ClientDetailsSkeleton headLabel={SKELETON_HEAD} />
      </Box>
    );
  }

  if (!client) {
    return (
      <EmptyContent
        filled
        title={tx('clients.detail.notFound')}
        action={
          <Button component={RouterLink} href={paths.clients.root} variant="contained">
            {tx('common.actions.backToList')}
          </Button>
        }
      />
    );
  }

  const fullNameResolved = fullName || client.name;
  const primaryPhone = client.phones?.[0] || client.phone || '';

  return (
    <>
      <CustomBreadcrumbs
        heading={fullNameResolved}
        links={[
          { name: tx('common.navigation.clients'), href: paths.clients.root },
          { name: fullNameResolved, href: paths.clients.details(client.id) },
        ]}
        sx={{ mb: { xs: 3, md: 4 } }}
      />

      <Stack spacing={2}>
        <ProfileCover
          title={fullNameResolved}
          subtitle={primaryPhone}
          editHref={paths.clients.edit(client.id)}
          canEdit={canEditClient}
          chips={metadataChips}
          editLabel={tx('common.actions.edit')}
          emptyLabel={notSetLabel}
        />

        <DetailsTabs value={activeTab} onChange={(nextTab) => setValues({ tab: nextTab })} labels={tabLabels} />

        {activeTab === 'overview' ? (
          <OverviewTabPanel
            title={tx('clients.detail.sections.personal')}
            emptyLabel={notSetLabel}
            stats={[
              { label: tx('common.navigation.sales'), value: client.salesCount },
              { label: tx('common.labels.total'), value: fCurrency(client.totalPurchasesAmount || '0') },
              { label: tx('common.table.created'), value: fDateTime(client.createdAt) },
            ]}
            infoItems={[
              { label: tx('clients.form.fields.name'), value: client.name || '' },
              { label: tx('clients.form.fields.lastName'), value: client.lastName || '' },
              { label: tx('clients.form.fields.middleName'), value: client.middleName || '' },
              { label: tx('clients.form.fields.birthDate'), value: client.birthDate ? fDate(client.birthDate) : '' },
              { label: tx('clients.form.fields.gender'), value: genderLabel },
              { label: tx('clients.form.fields.maritalStatus'), value: maritalLabel },
              { label: tx('clients.detail.firstPurchase'), value: client.firstPurchaseAt ? fDate(client.firstPurchaseAt) : '' },
              { label: tx('clients.detail.lastPurchase'), value: client.lastPurchaseAt ? fDate(client.lastPurchaseAt) : '' },
            ]}
          />
        ) : null}

        {activeTab === 'contacts' ? (
          <ContactsTabPanel
            phoneTitle={tx('clients.detail.sections.phones')}
            socialTitle={tx('clients.detail.sections.socialNetworks')}
            phones={client.phones || []}
            socialItems={socialItems}
            emptyLabel={notSetLabel}
          />
        ) : null}

        {activeTab === 'addresses' ? (
          <AddressesTabPanel
            title={tx('clients.detail.sections.addresses')}
            addresses={client.addresses || []}
            emptyLabel={notSetLabel}
            labels={{
              country: tx('clients.form.fields.country'),
              city: tx('clients.form.fields.city'),
              address: tx('clients.form.fields.address'),
              postalCode: tx('clients.form.fields.postalCode'),
              note: tx('clients.form.fields.note'),
            }}
          />
        ) : null}

        {activeTab === 'purchases' ? <PurchasesTabPanel clientId={client.id} /> : null}

        {activeTab === 'debts' ? <DebtsTabPanel clientId={client.id} /> : null}
      </Stack>
    </>
  );
}
