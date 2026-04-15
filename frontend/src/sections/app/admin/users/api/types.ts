export type TenantUserListItem = {
  id: string;
  tenantId: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  passportSeries: string | null;
  gender: 'male' | 'female' | null;
  role: 'admin' | 'manager' | 'seller';
  createdAt: string;
};

export type TenantUserDetail = TenantUserListItem;

export type FetchTenantUsersParams = {
  page: number;
  pageSize: number;
  search?: string;
  ordering?: string;
};

export type CreateTenantUserPayload = {
  name: string;
  phone: string;
  email?: string | null;
  passportSeries?: string | null;
  gender?: 'male' | 'female' | null;
  role: 'admin' | 'manager' | 'seller';
  password: string;
  passwordConfirm: string;
};

export type UpdateTenantUserPayload = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  passportSeries?: string | null;
  gender?: 'male' | 'female' | null;
  role: 'admin' | 'manager' | 'seller';
  password?: string;
  passwordConfirm?: string;
};
