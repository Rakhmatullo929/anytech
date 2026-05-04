import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useLocales } from 'src/locales';
import { useSettingsContext } from 'src/components/settings';

import type { ClientListItem } from 'src/sections/app/clients/api/types';

import type { CartLine, SalePaymentType } from '../api/types';

import PosCartLine from './pos-cart-line';
import PosCartSummary from './pos-cart-summary';

type Props = {
  cart: CartLine[];
  onSetQty: (productId: string, qty: number) => void;
  onSetPrice: (productId: string, price: number) => void;
  onRemove: (productId: string) => void;

  client: ClientListItem | null;
  onClientChange: (client: ClientListItem | null) => void;
  paymentType: SalePaymentType;
  onPaymentTypeChange: (type: SalePaymentType) => void;
  subtotal: number;
  canComplete: boolean;
  isCreating: boolean;
  onComplete: () => void;
};

export default function PosCart({
  cart,
  onSetQty,
  onSetPrice,
  onRemove,
  client,
  onClientChange,
  paymentType,
  onPaymentTypeChange,
  subtotal,
  canComplete,
  isCreating,
  onComplete,
}: Props) {
  const { tx } = useLocales();
  const settings = useSettingsContext();

  return (
    <Card
      sx={{
        width: { xs: 1, md: 380 },
        p: 2,
        position: { md: 'sticky' },
        top: settings.themeLayout === 'horizontal' ? 88 : 24,
        alignSelf: 'flex-start',
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        {tx('pos.cart')}
      </Typography>

      {cart.length === 0 ? (
        <Typography color="text.secondary" variant="body2">
          {tx('pos.emptyCart')}
        </Typography>
      ) : (
        <Stack spacing={1.5} divider={<Divider flexItem />}>
          {cart.map((line) => (
            <PosCartLine
              key={line.productId}
              line={line}
              onSetQty={onSetQty}
              onSetPrice={onSetPrice}
              onRemove={onRemove}
            />
          ))}
        </Stack>
      )}

      <Divider sx={{ my: 2 }} />

      <PosCartSummary
        client={client}
        onClientChange={onClientChange}
        paymentType={paymentType}
        onPaymentTypeChange={onPaymentTypeChange}
        subtotal={subtotal}
        canComplete={canComplete}
        isCreating={isCreating}
        onComplete={onComplete}
      />
    </Card>
  );
}
