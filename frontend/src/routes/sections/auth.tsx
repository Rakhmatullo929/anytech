import { lazy } from 'react';
// auth
import { GuestGuard } from 'src/auth/guard';
// layouts
import AuthClassicLayout from 'src/layouts/auth/classic';

// ----------------------------------------------------------------------

const JwtLoginPage = lazy(() => import('src/pages/auth/jwt/login'));
const JwtRegisterPage = lazy(() => import('src/pages/auth/jwt/register'));

// ----------------------------------------------------------------------

export const authRoutes = [
  {
    path: 'login',
    element: (
      <GuestGuard>
        <AuthClassicLayout>
          <JwtLoginPage />
        </AuthClassicLayout>
      </GuestGuard>
    ),
  },
  {
    path: 'register',
    element: (
      <GuestGuard>
        <AuthClassicLayout title="Create your store">
          <JwtRegisterPage />
        </AuthClassicLayout>
      </GuestGuard>
    ),
  },
];
