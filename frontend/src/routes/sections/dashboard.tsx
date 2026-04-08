import { Suspense, lazy } from 'react';
import { Outlet } from 'react-router-dom';
// auth
import { AuthGuard } from 'src/auth/guard';
import RoleBasedGuard from 'src/auth/guard/role-based-guard';
// layouts
import DashboardLayout from 'src/layouts/dashboard';
// components
import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

const PosPage = lazy(() => import('../../pages/pos'));
const ProductsPage = lazy(() => import('../../pages/products'));
const ProductDetailsPage = lazy(() => import('../../pages/product-details'));
const ClientsListPage = lazy(() => import('../../pages/clients'));
const ClientDetailsPage = lazy(() => import('../../pages/client-details'));
const SalesListPage = lazy(() => import('../../pages/sales'));
const SaleDetailsPage = lazy(() => import('../../pages/sale-details'));
const DebtsListPage = lazy(() => import('../../pages/debts'));
const DebtDetailsPage = lazy(() => import('../../pages/debt-details'));

const MANAGER_ROLES = ['admin', 'manager'];

// ----------------------------------------------------------------------

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
      {
        path: 'products',
        children: [
          {
            index: true,
            element: (
              <RoleBasedGuard roles={MANAGER_ROLES} hasContent>
                <ProductsPage />
              </RoleBasedGuard>
            ),
          },
          {
            path: ':id',
            element: (
              <RoleBasedGuard roles={MANAGER_ROLES} hasContent>
                <ProductDetailsPage />
              </RoleBasedGuard>
            ),
          },
        ],
      },
      {
        path: 'clients',
        children: [
          {
            index: true,
            element: (
              <RoleBasedGuard roles={MANAGER_ROLES} hasContent>
                <ClientsListPage />
              </RoleBasedGuard>
            ),
          },
          {
            path: ':id',
            element: (
              <RoleBasedGuard roles={MANAGER_ROLES} hasContent>
                <ClientDetailsPage />
              </RoleBasedGuard>
            ),
          },
        ],
      },
      {
        path: 'sales',
        children: [
          {
            index: true,
            element: (
              <RoleBasedGuard roles={MANAGER_ROLES} hasContent>
                <SalesListPage />
              </RoleBasedGuard>
            ),
          },
          {
            path: ':id',
            element: (
              <RoleBasedGuard roles={MANAGER_ROLES} hasContent>
                <SaleDetailsPage />
              </RoleBasedGuard>
            ),
          },
        ],
      },
      {
        path: 'debts',
        children: [
          {
            index: true,
            element: (
              <RoleBasedGuard roles={MANAGER_ROLES} hasContent>
                <DebtsListPage />
              </RoleBasedGuard>
            ),
          },
          {
            path: ':id',
            element: (
              <RoleBasedGuard roles={MANAGER_ROLES} hasContent>
                <DebtDetailsPage />
              </RoleBasedGuard>
            ),
          },
        ],
      },
    ],
  },
];
