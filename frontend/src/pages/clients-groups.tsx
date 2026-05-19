import { Helmet } from 'react-helmet-async';

import { useLocales } from 'src/locales';
import ClientGroupsView from 'src/sections/app/clients/groups/view';

export default function ClientsGroupsPage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('clients.groups.documentTitle')}</title>
      </Helmet>
      <ClientGroupsView />
    </>
  );
}
