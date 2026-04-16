import { Helmet } from 'react-helmet-async';
import { useLocales } from 'src/locales';
import SalesView from 'src/sections/app/sales/view';

export default function SalesPage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('sales.documentTitle')}</title>
      </Helmet>
      <SalesView />
    </>
  );
}
