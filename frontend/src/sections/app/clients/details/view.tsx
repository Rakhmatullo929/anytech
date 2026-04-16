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
import { useClientDetailQuery } from 'src/sections/app/clients/api/use-clients-api';
import { ClientDetailsSkeleton } from 'src/sections/app/clients/skeleton';
import {
  AddressesTabPanel,
  ContactsTabPanel,
  DetailsTabs,
  OverviewTabPanel,
  ProfileCover,
  PurchasesTabPanel,
  type ClientDetailsTabValue,
} from './components';

export default function ClientDetailsView() {
  const { tx } = useLocales();
  const notSetLabel = tx('pages.clients.detail.not_set');
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
      uz: tx('pages.clients.form.languages.uz'),
      ru: tx('pages.clients.form.languages.ru'),
      en: tx('pages.clients.form.languages.en'),
    };
    return map[client.communicationLanguage] || client.communicationLanguage;
  }, [client?.communicationLanguage, tx]);

  const genderLabel = useMemo(() => {
    if (client?.gender === 'male') return tx('pages.users.genders.male');
    if (client?.gender === 'female') return tx('pages.users.genders.female');
    return '';
  }, [client?.gender, tx]);

  const maritalLabel = useMemo(() => {
    if (client?.maritalStatus === 'married') return tx('pages.clients.form.marital.married');
    if (client?.maritalStatus === 'single') return tx('pages.clients.form.marital.single');
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
      { key: 'email', icon: 'solar:letter-bold', label: tx('shared.table.email'), value: client?.socialNetworks?.email || '' },
      { key: 'telegram', icon: 'logos:telegram', label: tx('pages.clients.form.fields.telegram'), value: client?.socialNetworks?.telegram || '' },
      { key: 'instagram', icon: 'skill-icons:instagram', label: tx('pages.clients.form.fields.instagram'), value: client?.socialNetworks?.instagram || '' },
      { key: 'facebook', icon: 'logos:facebook', label: tx('pages.clients.form.fields.facebook'), value: client?.socialNetworks?.facebook || '' },
    ],
    [client?.socialNetworks, tx]
  );

  const metadataChips = [
    { key: 'lang', icon: languageIcon, label: languageLabel || notSetLabel },
    {
      key: 'gender',
      icon: genderIcon,
      label: genderLabel || notSetLabel,
    },
    { key: 'marital', icon: 'solar:users-group-two-rounded-bold', label: maritalLabel || notSetLabel },
  ];

  const saleHead = useMemo(
    () => [
      { id: 'id', label: tx('shared.table.sale_id') },
      { id: 'pay', label: tx('shared.table.pay') },
      { id: 'total', label: tx('shared.table.total') },
      { id: 'date', label: tx('shared.table.date') },
    ],
    [tx]
  );

  const payLabel = useMemo(
    () => ({
      cash: tx('shared.payment.cash'),
      card: tx('shared.payment.card'),
      debt: tx('shared.payment.debt'),
    }),
    [tx]
  );

  const tabLabels: Record<ClientDetailsTabValue, string> = {
    overview: tx('pages.clients.detail.tabs.overview'),
    contacts: tx('pages.clients.detail.tabs.contacts'),
    addresses: tx('pages.clients.detail.tabs.addresses'),
    purchases: tx('pages.clients.detail.tabs.purchases'),
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
        title={tx('pages.clients.detail.not_found')}
        action={
          <Button component={RouterLink} href={paths.clients.root} variant="contained">
            {tx('shared.actions.back_to_list')}
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
          { name: tx('layout.nav.clients'), href: paths.clients.root },
          { name: fullNameResolved, href: paths.clients.details(client.id) },
        ]}
        sx={{ mb: { xs: 3, md: 4 } }}
      />

      <Stack spacing={2}>
        <ProfileCover
          fullName={fullNameResolved}
          primaryPhone={primaryPhone}
          editHref={paths.clients.edit(client.id)}
          canEdit={canEditClient}
          metadataChips={metadataChips}
          editLabel={tx('shared.actions.edit')}
          emptyLabel={notSetLabel}
        />

        <DetailsTabs value={activeTab} onChange={(nextTab) => setValues({ tab: nextTab })} labels={tabLabels} />

        {activeTab === 'overview' ? (
          <OverviewTabPanel
            title={tx('pages.clients.detail.sections.personal')}
            emptyLabel={notSetLabel}
            stats={[
              { label: tx('layout.nav.sales'), value: sales.length },
              { label: tx('shared.labels.total'), value: fCurrency(String(totalSpent || 0)) },
              { label: tx('shared.table.created'), value: fDateTime(client.createdAt) },
            ]}
            infoItems={[
              { label: tx('pages.clients.form.fields.name'), value: client.name || '' },
              { label: tx('pages.clients.form.fields.last_name'), value: client.lastName || '' },
              { label: tx('pages.clients.form.fields.middle_name'), value: client.middleName || '' },
              { label: tx('pages.clients.form.fields.birth_date'), value: client.birthDate ? fDate(client.birthDate) : '' },
              { label: tx('pages.clients.form.fields.communication_language'), value: languageLabel },
              { label: tx('pages.clients.form.fields.gender'), value: genderLabel },
              { label: tx('pages.clients.form.fields.marital_status'), value: maritalLabel },
              { label: tx('pages.clients.detail.first_purchase'), value: firstSaleDate },
              { label: tx('pages.clients.detail.last_purchase'), value: lastSaleDate },
            ]}
          />
        ) : null}

        {activeTab === 'contacts' ? (
          <ContactsTabPanel
            phoneTitle={tx('pages.clients.detail.sections.phones')}
            socialTitle={tx('pages.clients.detail.sections.social_networks')}
            phones={client.phones || []}
            socialItems={socialItems}
            emptyLabel={notSetLabel}
          />
        ) : null}

        {activeTab === 'addresses' ? (
          <AddressesTabPanel
            title={tx('pages.clients.detail.sections.addresses')}
            addresses={client.addresses || []}
            emptyLabel={notSetLabel}
            labels={{
              country: tx('pages.clients.form.fields.country'),
              city: tx('pages.clients.form.fields.city'),
              address: tx('pages.clients.form.fields.address'),
              postalCode: tx('pages.clients.form.fields.postal_code'),
              note: tx('pages.clients.form.fields.note'),
            }}
          />
        ) : null}

        {activeTab === 'purchases' ? (
          <PurchasesTabPanel
            title={tx('pages.clients.detail.purchase_history')}
            emptyDescription={tx('pages.clients.detail.no_purchases')}
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
