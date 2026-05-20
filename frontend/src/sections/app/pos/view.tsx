import { useCallback, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { useSnackbar } from 'src/components/snackbar';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';
import type { TenantUser } from 'src/auth/api/types';
import { useInfiniteFetch, type InfinitePageFetcher } from 'src/hooks/api';
import { useDebounce } from 'src/hooks/use-debounce';
import { useLocales } from 'src/locales';
import { paths } from 'src/routes/paths';

import { useCashRegisterQuery } from '../cash-register/api/use-cash-register-api';
import { CashRegisterControls, CashRegisterStatusBadge } from '../cash-register/components';
import type { ClientListItem } from '../clients/api/types';
import { fetchProductsList } from '../products/api/products-requests';
import type { ProductListItem } from '../products/api/types';
import type { TenantUserListItem } from '../admin/users/api/types';

import { useCreateSaleMutation } from './api/use-pos-api';
import type { SalePaymentType } from './api/types';
import { PosCart, PosProductList } from './components';
import { PosViewSkeleton } from './skeleton';
import { usePosCart } from './hooks/use-pos-cart';

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

  const { data: cashRegister, isPending: cashRegisterPending, isError: cashRegisterError } = useCashRegisterQuery();
  // Only block if we have confirmed data showing CLOSED. Never block on loading or error state.
  const isRegisterClosed = !cashRegisterPending && !cashRegisterError && cashRegister?.status === 'closed';

  const [client, setClient] = useState<ClientListItem | null>(null);
  const [createdBy, setCreatedBy] = useState<TenantUserListItem | null>(() => {
    if (!authUser || !('id' in authUser)) return null;
    return tenantUserToListItem(authUser as TenantUser);
  });
  const [paymentType, setPaymentType] = useState<SalePaymentType>('cash');
  const [debtDeadlineDays, setDebtDeadlineDays] = useState<number | ''>(15);
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebounce(search, 400);

  const { cart, addProduct, setQty, setPrice, removeLine, clear, subtotal } = usePosCart();

  // ── Product infinite list ──────────────────────────────────────────

  const productsQueryKey = useMemo(
    () => ['pos', 'products', debouncedSearch],
    [debouncedSearch]
  );

  const productsFetcher = useCallback<InfinitePageFetcher<ProductListItem>>(
    ({ pageParam }) =>
      fetchProductsList({
        page: pageParam,
        pageSize: 20,
        search: debouncedSearch || undefined,
        // Without search: only in-stock products, sorted alphabetically.
        // With search: all products (so cashier can see out-of-stock too),
        // in-stock first via -total_quantity ordering.
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
      await createSaleMutation.mutateAsync({
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
      enqueueSnackbar(tx('pos.saleSuccess'), { variant: 'success' });
      clear();
      setClient(null);
      setPaymentType('cash');
      setDebtDeadlineDays(15);
      if (authUser && 'id' in authUser) {
        setCreatedBy(tenantUserToListItem(authUser as TenantUser));
      }
    } catch {
      // useMutate global handler shows the error snackbar
    }
  }, [cart, client, createdBy, paymentType, debtDeadlineDays, createSaleMutation, enqueueSnackbar, tx, clear, authUser]);

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
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={<CashRegisterControls />}
        >
          <Typography variant="subtitle2">{tx('pos.cashRegister.blockedTitle')}</Typography>
          <Typography variant="body2">{tx('pos.cashRegister.blockedMessage')}</Typography>
        </Alert>
      )}

      {showInitialSkeleton ? (
        <PosViewSkeleton />
      ) : (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
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

          <PosCart
            cart={cart}
            onSetQty={setQty}
            onSetPrice={setPrice}
            onRemove={removeLine}
            client={client}
            onClientChange={setClient}
            createdBy={createdBy}
            onCreatedByChange={setCreatedBy}
            paymentType={paymentType}
            onPaymentTypeChange={setPaymentType}
            debtDeadlineDays={debtDeadlineDays}
            onDebtDeadlineDaysChange={setDebtDeadlineDays}
            subtotal={subtotal}
            canComplete={canComplete}
            isCreating={createSaleMutation.isPending}
            onComplete={completeSale}
          />
        </Stack>
      )}
    </>
  );
}
