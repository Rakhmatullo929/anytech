import { Helmet } from 'react-helmet-async';
import { useLocales } from 'src/locales';
import ProductDetailsView from 'src/sections/app/products/details/view';

export default function ProductDetailsPage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('pages.products.detail_document_title')}</title>
      </Helmet>
      <ProductDetailsView />
    </>
  );
}
