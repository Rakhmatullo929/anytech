import { Helmet } from 'react-helmet-async';

import { useLocales } from 'src/locales';
import ClientGroupDetailsView from 'src/sections/app/clients/groups/details/view';

export default function ClientsGroupsDetailsPage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('clients.groups.detailDocumentTitle')}</title>
      </Helmet>
      <ClientGroupDetailsView />
    </>
  );
}
