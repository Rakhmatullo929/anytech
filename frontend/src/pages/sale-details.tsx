import { Helmet } from 'react-helmet-async';
import SaleDetailsView from 'src/sections/app/sale-details-view';

export default function SaleDetailsPage() {
  return (
    <>
      <Helmet>
        <title> Продажа</title>
      </Helmet>
      <SaleDetailsView />
    </>
  );
}
