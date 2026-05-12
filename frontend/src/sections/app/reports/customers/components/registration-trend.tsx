import { useMemo } from 'react';
import { useLocales } from 'src/locales';
import Chart, { useChart } from 'src/components/chart';
import { ReportChartCard } from '../../components';
import type { MonthlyPoint } from '../../api/types';

type Props = {
  data: MonthlyPoint[];
  isFetching: boolean;
  hasPreviousData: boolean;
};

export default function CustomerRegistrationTrend({ data, isFetching, hasPreviousData }: Props) {
  const { tx } = useLocales();

  const options = useChart({
    xaxis: { categories: data.map((p) => p.month) },
    tooltip: { x: { show: true } },
  });

  const series = useMemo(
    () => [{ name: tx('reports.stats.newInPeriod'), data: data.map((p) => p.count) }],
    [data, tx]
  );

  return (
    <ReportChartCard
      title={tx('reports.charts.registrationTrend')}
      isFetching={isFetching}
      hasPreviousData={hasPreviousData}
      sx={{ mb: 3 }}
    >
      <Chart type="area" series={series} options={options} height={280} />
    </ReportChartCard>
  );
}
