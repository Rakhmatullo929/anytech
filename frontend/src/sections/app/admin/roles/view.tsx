import Box from '@mui/material/Box';

import { useLocales } from 'src/locales';
import { paths } from 'src/routes/paths';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content';

import AdminTabs from '../users/components/admin-tabs';

export default function AdminRolesView() {
  const { tx } = useLocales();

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('layout.nav.admin')}
        links={[
          { name: tx('layout.nav.admin'), href: paths.admin.users.root },
          { name: tx('pages.admin.tabs.roles'), href: paths.admin.roles },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <AdminTabs value="roles" />
      <Box>
        <EmptyContent filled title={tx('pages.admin.roles.empty')} />
      </Box>
    </>
  );
}
