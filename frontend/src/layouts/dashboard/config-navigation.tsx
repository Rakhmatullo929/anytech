import { useMemo } from 'react';
// routes
import { paths } from 'src/routes/paths';
// hooks
import { useAppUserProfile } from 'src/hooks/use-app-user-profile';
import { canReadPage } from 'src/auth/utils/permissions';
// locales
import { useLocales } from 'src/locales';
// components
import SvgColor from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />
);

const ICONS = {
  pos: icon('ic_ecommerce'),
  product: icon('ic_product'),
  user: icon('ic_user'),
  order: icon('ic_order'),
  invoice: icon('ic_invoice'),
};

// ----------------------------------------------------------------------

export function useNavData() {
  const { user } = useAppUserProfile();
  const { tx } = useLocales();

  const { permissions } = user;

  const canReadAdmin = canReadPage(permissions, 'admin');
  const canReadPos = canReadPage(permissions, 'pos');
  const canReadProducts = canReadPage(permissions, 'products');
  const canReadClients = canReadPage(permissions, 'clients');
  const canReadSales = canReadPage(permissions, 'sales');
  const canReadDebts = canReadPage(permissions, 'debts');

  const data = useMemo(
    () => [
      {
        subheader: tx('layout.nav.group'),
        items: [
          ...(canReadAdmin
            ? [
                {
                  title: tx('layout.nav.admin'),
                  path: paths.admin.root,
                  icon: ICONS.user,
                },
              ]
            : []),
          ...(canReadPos
            ? [
                {
                  title: tx('layout.nav.pos'),
                  path: paths.pos,
                  icon: ICONS.pos,
                },
              ]
            : []),
          ...(canReadProducts
            ? [
                {
                  title: tx('layout.nav.products'),
                  path: paths.products.root,
                  icon: ICONS.product,
                },
              ]
            : []),
          ...(canReadClients
            ? [
                {
                  title: tx('layout.nav.clients'),
                  path: paths.clients.root,
                  icon: ICONS.user,
                },
              ]
            : []),
          ...(canReadSales
            ? [
                {
                  title: tx('layout.nav.sales'),
                  path: paths.sales.root,
                  icon: ICONS.order,
                },
              ]
            : []),
          ...(canReadDebts
            ? [
                {
                  title: tx('layout.nav.debts'),
                  path: paths.debts.root,
                  icon: ICONS.invoice,
                },
              ]
            : []),
        ],
      },
    ],
    [canReadAdmin, canReadClients, canReadDebts, canReadPos, canReadProducts, canReadSales, tx]
  );

  return data;
}
