import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';

import Scrollbar from 'src/components/scrollbar';
import { TableHeadCustom, TablePaginationCustom, TableSkeleton } from 'src/components/table';

type Props = {
  headLabel: { id: string; label: string }[];
};

export default function GroupsListSkeleton({ headLabel }: Props) {
  return (
    <Card>
      <Stack spacing={2} sx={{ p: 2 }}>
        <Skeleton variant="rounded" width={360} height={40} />

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

        <TablePaginationCustom
          count={0}
          page={0}
          rowsPerPage={15}
          rowsPerPageOptions={[5, 10, 15, 25]}
          onPageChange={() => {}}
          onRowsPerPageChange={() => {}}
        />
      </Stack>
    </Card>
  );
}
