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
  DetailsTabs,
  OverviewTabPanel,
  PurchasesTabPanel,
  type ClientDetailsTabValue,
} from './components';

export default function ClientDetailsView() {
  const { tx } = useLocales();
  const notSetLabel = tx('clients.detail.notSet');
  const { canDetailPage, canWritePage } = useCheckPermission();
  const { id = '' } = useParams();
  const { data: client, isPending } = useClientDetailQuery(id);
  const canDetailSales = canDetailPage('sales');
  const canEditClient = canWritePage('clients');
  const { values, setValues } = useUrlQueryState({ tab: stringParam('overview') });

  const sales = useMemo(
    () => [...(client?.sales ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [client?.sales]
  );
  const totalSpent = useMemo(
    () => sales.reduce((acc, sale) => acc + Number(sale.totalAmount || 0), 0),
    [sales]
  );
  const firstSaleDate = sales.length ? fDateTime(sales[sales.length - 1].createdAt) : '';
  const lastSaleDate = sales.length ? fDateTime(sales[0].createdAt) : '';
  const fullName = useMemo(
    () => [client?.name, client?.lastName, client?.middleName].filter(Boolean).join(' '),
    [client?.name, client?.lastName, client?.middleName]
  );

  const languageLabel = useMemo(() => {
    if (!client?.communicationLanguage) return '';
    const map: Record<string, string> = {
      uz: tx('clients.form.languages.uz'),
      ru: tx('clients.form.languages.ru'),
      en: tx('clients.form.languages.en'),
    };
    return map[client.communicationLanguage] || client.communicationLanguage;
  }, [client?.communicationLanguage, tx]);

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

  const languageIcon = (() => {
    switch (client?.communicationLanguage) {
      case 'uz':
        return 'flagpack:uz';
      case 'ru':
        return 'flagpack:ru';
      case 'en':
        return 'flagpack:gb-ukm';
      default:
        return 'solar:global-bold';
    }
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
    { key: 'lang', title: tx('clients.form.fields.communicationLanguage'), icon: languageIcon, label: languageLabel || notSetLabel },
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

  const saleHead = useMemo(
    () => [
      { id: 'id', label: tx('common.table.saleId') },
      { id: 'pay', label: tx('common.table.pay') },
      { id: 'total', label: tx('common.table.total') },
      { id: 'date', label: tx('common.table.date') },
    ],
    [tx]
  );

  const payLabel = useMemo(
    () => ({
      cash: tx('common.payment.cash'),
      card: tx('common.payment.card'),
      debt: tx('common.payment.debt'),
    }),
    [tx]
  );

  const tabLabels: Record<ClientDetailsTabValue, string> = {
    overview: tx('clients.detail.tabs.overview'),
    contacts: tx('clients.detail.tabs.contacts'),
    addresses: tx('clients.detail.tabs.addresses'),
    purchases: tx('clients.detail.tabs.purchases'),
  };

  const activeTab = ((): ClientDetailsTabValue => {
    const raw = values.tab;
    if (raw === 'overview' || raw === 'contacts' || raw === 'addresses' || raw === 'purchases') {
      return raw;
    }
    return 'overview';
  })();

  if (isPending) {
    return (
      <Box>
        <ClientDetailsSkeleton headLabel={saleHead} />
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
              { label: tx('common.navigation.sales'), value: sales.length },
              { label: tx('common.labels.total'), value: fCurrency(String(totalSpent || 0)) },
              { label: tx('common.table.created'), value: fDateTime(client.createdAt) },
            ]}
            infoItems={[
              { label: tx('clients.form.fields.name'), value: client.name || '' },
              { label: tx('clients.form.fields.lastName'), value: client.lastName || '' },
              { label: tx('clients.form.fields.middleName'), value: client.middleName || '' },
              { label: tx('clients.form.fields.birthDate'), value: client.birthDate ? fDate(client.birthDate) : '' },
              { label: tx('clients.form.fields.communicationLanguage'), value: languageLabel },
              { label: tx('clients.form.fields.gender'), value: genderLabel },
              { label: tx('clients.form.fields.maritalStatus'), value: maritalLabel },
              { label: tx('clients.detail.firstPurchase'), value: firstSaleDate },
              { label: tx('clients.detail.lastPurchase'), value: lastSaleDate },
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

        {activeTab === 'purchases' ? (
          <PurchasesTabPanel
            title={tx('clients.detail.purchaseHistory')}
            emptyDescription={tx('clients.detail.noPurchases')}
            headLabel={saleHead}
            sales={sales}
            canDetailSales={canDetailSales}
            getSaleHref={paths.sales.details}
            payLabels={payLabel}
          />
        ) : null}
      </Stack>
    </>
  );
}
