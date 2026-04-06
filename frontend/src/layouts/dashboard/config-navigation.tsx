import { useMemo } from 'react';
// routes
import { paths } from 'src/routes/paths';
// hooks
import { useAppUserProfile } from 'src/hooks/use-app-user-profile';
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

const MANAGER_ROLES = ['admin', 'manager'];

// ----------------------------------------------------------------------

export function useNavData() {
  const { user } = useAppUserProfile();
  const { tx } = useLocales();

  const canManage = MANAGER_ROLES.includes(user.role);

  const data = useMemo(
    () => [
      {
        subheader: tx('layout.nav.group'),
        items: [
          {
            title: tx('layout.nav.pos'),
            path: paths.pos,
            icon: ICONS.pos,
          },
          ...(canManage
            ? [
                {
                  title: tx('layout.nav.products'),
                  path: paths.products,
                  icon: ICONS.product,
                },
                {
                  title: tx('layout.nav.clients'),
                  path: paths.clients.root,
                  icon: ICONS.user,
                },
                {
                  title: tx('layout.nav.sales'),
                  path: paths.sales.root,
                  icon: ICONS.order,
                },
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
    [canManage, tx]
  );

  return data;
}
