import { Suspense, lazy, type ReactElement } from 'react';
import { Outlet } from 'react-router-dom';
// auth
import { AuthGuard, PermissionGuard } from 'src/auth/guard';
// layouts
import DashboardLayout from 'src/layouts/dashboard';
// components
import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

const PosPage = lazy(() => import('../../pages/pos'));
const ProfilePage = lazy(() => import('../../pages/profile'));
const ProductsPage = lazy(() => import('../../pages/products'));
const CategoriesPage = lazy(() => import('../../pages/categories'));
const ProductDetailsPage = lazy(() => import('../../pages/product-details'));
const ClientsListPage = lazy(() => import('../../pages/clients'));
const ClientsGroupsPage = lazy(() => import('../../pages/clients-groups'));
const ClientsGroupsDetailsPage = lazy(() => import('../../pages/clients-groups-details'));
const ClientCreatePage = lazy(() => import('../../pages/client-create'));
const ClientEditPage = lazy(() => import('../../pages/client-edit'));
const ClientDetailsPage = lazy(() => import('../../pages/client-details'));
const SalesListPage = lazy(() => import('../../pages/sales'));
const SaleDetailsPage = lazy(() => import('../../pages/sale-details'));
const DebtsListPage = lazy(() => import('../../pages/debts'));
const DebtDetailsPage = lazy(() => import('../../pages/debt-details'));
const AdminUsersPage = lazy(() => import('../../pages/admin-users'));
const AdminUserDetailsPage = lazy(() => import('../../pages/admin-users-details'));
const AdminUserCreatePage = lazy(() => import('../../pages/admin-users-create'));
const AdminUserEditPage = lazy(() => import('../../pages/admin-user-edit'));
const AdminRolesPage = lazy(() => import('../../pages/admin-roles'));

function withPermission(
  page:
    | 'admin'
    | 'roles'
    | 'users'
    | 'pos'
    | 'products'
    | 'categories'
    | 'clients'
    | 'groups'
    | 'sales'
    | 'debts',
  action: 'read' | 'detail' | 'write',
  element: ReactElement
) {
  return (
    <PermissionGuard page={page} action={action}>
      {element}
    </PermissionGuard>
  );
}

export const dashboardRoutes = [
  {
    element: (
      <AuthGuard>
        <DashboardLayout>
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      </AuthGuard>
    ),
    children: [
      { path: 'pos', element: withPermission('pos', 'read', <PosPage />) },
      { path: 'profile', element: <ProfilePage /> },
      {
        path: 'products',
        children: [
          {
            index: true,
            element: withPermission('products', 'read', <ProductsPage />),
          },
          {
            path: ':id',
            element: withPermission('products', 'detail', <ProductDetailsPage />),
          },
        ],
      },
      {
        path: 'categories',
        element: withPermission('categories', 'read', <CategoriesPage />),
      },
      {
        path: 'clients',
        children: [
          {
            index: true,
            element: withPermission('clients', 'read', <ClientsListPage />),
          },
          {
            path: 'groups',
            element: withPermission('groups', 'read', <ClientsGroupsPage />),
          },
          {
            path: 'groups/:id',
            element: withPermission('groups', 'detail', <ClientsGroupsDetailsPage />),
          },
          {
            path: 'new',
            element: withPermission('clients', 'write', <ClientCreatePage />),
          },
          {
            path: ':id/edit',
            element: withPermission('clients', 'write', <ClientEditPage />),
          },
          {
            path: ':id',
            element: withPermission('clients', 'detail', <ClientDetailsPage />),
          },
        ],
      },
      {
        path: 'sales',
        children: [
          {
            index: true,
            element: withPermission('sales', 'read', <SalesListPage />),
          },
          {
            path: ':id',
            element: withPermission('sales', 'detail', <SaleDetailsPage />),
          },
        ],
      },
      {
        path: 'debts',
        children: [
          {
            index: true,
            element: withPermission('debts', 'read', <DebtsListPage />),
          },
          {
            path: ':id',
            element: withPermission('debts', 'detail', <DebtDetailsPage />),
          },
        ],
      },
      {
        path: 'admin',
        children: [
          {
            index: true,
            element: withPermission('users', 'read', <AdminUsersPage />),
          },
          {
            path: 'users',
            element: withPermission('users', 'read', <AdminUsersPage />),
          },
          {
            path: 'users/new',
            element: withPermission('users', 'write', <AdminUserCreatePage />),
          },
          {
            path: 'users/:id/edit',
            element: withPermission('users', 'write', <AdminUserEditPage />),
          },
          {
            path: 'users/:id',
            element: withPermission('users', 'detail', <AdminUserDetailsPage />),
          },
          {
            path: 'roles',
            element: withPermission('roles', 'read', <AdminRolesPage />),
          },
        ],
      },
    ],
  },
];
