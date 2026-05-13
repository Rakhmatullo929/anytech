import { Helmet } from 'react-helmet-async';
import { useLocales } from 'src/locales';
import EmployeeReportView from 'src/sections/app/reports/employees/view';

export default function ReportEmployeesPage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('reports.documentTitle.employees')}</title>
      </Helmet>
      <EmployeeReportView />
    </>
  );
}
