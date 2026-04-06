import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
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

export default function ClientDetailsSkeleton({ headLabel }: Props) {
  return (
    <Stack spacing={3}>
      <Card sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Avatar sx={{ width: 52, height: 52 }}>
            <Skeleton variant="circular" width={52} height={52} />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton width={220} height={30} />
            <Skeleton width={180} height={22} />
          </Box>
          <Skeleton variant="rounded" width={170} height={32} />
        </Stack>
      </Card>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} sx={{ p: 2.5, flex: 1 }}>
            <Skeleton width={110} height={18} />
            <Skeleton width={90} height={36} />
          </Card>
        ))}
      </Stack>

      <Card sx={{ p: 2 }}>
        <Skeleton width={210} height={30} sx={{ mb: 2 }} />
        <Divider sx={{ mb: 2 }} />
        <Table size="small">
          <TableHeadCustom headLabel={headLabel} />
          <TableBody>
            {Array.from({ length: 6 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton width={120} height={20} />
                </TableCell>
                <TableCell>
                  <Skeleton width={90} height={24} />
                </TableCell>
                <TableCell>
                  <Skeleton width={100} height={20} />
                </TableCell>
                <TableCell>
                  <Skeleton width={130} height={20} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Stack>
  );
}
