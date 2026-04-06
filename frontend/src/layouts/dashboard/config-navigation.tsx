import { useMemo } from 'react';
// routes
import { paths } from 'src/routes/paths';
// hooks
import { useAppUserProfile } from 'src/hooks/use-app-user-profile';
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

  const canManage = MANAGER_ROLES.includes(user.role);

  const data = useMemo(
    () => [
      {
        subheader: 'Магазин',
        items: [
          {
            title: 'POS',
            path: paths.pos,
            icon: ICONS.pos,
          },
          ...(canManage
            ? [
                {
                  title: 'Товары',
                  path: paths.products,
                  icon: ICONS.product,
                },
                {
                  title: 'Клиенты',
                  path: paths.clients.root,
                  icon: ICONS.user,
                },
                {
                  title: 'Продажи',
                  path: paths.sales.root,
                  icon: ICONS.order,
                },
                {
                  title: 'Долги',
                  path: paths.debts.root,
                  icon: ICONS.invoice,
                },
              ]
            : []),
        ],
      },
    ],
    [canManage]
  );

  return data;
}
