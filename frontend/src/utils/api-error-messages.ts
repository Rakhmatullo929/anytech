import axios from 'axios';

import type { BaseError } from 'src/hooks/api/types';

import { errorReader } from './error-reader';

export type AuthFormContext = 'login' | 'register';

/**
 * User-facing copy for JWT login / register forms (Russian).
 */
export function getAuthFormErrorMessage(error: unknown, context: AuthFormContext): string {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error) {
      return error.message;
    }
    return typeof error === 'string' ? error : 'Не удалось выполнить запрос. Попробуйте ещё раз.';
  }

  const status = error.response?.status;
  const data = error.response?.data;

  if (status === 401 && context === 'login') {
    const detail =
      data && typeof data === 'object' && 'detail' in data
        ? String((data as { detail: unknown }).detail).toLowerCase()
        : '';
    if (detail.includes('no active account') || detail.includes('credentials') || detail.includes('authentication')) {
      return 'Неверный номер телефона или пароль. Проверьте данные и попробуйте снова.';
    }
    return 'Неверный номер телефона или пароль. Если забыли пароль — воспользуйтесь восстановлением (когда будет доступно).';
  }

  if (status === 401 && context === 'register') {
    return 'Запрос отклонён. Выйдите из аккаунта или обновите страницу и попробуйте снова.';
  }

  if (status === 400 || status === 403) {
    return errorReader(error as BaseError);
  }

  if (status === 404) {
    return 'Адрес API не найден. Проверьте настройки сервера.';
  }

  if (status === 429) {
    return 'Слишком много попыток. Подождите немного и попробуйте снова.';
  }

  if (status !== undefined && status >= 500) {
    return 'Ошибка на сервере. Попробуйте позже или напишите в поддержку.';
  }

  if (status === undefined || status === 0) {
    return 'Нет связи с сервером. Проверьте интернет и что backend запущен.';
  }

  return errorReader(error as BaseError);
}
