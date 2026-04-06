import { Helmet } from 'react-helmet-async';
import DebtsView from 'src/sections/app/debts-view';

export default function DebtsPage() {
  return (
    <>
      <Helmet>
        <title> Долги</title>
      </Helmet>
      <DebtsView />
    </>
  );
}
