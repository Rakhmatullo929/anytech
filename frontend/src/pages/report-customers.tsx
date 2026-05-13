import { Helmet } from 'react-helmet-async';
import { useLocales } from 'src/locales';
import CustomerReportView from 'src/sections/app/reports/customers/view';

export default function ReportCustomersPage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('reports.documentTitle.customers')}</title>
      </Helmet>
      <CustomerReportView />
    </>
  );
}
