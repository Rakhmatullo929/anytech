import { useMemo } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useLocales } from 'src/locales';
import Chart, { useChart } from 'src/components/chart';
import { ReportChartCard } from '../../components';
import type { PaymentTypeBreakdown } from '../../api/types';

type Props = {
  data: PaymentTypeBreakdown[];
  isFetching: boolean;
  hasPreviousData: boolean;
};

export default function PaymentTypeChart({ data, isFetching, hasPreviousData }: Props) {
  const { tx } = useLocales();

  const paymentLabels: Record<string, string> = useMemo(
    () => ({
      cash: tx('common.payment.cash'),
      card: tx('common.payment.card'),
      transfer: tx('common.payment.transfer'),
      debt: tx('common.payment.debt'),
    }),
    [tx]
  );

  const options = useChart({
    labels: data.map((p) => paymentLabels[p.paymentType] ?? p.paymentType),
    legend: { position: 'bottom', horizontalAlign: 'center' },
    plotOptions: { pie: { donut: { size: '70%' } } },
  });

  const series = data.map((p) => p.count);

  return (
    <ReportChartCard
      title={tx('reports.charts.byPaymentType')}
      isFetching={isFetching}
      hasPreviousData={hasPreviousData}
      sx={{ height: '100%' }}
    >
      {series.length > 0 ? (
        <Chart type="donut" series={series} options={options} height={260} />
      ) : (
        <Stack alignItems="center" justifyContent="center" sx={{ height: 260 }}>
          <Typography variant="body2" color="text.secondary">
            {tx('common.table.noData')}
          </Typography>
        </Stack>
      )}
    </ReportChartCard>
  );
}
