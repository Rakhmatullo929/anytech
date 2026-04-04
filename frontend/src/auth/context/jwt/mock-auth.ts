import { _mock } from 'src/_mock';

// ----------------------------------------------------------------------

export const MOCK_AUTH_USER_KEY = 'mockAuthUser';

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
): Record<string, unknown> {
  const displayName =
    firstName && lastName ? `${firstName} ${lastName}` : (email.split('@')[0] || 'User');

  return {
    id: 'mock-user',
    displayName,
    email,
    photoURL: _mock.image.avatar(24),
    role: 'admin',
  };
}
