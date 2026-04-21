export type LocationRegion = {
  id: string;
  name: string;
  code: string;
};

export type LocationDistrict = {
  id: string;
  regionId: string;
  name: string;
  code: string;
};

export type TenantUserListItem = {
  id: string;
  tenantId: string | null;
  firstName: string;
  lastName?: string;
  middleName?: string;
  birthDate?: string | null;
  regionId?: string | null;
  districtId?: string | null;
  region?: LocationRegion | null;
  district?: LocationDistrict | null;
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
  firstName: string;
  lastName?: string;
  middleName?: string;
  birthDate?: string | null;
  regionId?: string | null;
  districtId?: string | null;
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
  firstName: string;
  lastName?: string;
  middleName?: string;
  birthDate?: string | null;
  regionId?: string | null;
  districtId?: string | null;
  phone: string;
  email?: string | null;
  passportSeries?: string | null;
  gender?: 'male' | 'female' | null;
  role: 'admin' | 'manager' | 'seller';
  password?: string;
  passwordConfirm?: string;
};
