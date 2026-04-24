export type GroupListItem = {
  id: string;
  tenant: string;
  name: string;
  description: string;
  clientsCount: number;
  createdAt: string;
};

export type GroupDetail = GroupListItem;

export type FetchGroupsListParams = {
  page: number;
  pageSize: number;
  search?: string;
  ordering?: string;
};

export type CreateGroupPayload = {
  name: string;
  description?: string;
};

export type UpdateGroupPayload = {
  id: string;
  name: string;
  description?: string;
};
