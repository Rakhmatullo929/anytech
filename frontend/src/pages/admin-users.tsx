import { Helmet } from 'react-helmet-async';
import { useLocales } from 'src/locales';

import AdminUsersView from 'src/sections/app/admin/users/view';

export default function AdminUsersPage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('pages.users.document_title')}</title>
      </Helmet>
      <AdminUsersView />
    </>
  );
}
