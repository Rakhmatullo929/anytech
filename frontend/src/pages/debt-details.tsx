import { Helmet } from 'react-helmet-async';
import DebtDetailsView from 'src/sections/app/debt-details-view';

export default function DebtDetailsPage() {
  return (
    <>
      <Helmet>
        <title> Долг</title>
      </Helmet>
      <DebtDetailsView />
    </>
  );
}
