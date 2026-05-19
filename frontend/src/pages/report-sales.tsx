import { Helmet } from 'react-helmet-async';
import { useLocales } from 'src/locales';
import SalesReportView from 'src/sections/app/reports/sales/view';

export default function ReportSalesPage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('reports.documentTitle.sales')}</title>
      </Helmet>
      <SalesReportView />
    </>
  );
}
