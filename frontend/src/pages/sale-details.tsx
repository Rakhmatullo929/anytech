import { Helmet } from 'react-helmet-async';
import { useLocales } from 'src/locales';
import SaleDetailsView from 'src/sections/app/sale-details-view';

export default function SaleDetailsPage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('pages.sales.detail_document_title')}</title>
      </Helmet>
      <SaleDetailsView />
    </>
  );
}
