/** Client row from `GET /api/v1/clients/` (camelCase after axios transform). */
export type ClientCommunicationLanguage = '' | 'uz' | 'ru' | 'en';

export type ClientListItem = {
  id: string;
  tenant: string;
  name: string;
  lastName: string;
  middleName: string;
  birthDate: string | null;
  communicationLanguage: ClientCommunicationLanguage;
  gender: string;
  maritalStatus: string;
  phone: string;
  phones: string[];
  addresses: ClientAddress[];
  socialNetworks: ClientSocialNetworks;
  groups: string[];
  createdAt: string;
};

export type FetchClientsListParams = {
  page: number;
  pageSize: number;
  search?: string;
  ordering?: string;
};

export type CreateClientPayload = {
  name: string;
  lastName?: string;
  middleName?: string;
  birthDate?: string | null;
  communicationLanguage?: ClientCommunicationLanguage;
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
  communicationLanguage?: ClientCommunicationLanguage;
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

export type ClientSaleItem = {
  id: string;
  productName: string;
  quantity: number;
  price: string;
};

export type ClientSaleDebt = {
  totalAmount: string;
  paidAmount: string;
  remaining: string;
  status: string;
};

export type ClientSale = {
  id: string;
  totalAmount: string;
  paymentType: 'cash' | 'card' | 'debt';
  createdAt: string;
  items: ClientSaleItem[];
  debt: ClientSaleDebt | null;
};

/** Client detail from `GET /api/v1/clients/{id}/` (camelCase after axios transform). */
export type ClientDetail = ClientListItem & {
  sales: ClientSale[];
  totalDebt: string;
};
