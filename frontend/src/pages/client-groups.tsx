import { Helmet } from 'react-helmet-async';

import { useLocales } from 'src/locales';
import { GroupsView } from 'src/sections/app/clients/groups';

export default function ClientGroupsPage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('clients.documentTitle')}</title>
      </Helmet>
      <GroupsView />
    </>
  );
}
