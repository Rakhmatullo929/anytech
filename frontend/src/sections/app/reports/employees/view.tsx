import { useLocales } from 'src/locales';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Unstable_Grid2';
import { paths } from 'src/routes/paths';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { DateRangeFilter, RevenueTrendChart } from '../components';
import { useEmployeeReportQuery, useReportDateRange } from '../api';
import EmployeeStatCards from './components/stat-cards';
import EmployeePerformanceChart from './components/performance-chart';
import EmployeesTable from './components/employees-table';
import { EmployeeReportSkeleton } from './skeleton';

export default function EmployeeReportView() {
  const { tx } = useLocales();
  const { dateFrom, dateTo, setValues } = useReportDateRange();
  const { data, isPending, isFetching } = useEmployeeReportQuery({ dateFrom, dateTo });

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('reports.heading.employees')}
        links={[
          { name: tx('common.navigation.reports') },
          { name: tx('common.navigation.reportEmployees'), href: paths.reports.employees },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <DateRangeFilter
            dateFrom={dateFrom}
            dateTo={dateTo}
            labelFrom={tx('reports.filters.dateFrom')}
            labelTo={tx('reports.filters.dateTo')}
            onDateFromChange={(v) => setValues({ date_from: v })}
            onDateToChange={(v) => setValues({ date_to: v })}
          />
        </CardContent>
      </Card>

      {isPending && !data ? (
        <EmployeeReportSkeleton />
      ) : (
        <>
          <EmployeeStatCards data={data} loading={isPending} />

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid xs={12} md={6}>
              <EmployeePerformanceChart
                employees={data?.topEmployees ?? []}
                isFetching={isFetching}
                hasPreviousData={!!data}
              />
            </Grid>
            <Grid xs={12} md={6}>
              <RevenueTrendChart
                data={data?.revenueTrend ?? []}
                isFetching={isFetching}
                hasPreviousData={!!data}
                height={240}
                sx={{ height: '100%' }}
              />
            </Grid>
          </Grid>

          <EmployeesTable dateFrom={dateFrom} dateTo={dateTo} />
        </>
      )}
    </>
  );
}
