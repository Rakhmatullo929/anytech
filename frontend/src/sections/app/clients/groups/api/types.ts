import type { Pagination } from 'src/hooks/api';

export type Group = {
  id: string;
  tenant: string;
  name: string;
  description: string;
  clientCount: number;
  createdAt: string;
};

export type GroupsListParams = {
  page: number;
  pageSize: number;
  search?: string;
  ordering?: string;
};

export type GroupsListResponse = Pagination<Group>;

export type CreateGroupPayload = {
  name: string;
  description?: string;
};

export type UpdateGroupPayload = {
  id: string;
  name: string;
  description?: string;
};
