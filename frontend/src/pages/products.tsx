import { Helmet } from 'react-helmet-async';
import ProductsView from 'src/sections/app/products-view';

export default function ProductsPage() {
  return (
    <>
      <Helmet>
        <title> Товары</title>
      </Helmet>
      <ProductsView />
    </>
  );
}
