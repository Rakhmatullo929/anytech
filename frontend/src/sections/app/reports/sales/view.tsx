import { useLocales } from 'src/locales';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Unstable_Grid2';
import { paths } from 'src/routes/paths';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { DateRangeFilter, RevenueTrendChart } from '../components';
import { useSalesReportQuery, useReportDateRange } from '../api';
import SalesStatCards from './components/stat-cards';
import PaymentTypeChart from './components/payment-type-chart';
import TopProductsTable from './components/top-products-table';
import ByCategoryTable from './components/by-category-table';
import { SalesReportSkeleton } from './skeleton';

export default function SalesReportView() {
  const { tx } = useLocales();
  const { dateFrom, dateTo, setValues } = useReportDateRange();
  const { data, isPending, isFetching } = useSalesReportQuery({ dateFrom, dateTo });

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('reports.heading.sales')}
        links={[
          { name: tx('common.navigation.reports') },
          { name: tx('common.navigation.reportSales'), href: paths.reports.sales },
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
        <SalesReportSkeleton />
      ) : (
        <>
          <SalesStatCards data={data} loading={isPending} />

          <RevenueTrendChart
            data={data?.revenueTrend ?? []}
            isFetching={isFetching}
            hasPreviousData={!!data}
            sx={{ mb: 3 }}
          />

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid xs={12} md={4}>
              <PaymentTypeChart
                data={data?.byPaymentType ?? []}
                isFetching={isFetching}
                hasPreviousData={!!data}
              />
            </Grid>
            <Grid xs={12} md={8}>
              <TopProductsTable dateFrom={dateFrom} dateTo={dateTo} />
            </Grid>
          </Grid>

          <ByCategoryTable dateFrom={dateFrom} dateTo={dateTo} />
        </>
      )}
    </>
  );
}
