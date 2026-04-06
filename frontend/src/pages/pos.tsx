import { Helmet } from 'react-helmet-async';
import PosView from 'src/sections/app/pos-view';

export default function PosPage() {
  return (
    <>
      <Helmet>
        <title> POS</title>
      </Helmet>
      <PosView />
    </>
  );
}
