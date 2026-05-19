import { useMemo } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useLocales } from 'src/locales';
import Chart, { useChart } from 'src/components/chart';
import { ReportChartCard } from '../../components';
import type { DebtStatusBreakdown } from '../../api/types';

type Props = {
  data: DebtStatusBreakdown[];
  isFetching: boolean;
  hasPreviousData: boolean;
};

export default function DebtStatusChart({ data, isFetching, hasPreviousData }: Props) {
  const { tx } = useLocales();

  const statusLabels: Record<string, string> = useMemo(
    () => ({
      active: tx('common.status.rowActive'),
      closed: tx('common.status.rowClosed'),
    }),
    [tx]
  );

  const options = useChart({
    labels: data.map((s) => statusLabels[s.status] ?? s.status),
    legend: { position: 'bottom', horizontalAlign: 'center' },
    plotOptions: { pie: { donut: { size: '70%' } } },
  });

  const series = data.map((s) => s.count);

  return (
    <ReportChartCard
      title={tx('reports.charts.debtStatus')}
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
