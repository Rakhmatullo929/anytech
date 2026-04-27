// ----------------------------------------------------------------------

export const paths = {
  login: '/login',
  profile: '/profile',

  pos: '/pos',
  products: {
    root: '/products',
    details: (id: string) => `/products/${id}`,
  },
  categories: {
    root: '/categories',
  },
  clients: {
    root: '/clients',
    groups: '/clients/groups',
    groupsDetails: (id: string) => `/clients/groups/${id}`,
    create: '/clients/new',
    edit: (id: string) => `/clients/${id}/edit`,
    details: (id: string) => `/clients/${id}`,
  },
  sales: {
    root: '/sales',
    details: (id: string) => `/sales/${id}`,
  },
  debts: {
    root: '/debts',
    details: (id: string) => `/debts/${id}`,
  },
  admin: {
    root: '/admin',
    users: {
      root: '/admin/users',
      details: (id: string) => `/admin/users/${id}`,
      create: '/admin/users/new',
      edit: (id: string) => `/admin/users/${id}/edit`,
    },
    roles: '/admin/roles',
  },

  components: '/components',
  maintenance: '/maintenance',
  page403: '/403',
  page404: '/404',
  page500: '/500',

  docs: 'https://docs.minimals.cc',
  changelog: 'https://docs.minimals.cc/changelog',

  auth: {
    jwt: {
      login: '/login',
    },
  },
};
