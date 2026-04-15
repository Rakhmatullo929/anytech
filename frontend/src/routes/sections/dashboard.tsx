import { Suspense, lazy } from 'react';
import { Outlet } from 'react-router-dom';
// auth
import { AuthGuard } from 'src/auth/guard';
// layouts
import DashboardLayout from 'src/layouts/dashboard';
// components
import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

const PosPage = lazy(() => import('../../pages/pos'));
const ProfilePage = lazy(() => import('../../pages/profile'));
const ProductsPage = lazy(() => import('../../pages/products'));
const ProductDetailsPage = lazy(() => import('../../pages/product-details'));
const ClientsListPage = lazy(() => import('../../pages/clients'));
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
      { path: 'pos', element: <PosPage /> },
      { path: 'profile', element: <ProfilePage /> },
      {
        path: 'products',
        children: [
          {
            index: true,
            element: <ProductsPage />,
          },
          {
            path: ':id',
            element: <ProductDetailsPage />,
          },
        ],
      },
      {
        path: 'clients',
        children: [
          {
            index: true,
            element: <ClientsListPage />,
          },
          {
            path: ':id',
            element: <ClientDetailsPage />,
          },
        ],
      },
      {
        path: 'sales',
        children: [
          {
            index: true,
            element: <SalesListPage />,
          },
          {
            path: ':id',
            element: <SaleDetailsPage />,
          },
        ],
      },
      {
        path: 'debts',
        children: [
          {
            index: true,
            element: <DebtsListPage />,
          },
          {
            path: ':id',
            element: <DebtDetailsPage />,
          },
        ],
      },
      {
        path: 'admin',
        children: [
          {
            index: true,
            element: <AdminUsersPage />,
          },
          {
            path: 'users',
            element: <AdminUsersPage />,
          },
          {
            path: 'users/new',
            element: <AdminUserCreatePage />,
          },
          {
            path: 'users/:id/edit',
            element: <AdminUserEditPage />,
          },
          {
            path: 'users/:id',
            element: <AdminUserDetailsPage />,
          },
          {
            path: 'roles',
            element: <AdminRolesPage />,
          },
        ],
      },
    ],
  },
];
