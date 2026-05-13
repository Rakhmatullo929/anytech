import type { ReactNode } from 'react';
import type { SxProps } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import LinearProgress from '@mui/material/LinearProgress';

type Props = {
  title: string;
  isFetching?: boolean;
  hasPreviousData?: boolean;
  children: ReactNode;
  sx?: SxProps;
  contentSx?: SxProps;
};

export default function ReportChartCard({
  title,
  isFetching,
  hasPreviousData,
  children,
  sx,
  contentSx,
}: Props) {
  return (
    <Card sx={sx}>
      {isFetching && hasPreviousData ? (
        <LinearProgress sx={{ borderRadius: 1 }} />
      ) : (
        <Box sx={{ height: 4 }} />
      )}
      <CardHeader title={title} />
      <CardContent sx={contentSx}>{children}</CardContent>
    </Card>
  );
}
