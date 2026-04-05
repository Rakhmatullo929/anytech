import type { TenantUser } from 'src/auth/api/types';
import type { AuthUserType } from 'src/auth/types';
import { useAuthContext } from 'src/auth/hooks';

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
  isPublic: boolean;
};

function isTenantUser(u: unknown): u is TenantUser {
  return (
    u !== null &&
    typeof u === 'object' &&
    typeof (u as TenantUser).id === 'string' &&
    typeof (u as TenantUser).name === 'string' &&
    typeof (u as TenantUser).email === 'string' &&
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
    isPublic: false,
    ...partial,
  };
}

function mapAuthUserToProfile(u: NonNullable<AuthUserType>): AppUserProfile {
  if (isTenantUser(u)) {
    return emptyProfile({
      id: u.id,
      displayName: u.name,
      email: u.email,
      photoURL: undefined,
      role: u.role,
    });
  }

  const rec = u as Record<string, unknown>;
  const { displayName: rawDisplayName, name: rawName } = rec;
  let displayName = '';
  if (typeof rawDisplayName === 'string') {
    displayName = rawDisplayName;
  } else if (typeof rawName === 'string') {
    displayName = rawName;
  }
  const email = typeof rec.email === 'string' ? rec.email : '';
  const id = typeof rec.id === 'string' ? rec.id : '';
  const role = typeof rec.role === 'string' ? rec.role : 'admin';
  const photoURL = typeof rec.photoURL === 'string' ? rec.photoURL : undefined;

  return emptyProfile({
    id,
    displayName,
    email,
    photoURL,
    role,
    phoneNumber: typeof rec.phoneNumber === 'string' ? rec.phoneNumber : '',
    country: typeof rec.country === 'string' ? rec.country : '',
    address: typeof rec.address === 'string' ? rec.address : '',
    state: typeof rec.state === 'string' ? rec.state : '',
    city: typeof rec.city === 'string' ? rec.city : '',
    zipCode: typeof rec.zipCode === 'string' ? rec.zipCode : '',
    about: typeof rec.about === 'string' ? rec.about : '',
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
