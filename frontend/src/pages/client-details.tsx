import { Helmet } from 'react-helmet-async';
import ClientDetailsView from 'src/sections/app/client-details-view';

export default function ClientDetailsPage() {
  return (
    <>
      <Helmet>
        <title> Клиент</title>
      </Helmet>
      <ClientDetailsView />
    </>
  );
}
