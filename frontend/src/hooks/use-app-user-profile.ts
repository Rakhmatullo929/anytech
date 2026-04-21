import type { TenantUser } from 'src/auth/api/types';
import type { AuthUserType } from 'src/auth/types';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';

/**
 * Minimals dashboard expects displayName, photoURL, address fields, etc.
 * This maps JWT `TenantUser` and other auth shapes into that profile.
 */
export type AppUserProfile = {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  password?: string;
  phoneNumber: string;
  country: string;
  address: string;
  state: string;
  city: string;
  zipCode: string;
  about: string;
  role: string;
  permissions: string[];
  passportSeries: string;
  gender: 'male' | 'female' | '';
  tenantId: string;
  createdAt: string;
  isPublic: boolean;
};

function isTenantUser(u: unknown): u is TenantUser {
  return (
    u !== null &&
    typeof u === 'object' &&
    typeof (u as TenantUser).id === 'string' &&
    typeof (u as TenantUser).firstName === 'string' &&
    ((u as TenantUser).email === null || typeof (u as TenantUser).email === 'string') &&
    ((u as TenantUser).phone === null || typeof (u as TenantUser).phone === 'string') &&
    typeof (u as TenantUser).role === 'string'
  );
}

function emptyProfile(partial: Partial<AppUserProfile> = {}): AppUserProfile {
  return {
    id: '',
    displayName: '',
    email: '',
    photoURL: undefined,
    phoneNumber: '',
    country: '',
    address: '',
    state: '',
    city: '',
    zipCode: '',
    about: '',
    role: 'admin',
    permissions: [],
    passportSeries: '',
    gender: '',
    tenantId: '',
    createdAt: '',
    isPublic: false,
    ...partial,
  };
}

function mapAuthUserToProfile(u: NonNullable<AuthUserType>): AppUserProfile {
  if (isTenantUser(u)) {
    const fullName = [u.firstName, u.lastName, u.middleName].filter(Boolean).join(' ');
    return emptyProfile({
      id: u.id,
      displayName: fullName || u.phone || '',
      email: u.email || '',
      photoURL: undefined,
      role: u.role,
      permissions: Array.isArray(u.permissions) ? u.permissions : [],
      phoneNumber: u.phone || '',
      passportSeries: u.passportSeries || '',
      gender: u.gender || '',
      tenantId: u.tenantId || '',
      createdAt: u.createdAt || '',
    });
  }

  const rec = u as Record<string, unknown>;
  const { displayName: rawDisplayName, name: rawName, firstName: rawFirstName, lastName: rawLastName, middleName: rawMiddleName } = rec;
  let displayName = '';
  if (typeof rawDisplayName === 'string') {
    displayName = rawDisplayName;
  } else if (typeof rawFirstName === 'string') {
    displayName = [rawFirstName, rawLastName, rawMiddleName].filter((part): part is string => typeof part === 'string' && part.trim().length > 0).join(' ');
  } else if (typeof rawName === 'string') {
    displayName = rawName;
  }
  const email = typeof rec.email === 'string' ? rec.email : '';
  const id = typeof rec.id === 'string' ? rec.id : '';
  const role = typeof rec.role === 'string' ? rec.role : 'admin';
  const permissions = Array.isArray(rec.permissions)
    ? rec.permissions.filter((item): item is string => typeof item === 'string')
    : [];
  const photoURL = typeof rec.photoURL === 'string' ? rec.photoURL : undefined;

  return emptyProfile({
    id,
    displayName,
    email,
    photoURL,
    role,
    permissions,
    phoneNumber: typeof rec.phoneNumber === 'string' ? rec.phoneNumber : '',
    country: typeof rec.country === 'string' ? rec.country : '',
    address: typeof rec.address === 'string' ? rec.address : '',
    state: typeof rec.state === 'string' ? rec.state : '',
    city: typeof rec.city === 'string' ? rec.city : '',
    zipCode: typeof rec.zipCode === 'string' ? rec.zipCode : '',
    about: typeof rec.about === 'string' ? rec.about : '',
    passportSeries: typeof rec.passportSeries === 'string' ? rec.passportSeries : '',
    gender: rec.gender === 'male' || rec.gender === 'female' ? rec.gender : '',
    tenantId: typeof rec.tenantId === 'string' ? rec.tenantId : '',
    createdAt: typeof rec.createdAt === 'string' ? rec.createdAt : '',
    isPublic: typeof rec.isPublic === 'boolean' ? rec.isPublic : false,
  });
}

// ----------------------------------------------------------------------

export function useAppUserProfile() {
  const { user } = useAuthContext();

  if (!user) {
    return { user: emptyProfile() };
  }

  return { user: mapAuthUserToProfile(user) };
}
