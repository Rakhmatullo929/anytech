import { Helmet } from 'react-helmet-async';
import { useLocales } from 'src/locales';
import ProductsView from 'src/sections/app/products/view';

export default function ProductsPage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('pages.products.document_title')}</title>
      </Helmet>
      <ProductsView />
    </>
  );
}
