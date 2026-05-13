import { Helmet } from 'react-helmet-async';
import { useLocales } from 'src/locales';
import DebtReportView from 'src/sections/app/reports/debts/view';

export default function ReportDebtsPage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('reports.documentTitle.debts')}</title>
      </Helmet>
      <DebtReportView />
    </>
  );
}
