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

const MANAGER_ROLES = ['admin', 'manager'];
const ADMIN_ROLES = ['admin'];

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
      { path: 'profile', element: <ProfilePage /> },
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
      {
        path: 'admin',
        children: [
          {
            index: true,
            element: (
              <RoleBasedGuard roles={ADMIN_ROLES} hasContent>
                <AdminUsersPage />
              </RoleBasedGuard>
            ),
          },
          {
            path: 'users',
            element: (
              <RoleBasedGuard roles={ADMIN_ROLES} hasContent>
                <AdminUsersPage />
              </RoleBasedGuard>
            ),
          },
          {
            path: 'users/new',
            element: (
              <RoleBasedGuard roles={ADMIN_ROLES} hasContent>
                <AdminUserCreatePage />
              </RoleBasedGuard>
            ),
          },
          {
            path: 'users/:id/edit',
            element: (
              <RoleBasedGuard roles={ADMIN_ROLES} hasContent>
                <AdminUserEditPage />
              </RoleBasedGuard>
            ),
          },
          {
            path: 'users/:id',
            element: (
              <RoleBasedGuard roles={ADMIN_ROLES} hasContent>
                <AdminUserDetailsPage />
              </RoleBasedGuard>
            ),
          },
          {
            path: 'roles',
            element: (
              <RoleBasedGuard roles={ADMIN_ROLES} hasContent>
                <AdminRolesPage />
              </RoleBasedGuard>
            ),
          },
        ],
      },
    ],
  },
];
