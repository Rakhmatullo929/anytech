import { useCallback, useMemo, useState } from 'react';

import Stack from '@mui/material/Stack';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { useSnackbar } from 'src/components/snackbar';
import { useInfiniteFetch, type InfinitePageFetcher } from 'src/hooks/api';
import { useDebounce } from 'src/hooks/use-debounce';
import { useLocales } from 'src/locales';
import { paths } from 'src/routes/paths';

import type { ClientListItem } from '../clients/api/types';
import { fetchProductsList } from '../products/api/products-requests';
import type { ProductListItem } from '../products/api/types';

import { useCreateSaleMutation } from './api/use-pos-api';
import type { SalePaymentType } from './api/types';
import { PosCart, PosProductList } from './components';
import { PosViewSkeleton } from './skeleton';
import { usePosCart } from './hooks/use-pos-cart';

// ---------------------------------------------------------------------------

export default function PosView() {
  const { tx } = useLocales();
  const { enqueueSnackbar } = useSnackbar();

  const [client, setClient] = useState<ClientListItem | null>(null);
  const [paymentType, setPaymentType] = useState<SalePaymentType>('cash');
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
        ordering: 'name',
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

  const canComplete = cart.length > 0 && client !== null;

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
      });
      enqueueSnackbar(tx('pos.saleSuccess'), { variant: 'success' });
      clear();
      setClient(null);
      setPaymentType('cash');
    } catch {
      // useMutate global handler shows the error snackbar
    }
  }, [cart, client, paymentType, createSaleMutation, enqueueSnackbar, tx, clear]);

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('common.navigation.pos')}
        links={[{ name: tx('common.navigation.pos'), href: paths.pos }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

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
            paymentType={paymentType}
            onPaymentTypeChange={setPaymentType}
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
