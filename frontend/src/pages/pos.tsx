import { Helmet } from 'react-helmet-async';
import { useLocales } from 'src/locales';
import PosView from 'src/sections/app/pos/view';

export default function PosPage() {
  const { tx } = useLocales();

  return (
    <>
      <Helmet>
        <title>{tx('pos.documentTitle')}</title>
      </Helmet>
      <PosView />
    </>
  );
}
