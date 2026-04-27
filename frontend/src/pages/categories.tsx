import { Helmet } from 'react-helmet-async';

import { useLocales } from 'src/locales';
import CategoriesView from 'src/sections/app/categories/view';

export default function CategoriesPage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('common.navigation.categories')}</title>
      </Helmet>
      <CategoriesView />
    </>
  );
}
