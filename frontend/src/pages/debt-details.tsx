import { Helmet } from 'react-helmet-async';
import { useLocales } from 'src/locales';
import DebtDetailsView from 'src/sections/app/depts/details/view';

export default function DebtDetailsPage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('debts.detailDocumentTitle')}</title>
      </Helmet>
      <DebtDetailsView />
    </>
  );
}
