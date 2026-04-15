import { Helmet } from 'react-helmet-async';
import { useLocales } from 'src/locales';

import AdminUserFormView from 'src/sections/app/admin/users/form/view';

export default function AdminUserEditPage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('pages.users.edit_document_title')}</title>
      </Helmet>
      <AdminUserFormView mode="edit" />
    </>
  );
}
