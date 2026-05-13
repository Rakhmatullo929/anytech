import { useMemo } from 'react';
import { useLocales } from 'src/locales';
import { fCurrency } from 'src/utils/format-number';
import Chart, { useChart } from 'src/components/chart';
import { ReportChartCard } from '../../components';
import type { EmployeeStats } from '../../api/types';

type Props = {
  employees: EmployeeStats[];
  isFetching: boolean;
  hasPreviousData: boolean;
};

export default function EmployeePerformanceChart({ employees, isFetching, hasPreviousData }: Props) {
  const { tx } = useLocales();

  const options = useChart({
    xaxis: { categories: employees.map((e) => e.name) },
    plotOptions: { bar: { horizontal: true, barHeight: '55%' } },
    tooltip: { y: { formatter: (val: number) => fCurrency(val) } },
  });

  const series = useMemo(
    () => [{ name: tx('reports.stats.totalRevenue'), data: employees.map((e) => Number(e.totalRevenue)) }],
    [employees, tx]
  );

  const height = Math.max(240, employees.length * 40 + 60);

  return (
    <ReportChartCard
      title={tx('reports.charts.employeePerformance')}
      isFetching={isFetching}
      hasPreviousData={hasPreviousData}
      sx={{ height: '100%' }}
    >
      <Chart type="bar" series={series} options={options} height={height} />
    </ReportChartCard>
  );
}
