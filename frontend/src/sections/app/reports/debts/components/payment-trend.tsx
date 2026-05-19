import { useMemo } from 'react';
import { useLocales } from 'src/locales';
import Chart, { useChart } from 'src/components/chart';
import { ReportChartCard } from '../../components';
import type { PaymentTrendPoint } from '../../api/types';

type Props = {
  data: PaymentTrendPoint[];
  isFetching: boolean;
  hasPreviousData: boolean;
};

export default function DebtPaymentTrend({ data, isFetching, hasPreviousData }: Props) {
  const { tx } = useLocales();

  const options = useChart({
    xaxis: { categories: data.map((p) => p.date) },
    tooltip: { x: { show: true } },
  });

  const series = useMemo(
    () => [{ name: tx('reports.tables.amount'), data: data.map((p) => Number(p.amount)) }],
    [data, tx]
  );

  return (
    <ReportChartCard
      title={tx('reports.charts.paymentTrend')}
      isFetching={isFetching}
      hasPreviousData={hasPreviousData}
      sx={{ height: '100%' }}
    >
      <Chart type="area" series={series} options={options} height={260} />
    </ReportChartCard>
  );
}
