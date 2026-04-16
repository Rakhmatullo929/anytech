import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import { useCheckPermission } from 'src/auth/hooks/use-check-permission';
import { useLocales } from 'src/locales';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

type AdminTabValue = 'users' | 'roles';

type Props = {
  value: AdminTabValue;
};

export default function AdminTabs({ value }: Props) {
  const { tx } = useLocales();
  const { canReadPage } = useCheckPermission();
  const showUsers = canReadPage('users');
  const showRoles = canReadPage('roles');
  const resolvedValue = (value === 'users' && showUsers) || (value === 'roles' && showRoles) ? value : false;

  return (
    <Tabs value={resolvedValue} aria-label="admin section tabs" sx={{ mb: 3 }}>
      {showUsers ? (
        <Tab component={RouterLink} href={paths.admin.users.root} label={tx('admin.tabs.users')} value="users" />
      ) : null}
      {showRoles ? (
        <Tab component={RouterLink} href={paths.admin.roles} label={tx('admin.tabs.roles')} value="roles" />
      ) : null}
    </Tabs>
  );
}
