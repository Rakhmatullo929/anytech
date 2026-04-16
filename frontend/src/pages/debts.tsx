import { Helmet } from 'react-helmet-async';
import { useLocales } from 'src/locales';
import DebtsView from 'src/sections/app/depts/view';

export default function DebtsPage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('debts.documentTitle')}</title>
      </Helmet>
      <DebtsView />
    </>
  );
}
