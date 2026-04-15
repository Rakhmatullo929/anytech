/** Matches `auth_tenant.User.Role` after `humps.camelizeKeys`. */
export type UserRole = 'admin' | 'manager' | 'seller';

/** Matches DRF `UserSerializer` response (camelCase). */
export type TenantUser = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: UserRole;
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
  name: string;
  phone: string;
  email?: string | null;
  password: string;
  passwordConfirm: string;
};
