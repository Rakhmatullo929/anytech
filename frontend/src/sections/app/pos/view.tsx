import { useCallback, useEffect, useMemo, useState } from 'react';

import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { useSnackbar } from 'src/components/snackbar';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';
import type { TenantUser } from 'src/auth/api/types';
import { useInfiniteFetch, type InfinitePageFetcher } from 'src/hooks/api';
import { useDebounce } from 'src/hooks/use-debounce';
import { useLocales } from 'src/locales';
import { useRouter, useSearchParams } from 'src/routes/hook';
import { paths } from 'src/routes/paths';

import { useCashRegisterQuery } from '../cash-register/api/use-cash-register-api';
import { CashRegisterControls, CashRegisterStatusBadge } from '../cash-register/components';
import type { ClientListItem } from '../clients/api/types';
import { fetchProductsList } from '../products/api/products-requests';
import type { ProductListItem } from '../products/api/types';
import type { TenantUserListItem } from '../admin/users/api/types';

import { useCreateSaleMutation } from './api/use-pos-api';
import type { SalePaymentType } from './api/types';
import { PosCart, PosProductList, PosTodaySales, PosSaleCompleteDialog } from './components';
import type { InvoiceData } from './components';
import PosCartDrawer from './components/pos-cart-drawer';
import PosMobileCartFab from './components/pos-mobile-cart-fab';
import { PosViewSkeleton } from './skeleton';
import { usePosCart } from './hooks/use-pos-cart';

// ----------------------------------------------------------------------

export const POS_NEW_CLIENT_KEY = 'pos_new_client';

// ----------------------------------------------------------------------

function tenantUserToListItem(u: TenantUser): TenantUserListItem {
  return {
    id: u.id,
    tenantId: u.tenantId,
    firstName: u.firstName,
    lastName: u.lastName,
    middleName: u.middleName,
    birthDate: u.birthDate ?? null,
    phone: u.phone,
    email: u.email,
    passportSeries: u.passportSeries ?? null,
    gender: u.gender ?? null,
    role: u.role,
    createdAt: u.createdAt,
  };
}

// ---------------------------------------------------------------------------

export default function PosView() {
  const { tx } = useLocales();
  const { enqueueSnackbar } = useSnackbar();
  const { user: authUser } = useAuthContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { data: cashRegister, isPending: cashRegisterPending, isError: cashRegisterError } = useCashRegisterQuery();
  const isRegisterClosed = !cashRegisterPending && !cashRegisterError && cashRegister?.status === 'closed';

  const [client, setClient] = useState<ClientListItem | null>(null);

  // After returning from "Add new customer" flow, auto-select the newly created client.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(POS_NEW_CLIENT_KEY);
      if (!raw) return;
      const newClient = JSON.parse(raw) as ClientListItem;
      setClient(newClient);
      sessionStorage.removeItem(POS_NEW_CLIENT_KEY);
    } catch {
      // noop — corrupted storage entry is harmless
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [createdBy, setCreatedBy] = useState<TenantUserListItem | null>(() => {
    if (!authUser || !('id' in authUser)) return null;
    return tenantUserToListItem(authUser as TenantUser);
  });
  const [paymentType, setPaymentType] = useState<SalePaymentType>('cash');
  const [debtDeadlineDays, setDebtDeadlineDays] = useState<number | ''>(15);
  const [search, setSearch] = useState('');

  // Mobile cart drawer state
  const [cartOpen, setCartOpen] = useState(false);

  // Invoice dialog state — opened after a sale is completed
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

  // Tab state persisted in the URL: ?tab=pos | ?tab=sales
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') === 'sales' ? 'sales' : 'pos';

  const handleTabChange = (_: React.SyntheticEvent, value: string) => {
    router.replace(`${paths.pos}?tab=${value}`);
  };

  const debouncedSearch = useDebounce(search, 400);

  const { cart, addProduct, setQty, setPrice, removeLine, clear, subtotal } = usePosCart();

  const handleAddClient = useCallback(() => {
    router.push(`${paths.clients.create}?returnTo=pos`);
  }, [router]);

  // ── Product infinite list ──────────────────────────────────────────

  const productsQueryKey = useMemo(
    () => ['products', 'pos', debouncedSearch],
    [debouncedSearch]
  );

  const productsFetcher = useCallback<InfinitePageFetcher<ProductListItem>>(
    ({ pageParam }) =>
      fetchProductsList({
        page: pageParam,
        pageSize: 20,
        search: debouncedSearch || undefined,
        ordering: debouncedSearch ? '-total_quantity,name' : 'name',
        inStock: !debouncedSearch,
      }),
    [debouncedSearch]
  );

  const {
    data: productsData,
    isPending: productsPending,
    isFetching: productsFetching,
    isFetchingNextPage,
    hasNextPage,
    observer,
  } = useInfiniteFetch<ProductListItem>(
    productsQueryKey,
    productsFetcher,
    { placeholderData: (previousData) => previousData },
    20
  );

  const products = useMemo(
    () => productsData?.pages.flatMap((p) => p.results) ?? [],
    [productsData]
  );

  const showInitialSkeleton = productsPending && !productsData;

  // ── Sale mutation ──────────────────────────────────────────────────

  const createSaleMutation = useCreateSaleMutation();

  const canComplete =
    cart.length > 0 &&
    client !== null &&
    createdBy !== null &&
    !isRegisterClosed &&
    (paymentType !== 'debt' || debtDeadlineDays !== '');

  const completeSale = useCallback(async () => {
    if (!client) return;
    try {
      const result = await createSaleMutation.mutateAsync({
        client: client.id,
        paymentType,
        items: cart.map((l) => ({
          product: l.productId,
          quantity: l.quantity,
          price: l.unitPrice.toFixed(2),
        })),
        ...(paymentType === 'debt' && debtDeadlineDays !== '' ? { debtDeadlineDays } : {}),
        ...(createdBy ? { createdByUserId: createdBy.id } : {}),
      });

      // Snapshot cart + client before clearing so the invoice dialog can render them
      setInvoiceData({
        sale: result,
        items: cart.map((l) => ({ name: l.name, quantity: l.quantity, unitPrice: l.unitPrice })),
        clientPhone: client.phone,
      });
      setInvoiceDialogOpen(true);

      enqueueSnackbar(tx('pos.saleSuccess'), { variant: 'success' });
      clear();
      setClient(null);
      setPaymentType('cash');
      setDebtDeadlineDays(15);
      setCartOpen(false); // close the mobile drawer after a successful sale
      if (authUser && 'id' in authUser) {
        setCreatedBy(tenantUserToListItem(authUser as TenantUser));
      }
    } catch {
      // useMutate global handler shows the error snackbar
    }
  }, [cart, client, createdBy, paymentType, debtDeadlineDays, createSaleMutation, enqueueSnackbar, tx, clear, authUser]);

  // ── Shared cart props ──────────────────────────────────────────────

  const cartProps = {
    cart,
    onSetQty: setQty,
    onSetPrice: setPrice,
    onRemove: removeLine,
    client,
    onClientChange: setClient,
    onAddClient: handleAddClient,
    createdBy,
    onCreatedByChange: setCreatedBy,
    paymentType,
    onPaymentTypeChange: setPaymentType,
    debtDeadlineDays,
    onDebtDeadlineDaysChange: setDebtDeadlineDays,
    subtotal,
    canComplete,
    isCreating: createSaleMutation.isPending,
    onComplete: completeSale,
  };

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('common.navigation.pos')}
        links={[{ name: tx('common.navigation.pos'), href: paths.pos }]}
        action={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CashRegisterStatusBadge />
            <CashRegisterControls />
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {isRegisterClosed && (
        <Alert severity="error" sx={{ mb: 3 }} action={<CashRegisterControls />}>
          <Typography variant="subtitle2">{tx('pos.cashRegister.blockedTitle')}</Typography>
          <Typography variant="body2">{tx('pos.cashRegister.blockedMessage')}</Typography>
        </Alert>
      )}

      {/* ── Tabs ── */}
      <Box
        sx={{
          mx: { xs: -2, md: 0 },
          mb: 3,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{ px: { xs: 2, md: 0 } }}
        >
          <Tab value="pos" label={tx('pos.tabs.pos')} />
          <Tab value="sales" label={tx('pos.tabs.sales')} />
        </Tabs>
      </Box>

      {/* ── Tab: POS ── */}
      {currentTab === 'pos' && (
        <>
          {showInitialSkeleton ? (
            <PosViewSkeleton />
          ) : (
            <Box sx={{ mx: { xs: -2, md: 0 } }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'stretch', md: 'flex-start' }}>
                <PosProductList
                  products={products}
                  search={search}
                  onSearchChange={setSearch}
                  onAddProduct={addProduct}
                  isFetching={productsFetching && !!productsData}
                  isFetchingNextPage={isFetchingNextPage}
                  hasNextPage={Boolean(hasNextPage)}
                  observerRef={observer.ref}
                />
                {!isMobile && <PosCart {...cartProps} />}
              </Stack>
            </Box>
          )}

          {/* FAB + drawer only on the POS tab */}
          {isMobile && (
            <>
              <PosMobileCartFab
                itemCount={cart.length}
                subtotal={subtotal}
                onClick={() => setCartOpen(true)}
              />
              <PosCartDrawer
                open={cartOpen}
                onClose={() => setCartOpen(false)}
                onOpen={() => setCartOpen(true)}
                {...cartProps}
              />
            </>
          )}
        </>
      )}

      {/* ── Tab: Today's sales ── */}
      {currentTab === 'sales' && (
        <Box sx={{ mx: { xs: -2, md: 0 } }}>
          <PosTodaySales />
        </Box>
      )}

      {/* ── Invoice dialog ── */}
      <PosSaleCompleteDialog
        open={invoiceDialogOpen}
        onClose={() => setInvoiceDialogOpen(false)}
        data={invoiceData}
      />
    </>
  );
}
