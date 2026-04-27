import { Helmet } from 'react-helmet-async';

import { useLocales } from 'src/locales';
import CategoryDetailsView from 'src/sections/app/categories/details/view';

export default function CategoryDetailsPage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('categories.detailDocumentTitle')}</title>
      </Helmet>
      <CategoryDetailsView />
    </>
  );
}
