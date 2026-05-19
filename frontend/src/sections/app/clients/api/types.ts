export type ClientListItem = {
  id: string;
  tenant: string;
  name: string;
  lastName: string;
  middleName: string;
  birthDate: string | null;
  gender: string;
  maritalStatus: string;
  phone: string;
  phones: string[];
  addresses: ClientAddress[];
  socialNetworks: ClientSocialNetworks;
  groups: string[];
  createdAt: string;
  lastPurchaseAt: string | null;
  firstPurchaseAt: string | null;
  totalPurchasesAmount: string;
  salesCount: number;
};

export type FetchClientsListParams = {
  page: number;
  pageSize: number;
  search?: string;
  ordering?: string;
  groupId?: string;
  groupIds?: string[];
  gender?: string;
};

export type ExportClientsParams = {
  search?: string;
  ordering?: string;
  groupIds?: string[];
  gender?: string;
};

export type CreateClientPayload = {
  name: string;
  lastName?: string;
  middleName?: string;
  birthDate?: string | null;
  gender?: string;
  maritalStatus?: string;
  phones: string[];
  addresses?: ClientAddress[];
  socialNetworks?: ClientSocialNetworks;
  groups?: string[];
};

export type UpdateClientPayload = {
  id: string;
  name: string;
  lastName?: string;
  middleName?: string;
  birthDate?: string | null;
  gender?: string;
  maritalStatus?: string;
  phones: string[];
  addresses?: ClientAddress[];
  socialNetworks?: ClientSocialNetworks;
  groups?: string[];
};

export type ClientAddress = {
  country?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  note?: string;
};

export type ClientSocialNetworks = {
  email?: string;
  telegram?: string;
  instagram?: string;
  facebook?: string;
};

export type BulkCreateClientsResult = {
  created: number;
  results: ClientListItem[];
};

export type ClientDetail = ClientListItem;
