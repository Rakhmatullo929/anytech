import { useMemo } from 'react';
import { useLocales } from 'src/locales';
import Chart, { useChart } from 'src/components/chart';
import { ReportChartCard } from '../../components';
import type { DailyPoint } from '../../api/types';

type Props = {
  data: DailyPoint[];
  isFetching: boolean;
  hasPreviousData: boolean;
};

export default function EmployeeRevenueTrend({ data, isFetching, hasPreviousData }: Props) {
  const { tx } = useLocales();

  const options = useChart({
    xaxis: { categories: data.map((p) => p.date) },
    tooltip: { x: { show: true } },
  });

  const series = useMemo(
    () => [{ name: tx('reports.stats.totalRevenue'), data: data.map((p) => Number(p.revenue)) }],
    [data, tx]
  );

  return (
    <ReportChartCard
      title={tx('reports.charts.revenueTrend')}
      isFetching={isFetching}
      hasPreviousData={hasPreviousData}
      sx={{ height: '100%' }}
    >
      <Chart type="area" series={series} options={options} height={240} />
    </ReportChartCard>
  );
}
