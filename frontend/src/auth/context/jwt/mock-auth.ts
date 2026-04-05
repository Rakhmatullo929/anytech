import type { TenantUser } from 'src/auth/api/types';

// ----------------------------------------------------------------------

export const isJwtAuthMock = () => process.env.REACT_APP_AUTH_MOCK === 'true';

function encodeBase64Url(obj: object) {
  return btoa(JSON.stringify(obj))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/** JWT-shaped string so `isValidToken` / `setSession` keep working (signature not verified). */
export function createMockAccessToken(expiresInSec = 60 * 60 * 24 * 365) {
  const header = encodeBase64Url({ alg: 'none', typ: 'JWT' });
  const exp = Math.floor(Date.now() / 1000) + expiresInSec;
  const payload = encodeBase64Url({ exp });
  return `${header}.${payload}.mock`;
}

export function buildMockAuthUser(
  email: string,
  firstName?: string,
  lastName?: string
): TenantUser {
  const name =
    firstName && lastName ? `${firstName} ${lastName}`.trim() : email.split('@')[0] || 'User';

  return {
    id: '00000000-0000-4000-8000-000000000001',
    name,
    email,
    role: 'admin',
    tenantId: null,
    createdAt: new Date().toISOString(),
  };
}
