import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { useLocales } from 'src/locales';

import type { ClientListItem } from 'src/sections/app/clients/api/types';
import type { TenantUserListItem } from 'src/sections/app/admin/users/api/types';

import type { CartLine, SalePaymentType } from '../api/types';
import PosCartLine from './pos-cart-line';
import PosCartSummary from './pos-cart-summary';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;

  cart: CartLine[];
  onSetQty: (productId: string, qty: number) => void;
  onSetPrice: (productId: string, price: number) => void;
  onRemove: (productId: string) => void;

  client: ClientListItem | null;
  onClientChange: (client: ClientListItem | null) => void;
  onAddClient: () => void;
  createdBy: TenantUserListItem | null;
  onCreatedByChange: (user: TenantUserListItem | null) => void;
  paymentType: SalePaymentType;
  onPaymentTypeChange: (type: SalePaymentType) => void;
  debtDeadlineDays: number | '';
  onDebtDeadlineDaysChange: (days: number | '') => void;
  subtotal: number;
  canComplete: boolean;
  isCreating: boolean;
  onComplete: () => void;
};

// ----------------------------------------------------------------------

export default function PosCartDrawer({
  open,
  onClose,
  onOpen,
  cart,
  onSetQty,
  onSetPrice,
  onRemove,
  client,
  onClientChange,
  onAddClient,
  createdBy,
  onCreatedByChange,
  paymentType,
  onPaymentTypeChange,
  debtDeadlineDays,
  onDebtDeadlineDaysChange,
  subtotal,
  canComplete,
  isCreating,
  onComplete,
}: Props) {
  const { tx } = useLocales();

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={onOpen}
      disableSwipeToOpen={false}
      swipeAreaWidth={24}
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      {/* Drag handle */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5, flexShrink: 0 }}>
        <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'text.disabled', opacity: 0.4 }} />
      </Box>

      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        sx={{ px: 2, py: 1, flexShrink: 0 }}
      >
        <Typography variant="h6" sx={{ flex: 1 }}>
          {tx('pos.cart')}
          {cart.length > 0 && (
            <Typography
              component="span"
              variant="body2"
              color="text.secondary"
              sx={{ ml: 1 }}
            >
              ({cart.length})
            </Typography>
          )}
        </Typography>

        <IconButton onClick={onClose} edge="end" size="small">
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Stack>

      <Divider sx={{ flexShrink: 0 }} />

      {/* Scrollable cart lines */}
      <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <Scrollbar sx={{ height: '100%' }}>
          {cart.length === 0 ? (
            <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Iconify icon="solar:cart-large-4-bold" width={48} sx={{ color: 'text.disabled' }} />
              <Typography color="text.secondary" variant="body2" align="center">
                {tx('pos.emptyCart')}
              </Typography>
            </Box>
          ) : (
            <Stack
              spacing={1.5}
              divider={<Divider flexItem />}
              sx={{ p: 2 }}
            >
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
        </Scrollbar>
      </Box>

      <Divider sx={{ flexShrink: 0 }} />

      {/* Sticky summary + checkout */}
      <Box sx={{ px: 2, pt: 2, pb: 3, flexShrink: 0, bgcolor: 'background.paper' }}>
        <PosCartSummary
          client={client}
          onClientChange={onClientChange}
          onAddClient={onAddClient}
          createdBy={createdBy}
          onCreatedByChange={onCreatedByChange}
          paymentType={paymentType}
          onPaymentTypeChange={onPaymentTypeChange}
          debtDeadlineDays={debtDeadlineDays}
          onDebtDeadlineDaysChange={onDebtDeadlineDaysChange}
          subtotal={subtotal}
          canComplete={canComplete}
          isCreating={isCreating}
          onComplete={onComplete}
        />
      </Box>
    </SwipeableDrawer>
  );
}
