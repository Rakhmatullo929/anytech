import { Helmet } from 'react-helmet-async';
import { useLocales } from 'src/locales';
import SaleDetailsView from 'src/sections/app/sales/details/view';

export default function SaleDetailsPage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('sales.detailDocumentTitle')}</title>
      </Helmet>
      <SaleDetailsView />
    </>
  );
}
