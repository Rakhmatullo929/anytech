import { Helmet } from 'react-helmet-async';
import { useLocales } from 'src/locales';
import ClientsView from 'src/sections/app/clients-view';

export default function ClientsPage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('pages.clients.document_title')}</title>
      </Helmet>
      <ClientsView />
    </>
  );
}
