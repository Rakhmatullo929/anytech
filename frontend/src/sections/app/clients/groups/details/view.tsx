import { useMemo } from 'react';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content';
import Scrollbar from 'src/components/scrollbar';
import { TableHeadCustom, TableNoData } from 'src/components/table';
import { useLocales } from 'src/locales';
import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';

import ClientsTabs from '../../components/clients-tabs';
import { useGroupDetailQuery } from '../api/use-groups-api';
import { ClientGroupDetailsSkeleton } from '../skeleton';

export default function ClientGroupDetailsView() {
  const { tx } = useLocales();
  const { id = '' } = useParams();
  const { data, isPending } = useGroupDetailQuery(id);

  const tableHead = useMemo(
    () => [
      { id: 'name', label: tx('common.table.client') },
      { id: 'phone', label: tx('common.table.phone') },
    ],
    [tx]
  );

  if (isPending) {
    return <ClientGroupDetailsSkeleton />;
  }

  if (!data) {
    return (
      <EmptyContent
        filled
        title={tx('clients.groups.notFound')}
      />
    );
  }

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('clients.groups.detailTitle')}
        links={[
          { name: tx('common.navigation.clients'), href: paths.clients.root },
          { name: tx('clients.tabs.groups'), href: paths.clients.groups },
          { name: data.name, href: paths.clients.groupsDetails(data.id) },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ClientsTabs value="groups" />

      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h5">{data.name}</Typography>
              <Chip size="small" label={tx('clients.groups.clientsCount', { count: data.clientsCount })} />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {data.description || tx('clients.groups.emptyDescription')}
            </Typography>
          </Stack>
        </Card>

        <Card sx={{ p: 2 }}>
          <Scrollbar>
            <Table size="small">
              <TableHeadCustom headLabel={tableHead} rowCount={data.clients.length} />
              <TableBody>
                {data.clients.map((client) => (
                  <TableRow key={client.id} hover>
                    <TableCell>
                      <Link component={RouterLink} href={paths.clients.details(client.id)} variant="subtitle2">
                        {client.name}
                      </Link>
                    </TableCell>
                    <TableCell>{client.phone}</TableCell>
                  </TableRow>
                ))}
                <TableNoData notFound={!data.clients.length} title={tx('common.table.noData')} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Card>
      </Stack>
    </>
  );
}
