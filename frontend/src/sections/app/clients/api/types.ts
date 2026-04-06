/** Client row from `GET /api/v1/clients/` (camelCase after axios transform). */
export type ClientListItem = {
  id: string;
  tenant: string;
  name: string;
  phone: string;
  createdAt: string;
};

export type FetchClientsListParams = {
  page: number;
  pageSize: number;
  search?: string;
  ordering?: string;
};
