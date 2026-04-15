import { Helmet } from 'react-helmet-async';

import { useLocales } from 'src/locales';

import ProfileView from 'src/sections/app/profile/view';

export default function ProfilePage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('pages.profile.document_title')}</title>
      </Helmet>
      <ProfileView />
    </>
  );
}
