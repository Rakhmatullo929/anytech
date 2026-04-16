import { Helmet } from 'react-helmet-async';

import { useLocales } from 'src/locales';
import ClientFormView from 'src/sections/app/clients/form/view';

export default function ClientCreatePage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('clients.createDocumentTitle')}</title>
      </Helmet>
      <ClientFormView mode="create" />
    </>
  );
}
