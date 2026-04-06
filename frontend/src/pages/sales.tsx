import { Helmet } from 'react-helmet-async';
import { useLocales } from 'src/locales';
import SalesView from 'src/sections/app/sales/view';

export default function SalesPage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('pages.sales.document_title')}</title>
      </Helmet>
      <SalesView />
    </>
  );
}
