export type CashRegisterStatus = 'open' | 'closed';

export type CashRegister = {
  id: string;
  status: CashRegisterStatus;
  openedAt: string | null;
  closedAt: string | null;
  openedBy: string | null;
  openedByName: string | null;
  closedBy: string | null;
  closedByName: string | null;
};
