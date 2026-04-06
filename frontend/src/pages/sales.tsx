import { Helmet } from 'react-helmet-async';
import SalesView from 'src/sections/app/sales-view';

export default function SalesPage() {
  return (
    <>
      <Helmet>
        <title> Продажи</title>
      </Helmet>
      <SalesView />
    </>
  );
}
