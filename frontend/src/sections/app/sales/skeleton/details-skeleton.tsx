import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { TableHeadCustom } from 'src/components/table';

type Props = {
  headLabel: { id: string; label: string }[];
};

export default function SaleDetailsSkeleton({ headLabel }: Props) {
  return (
    <Stack spacing={3}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={1}>
          <Skeleton width={220} height={24} />
          <Skeleton width={180} height={22} />
          <Skeleton width={160} height={22} />
          <Skeleton width={200} height={28} />
        </Stack>
      </Card>

      <Card sx={{ p: 2 }}>
        <Skeleton width={180} height={32} sx={{ mb: 2 }} />
        <Table size="small">
          <TableHeadCustom headLabel={headLabel} />
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton width={160} height={20} />
                </TableCell>
                <TableCell>
                  <Skeleton width={70} height={20} />
                </TableCell>
                <TableCell>
                  <Skeleton width={100} height={20} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Stack>
  );
}
