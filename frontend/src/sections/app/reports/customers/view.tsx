import { useLocales } from 'src/locales';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Unstable_Grid2';
import { paths } from 'src/routes/paths';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { DateRangeFilter, TopDebtorsPaginatedTable } from '../components';
import { useCustomerReportQuery, useReportDateRange } from '../api';
import CustomerStatCards from './components/stat-cards';
import CustomerRegistrationTrend from './components/registration-trend';
import TopCustomersTable from './components/top-customers-table';
import { CustomerReportSkeleton } from './skeleton';

export default function CustomerReportView() {
  const { tx } = useLocales();
  const { dateFrom, dateTo, setValues } = useReportDateRange();
  const { data, isPending, isFetching } = useCustomerReportQuery({ dateFrom, dateTo });

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('reports.heading.customers')}
        links={[
          { name: tx('common.navigation.reports') },
          { name: tx('common.navigation.reportCustomers'), href: paths.reports.customers },
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
        <CustomerReportSkeleton />
      ) : (
        <>
          <CustomerStatCards data={data} loading={isPending} />

          <CustomerRegistrationTrend
            data={data?.registrationTrend ?? []}
            isFetching={isFetching}
            hasPreviousData={!!data}
          />

          <Grid container spacing={3}>
            <Grid xs={12} md={7}>
              <TopCustomersTable dateFrom={dateFrom} dateTo={dateTo} />
            </Grid>
            <Grid xs={12} md={5}>
              <TopDebtorsPaginatedTable />
            </Grid>
          </Grid>
        </>
      )}
    </>
  );
}
