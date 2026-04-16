import { Helmet } from 'react-helmet-async';
import { useLocales } from 'src/locales';

import AdminUserDetailsView from 'src/sections/app/admin/users/details/view';

export default function AdminUserDetailsPage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('users.detailDocumentTitle')}</title>
      </Helmet>
      <AdminUserDetailsView />
    </>
  );
}
