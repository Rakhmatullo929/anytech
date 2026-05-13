import { useMemo } from 'react';
import type { SxProps } from '@mui/material/styles';
import { useLocales } from 'src/locales';
import Chart, { useChart } from 'src/components/chart';
import ReportChartCard from './report-chart-card';
import type { DailyPoint } from '../api/types';

type Props = {
  data: DailyPoint[];
  isFetching: boolean;
  hasPreviousData: boolean;
  height?: number;
  sx?: SxProps;
};

export default function RevenueTrendChart({ data, isFetching, hasPreviousData, height = 280, sx }: Props) {
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
      sx={sx}
    >
      <Chart type="area" series={series} options={options} height={height} />
    </ReportChartCard>
  );
}
