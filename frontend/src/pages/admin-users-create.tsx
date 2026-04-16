import { Helmet } from 'react-helmet-async';
import { useLocales } from 'src/locales';

import AdminUserFormView from 'src/sections/app/admin/users/form/view';

export default function AdminUserCreatePage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('users.createDocumentTitle')}</title>
      </Helmet>
      <AdminUserFormView mode="create" />
    </>
  );
}
