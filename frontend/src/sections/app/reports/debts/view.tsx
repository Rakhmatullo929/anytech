import { useLocales } from 'src/locales';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Unstable_Grid2';
import { paths } from 'src/routes/paths';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { DateRangeFilter, TopDebtorsPaginatedTable } from '../components';
import { useDebtReportQuery, useReportDateRange } from '../api';
import DebtStatCards from './components/stat-cards';
import DebtStatusChart from './components/status-chart';
import DebtPaymentTrend from './components/payment-trend';
import DebtStatusSummary from './components/status-summary';
import { DebtReportSkeleton } from './skeleton';

export default function DebtReportView() {
  const { tx } = useLocales();
  const { dateFrom, dateTo, setValues } = useReportDateRange();
  const { data, isPending, isFetching } = useDebtReportQuery({ dateFrom, dateTo });

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('reports.heading.debts')}
        links={[
          { name: tx('common.navigation.reports') },
          { name: tx('common.navigation.reportDebts'), href: paths.reports.debts },
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
        <DebtReportSkeleton />
      ) : (
        <>
          <DebtStatCards data={data} loading={isPending} />

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid xs={12} md={4}>
              <DebtStatusChart
                data={data?.statusBreakdown ?? []}
                isFetching={isFetching}
                hasPreviousData={!!data}
              />
            </Grid>
            <Grid xs={12} md={8}>
              <DebtPaymentTrend
                data={data?.paymentTrend ?? []}
                isFetching={isFetching}
                hasPreviousData={!!data}
              />
            </Grid>
          </Grid>

          <DebtStatusSummary data={data?.statusBreakdown ?? []} />

          <TopDebtorsPaginatedTable />
        </>
      )}
    </>
  );
}
