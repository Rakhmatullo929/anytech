import { Helmet } from 'react-helmet-async';
import { useLocales } from 'src/locales';
import DebtDetailsView from 'src/sections/app/debt-details-view';

export default function DebtDetailsPage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('pages.debts.detail_document_title')}</title>
      </Helmet>
      <DebtDetailsView />
    </>
  );
}
