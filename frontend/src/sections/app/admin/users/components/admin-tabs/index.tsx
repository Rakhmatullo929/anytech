import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import { useLocales } from 'src/locales';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import Can from 'src/auth/components/can';

type AdminTabValue = 'users' | 'roles';

type Props = {
  value: AdminTabValue;
};

export default function AdminTabs({ value }: Props) {
  const { tx } = useLocales();

  return (
    <Tabs value={value} aria-label="admin section tabs" sx={{ mb: 3 }}>
      <Can page="users" action="read">
        <Tab component={RouterLink} href={paths.admin.users.root} label={tx('pages.admin.tabs.users')} value="users" />
      </Can>
      <Can page="roles" action="read">
        <Tab component={RouterLink} href={paths.admin.roles} label={tx('pages.admin.tabs.roles')} value="roles" />
      </Can>
    </Tabs>
  );
}
