import { Helmet } from 'react-helmet-async';

import { useLocales } from 'src/locales';

import AdminRolesView from 'src/sections/app/admin/roles/view';

export default function AdminRolesPage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('admin.roles.documentTitle')}</title>
      </Helmet>
      <AdminRolesView />
    </>
  );
}
