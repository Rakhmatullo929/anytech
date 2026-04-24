import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { useLocales } from 'src/locales';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

type ClientsTabValue = 'clients' | 'groups';

type Props = {
  value: ClientsTabValue;
};

export default function ClientsTabs({ value }: Props) {
  const { tx } = useLocales();

  return (
    <Tabs value={value} aria-label="clients section tabs" sx={{ mb: 3 }}>
      <Tab component={RouterLink} href={paths.clients.root} label={tx('clients.tabs.clients')} value="clients" />
      <Tab
        component={RouterLink}
        href={paths.clients.groups}
        label={tx('clients.tabs.groups')}
        value="groups"
      />
    </Tabs>
  );
}
