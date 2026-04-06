import { Helmet } from 'react-helmet-async';
import ClientsView from 'src/sections/app/clients-view';

export default function ClientsPage() {
  return (
    <>
      <Helmet>
        <title> Клиенты</title>
      </Helmet>
      <ClientsView />
    </>
  );
}
