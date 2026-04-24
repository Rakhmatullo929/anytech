import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';

import Scrollbar from 'src/components/scrollbar';
import { TableHeadCustom, TableSkeleton } from 'src/components/table';

const headLabel = [
  { id: 'name', label: '' },
  { id: 'phone', label: '' },
];

export default function ClientGroupDetailsSkeleton() {
  return (
    <Stack spacing={3}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={1.5}>
          <Skeleton variant="text" width={220} height={36} />
          <Skeleton variant="text" width="80%" height={24} />
        </Stack>
      </Card>

      <Card sx={{ p: 2 }}>
        <Scrollbar>
          <Table size="small">
            <TableHeadCustom headLabel={headLabel} />
            <TableBody>
              {Array.from({ length: 8 }).map((_, index) => (
                <TableSkeleton key={index} />
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </Card>
    </Stack>
  );
}
