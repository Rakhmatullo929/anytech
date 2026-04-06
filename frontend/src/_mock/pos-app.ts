/** In-memory mock data for POS / catalog / CRM screens (see FRONTEND_PAGES.md). */

export type MockCatalogProduct = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  purchasePrice: number;
  salePrice: number;
};

export type MockClient = {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
};

export type MockSaleLine = {
  productName: string;
  quantity: number;
  price: number;
};

export type MockSale = {
  id: string;
  clientId: string | null;
  clientName: string;
  totalAmount: number;
  paymentType: 'cash' | 'card' | 'debt';
  createdAt: string;
  lines: MockSaleLine[];
};

export type MockDebtPayment = {
  amount: number;
  createdAt: string;
};

export type MockDebt = {
  id: string;
  clientId: string;
  clientName: string;
  totalAmount: number;
  paidAmount: number;
  remaining: number;
  status: 'active' | 'closed';
  payments: MockDebtPayment[];
};

export const MOCK_CATALOG: MockCatalogProduct[] = [
  {
    id: 'p1',
    name: 'Espresso',
    sku: 'DRK-001',
    stock: 120,
    purchasePrice: 0.8,
    salePrice: 2.5,
  },
  {
    id: 'p2',
    name: 'Croissant',
    sku: 'FD-014',
    stock: 40,
    purchasePrice: 1.2,
    salePrice: 3.5,
  },
  {
    id: 'p3',
    name: 'Latte',
    sku: 'DRK-002',
    stock: 80,
    purchasePrice: 1.1,
    salePrice: 3.9,
  },
];

export const MOCK_CLIENTS: MockClient[] = [
  { id: 'c1', name: 'Anna Karimova', phone: '+998901112233', createdAt: '2026-03-01T10:00:00Z' },
  { id: 'c2', name: 'Bob Smith', phone: '+998907776655', createdAt: '2026-03-15T14:30:00Z' },
];

export const MOCK_SALES: MockSale[] = [
  {
    id: 's1',
    clientId: 'c1',
    clientName: 'Anna Karimova',
    totalAmount: 12.5,
    paymentType: 'card',
    createdAt: '2026-04-01T09:15:00Z',
    lines: [
      { productName: 'Espresso', quantity: 2, price: 2.5 },
      { productName: 'Croissant', quantity: 2, price: 3.5 },
    ],
  },
  {
    id: 's2',
    clientId: null,
    clientName: 'Guest',
    totalAmount: 3.9,
    paymentType: 'cash',
    createdAt: '2026-04-02T11:00:00Z',
    lines: [{ productName: 'Latte', quantity: 1, price: 3.9 }],
  },
];

export const MOCK_DEBTS: MockDebt[] = [
  {
    id: 'd1',
    clientId: 'c2',
    clientName: 'Bob Smith',
    totalAmount: 100,
    paidAmount: 40,
    remaining: 60,
    status: 'active',
    payments: [
      { amount: 25, createdAt: '2026-03-20T12:00:00Z' },
      { amount: 15, createdAt: '2026-03-25T09:00:00Z' },
    ],
  },
];
