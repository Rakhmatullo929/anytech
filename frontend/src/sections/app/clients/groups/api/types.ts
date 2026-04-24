export type GroupListItem = {
  id: string;
  tenant: string;
  name: string;
  clientsCount: number;
  createdAt: string;
};

export type FetchGroupsListParams = {
  page: number;
  pageSize: number;
  search?: string;
  ordering?: string;
};
