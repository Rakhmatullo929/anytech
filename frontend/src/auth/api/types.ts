/** Matches `auth_tenant.User.Role` after `humps.camelizeKeys`. */
export type UserRole = 'admin' | 'manager' | 'seller';

/** Matches DRF `UserSerializer` response (camelCase). */
export type TenantUser = {
  id: string;
  firstName: string;
  lastName?: string;
  middleName?: string;
  birthDate?: string | null;
  phone: string | null;
  email: string | null;
  passportSeries?: string | null;
  gender?: 'male' | 'female' | null;
  role: UserRole;
  permissions?: string[];
  tenantId: string | null;
  createdAt: string;
};

/** Login + register responses from Django JWT / register view. */
export type TokenPairResponse = {
  access: string;
  refresh: string;
  user: TenantUser;
};

export type LoginRequest = {
  phone: string;
  password: string;
};

/** Matches `RegisterSerializer` (camelCase request body). */
export type RegisterRequest = {
  tenantName: string;
  firstName: string;
  phone: string;
  email?: string | null;
  password: string;
  passwordConfirm: string;
};
