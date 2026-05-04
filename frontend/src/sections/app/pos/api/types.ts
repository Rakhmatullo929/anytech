import type { SaleListItem, SalePaymentType } from 'src/sections/app/sales/api/types';

export type { SaleListItem, SalePaymentType };

export type CartLine = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  availableStock: number;
};

export type CreateSalePayload = {
  client: string;
  paymentType: SalePaymentType;
  items: Array<{
    product: string;
    quantity: number;
    price: string;
  }>;
};
