import { Helmet } from 'react-helmet-async';
import { useLocales } from 'src/locales';
import ClientDetailsView from 'src/sections/app/clients/details/view';

export default function ClientDetailsPage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('pages.clients.detail_document_title')}</title>
      </Helmet>
      <ClientDetailsView />
    </>
  );
}
