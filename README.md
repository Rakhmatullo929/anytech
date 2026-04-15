# AnyTech — Multi-tenant ERP/POS System

Multi-tenant ERP/POS система с Django REST API бэкендом и React TypeScript фронтендом.
Все данные изолированы по тенантам (арендаторам) через ForeignKey связи.

## Технологии

### Backend
- Python 3.12, Django 5.1+, Django REST Framework 3.15+
- JWT аутентификация (djangorestframework-simplejwt)
- Celery + Redis (асинхронные задачи)
- PostgreSQL 16 (production) / SQLite (development)
- Argon2 хеширование паролей
- UUID первичные ключи

### Frontend
- React 18 + TypeScript
- MUI 5 (Material UI), Redux Toolkit
- react-hook-form + yup (валидация форм)
- Axios (HTTP клиент)

## Архитектура

### Мультитенантность
Каждая доменная модель содержит `tenant = ForeignKey(Tenant)`. ViewSet-ы наследуют `TenantQuerySetMixin` из `auth_tenant.mixins`, который автоматически фильтрует запросы и устанавливает тенант при создании/обновлении записей.

### Приложения

| Приложение | Описание |
|---|---|
| **auth_tenant** | Тенанты, пользователи (роли: admin/manager/seller), JWT регистрация/логин, RBAC права (`IsAdmin`, `IsManagerOrAbove`, `IsSellerOrAbove`) |
| **products** | Товары (SKU, цена закупки/продажи, остаток на складе) |
| **clients** | Клиенты (имя, телефон, привязка к тенанту) |
| **sales** | Продажи (тип оплаты: cash/card/debt) + позиции продажи (SaleItem) |
| **debts** | Долги (OneToOne к Sale, отслеживание оплат, статус active/closed) + платежи |

## API Endpoints

Все эндпоинты под `/api/v1/`. Глобальные настройки: `IsAuthenticated`, `JWTAuthentication`, пагинация по 20 записей.

### Аутентификация
- `POST /api/v1/auth/register/` — регистрация тенанта и администратора
- `POST /api/v1/auth/login/` — вход по телефону (возвращает JWT с `tenant_id`, `role`, `name`)

### Товары
- `GET /api/v1/products/` — список товаров
- `POST /api/v1/products/` — создание товара
- `GET /api/v1/products/:id/` — детали товара
- `PUT/PATCH /api/v1/products/:id/` — обновление товара
- `DELETE /api/v1/products/:id/` — удаление товара

### Клиенты
- `GET /api/v1/clients/` — список клиентов
- `POST /api/v1/clients/` — создание клиента
- `GET /api/v1/clients/:id/` — детали клиента
- `PUT/PATCH /api/v1/clients/:id/` — обновление клиента
- `DELETE /api/v1/clients/:id/` — удаление клиента

### Продажи (POS)
- `POST /api/v1/sales/` — создание продажи (атомарно: валидация позиций, блокировка товаров, списание со склада, создание продажи + позиций; автоматическое создание долга при `payment_type=debt`)
- `GET /api/v1/sales/` — список продаж (фильтрация по `payment_type`)
- `GET /api/v1/sales/:id/` — детали продажи с вложенными позициями

### Долги
- `GET /api/v1/debts/` — список долгов (фильтрация по `status`)
- `GET /api/v1/debts/:id/` — детали долга с историей платежей
- `POST /api/v1/debts/:id/pay/` — добавить платёж (валидация суммы, автозакрытие долга при полной оплате)

## Запуск

### Docker (рекомендуется)
```bash
make build            # Сборка контейнеров
make up               # Запуск (PostgreSQL, Redis, Django, Celery worker/beat)
make down             # Остановка
make test             # Запуск тестов
make migrate          # Применить миграции
make makemigrations   # Создать миграции
```

### Локально (без Docker)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
DJANGO_SETTINGS_MODULE=config.settings.development python manage.py migrate
DJANGO_SETTINGS_MODULE=config.settings.development python manage.py runserver
```

**Frontend:**
```bash
cd frontend
yarn install
yarn start    # Dev сервер на :3000
```

### Демо-данные
```bash
python manage.py migrate
python manage.py loaddata fixtures/01-auth.yaml fixtures/02-products.yaml fixtures/03-clients.yaml fixtures/04-sales.yaml fixtures/05-debts.yaml
```
Загружает: 2 тенанта, 5 пользователей, 8 товаров, 5 клиентов, 8 продаж, 9 позиций продаж, 5 долгов, 5 платежей.

## Что реализовано

- [x] **Этап 1** — Аутентификация и тенанты: кастомная модель пользователя (phone-based login, UUID PK), JWT с кастомными claims, регистрация/логин
- [x] **Этап 2** — Управление товарами: CRUD товаров с SKU, ценами закупки/продажи, остатками на складе
- [x] **Этап 3** — Управление клиентами: CRUD клиентов с уникальными телефонами в рамках тенанта
- [x] **Этап 4** — Клиентская часть: детальные сериализаторы, вьюсеты, миграции
- [x] **Этап 5** — Продажи и долги: POS-операции, атомарное создание продаж, списание товаров со склада, управление долгами и платежами
- [x] **Этап 6** — Админка: регистрация всех моделей в Django Admin
- [x] **Фикстуры** — демо-данные для быстрого развёртывания
- [x] **RBAC** — ролевая модель доступа (admin/manager/seller)
- [x] **Docker** — контейнеризация с docker-compose (PostgreSQL, Redis, Celery)
