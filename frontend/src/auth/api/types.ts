/** Matches `auth_tenant.User.Role` after `humps.camelizeKeys`. */
export type UserRole = 'admin' | 'manager' | 'seller';

/** Matches DRF `UserSerializer` response (camelCase). */
export type TenantUser = {
  id: string;
  name: string;
  email: string;
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
  email: string;
  password: string;
};

/** Matches `RegisterSerializer` (camelCase request body). */
export type RegisterRequest = {
  tenantName: string;
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
};
