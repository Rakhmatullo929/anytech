// ----------------------------------------------------------------------

export const paths = {
  login: '/login',
  register: '/register',

  pos: '/pos',
  products: {
    root: '/products',
    details: (id: string) => `/products/${id}`,
  },
  clients: {
    root: '/clients',
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
      register: '/register',
    },
  },
};
