import { request, API_ENDPOINTS } from 'src/utils/axios';

import type { CashRegister } from './types';

export function fetchCashRegisterStatus(): Promise<CashRegister> {
  return request<CashRegister>({ method: 'GET', url: API_ENDPOINTS.cashRegister.status });
}

export function openCashRegister(): Promise<CashRegister> {
  return request<CashRegister>({ method: 'POST', url: API_ENDPOINTS.cashRegister.open });
}

export function closeCashRegister(): Promise<CashRegister> {
  return request<CashRegister>({ method: 'POST', url: API_ENDPOINTS.cashRegister.close });
}
