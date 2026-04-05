# Фикстуры (Demo Data)

## Быстрый старт

```bash
# Загрузить демо-данные
python manage.py loaddata fixtures/demo_data.json

# Сбросить БД и загрузить заново
python manage.py flush --no-input
python manage.py loaddata fixtures/demo_data.json
```

---

## Что внутри

**36 объектов** — 2 tenant'а с полным набором данных для тестирования.

### Tenant 1: TechShop

| Сущность | Кол-во | Детали |
|----------|--------|--------|
| Users | 3 | admin, manager, seller |
| Products | 5 | iPhone 15 Pro, Samsung S24, AirPods Pro 2, MacBook Air M3, Чехол iPhone 15 |
| Clients | 3 | Aziz Nazarov, Malika Karimova, Otabek Mirzayev |
| Sales | 3 | cash (1350$), debt (1300$), card (950$) |
| Debts | 1 | Malika — 1300$, оплачено 500$ (2 платежа: 300$ + 200$) |

### Tenant 2: MobileWorld

| Сущность | Кол-во | Детали |
|----------|--------|--------|
| Users | 2 | admin, seller |
| Products | 3 | Xiaomi 14 Ultra, Redmi Note 13 Pro, Защитное стекло |
| Clients | 2 | Nodira Sultanova, Farhod Ergashev |
| Sales | 2 | debt (810$), cash (300$) |
| Debts | 1 | Nodira — 810$, не оплачен |

---

## Учётные записи

| Email | Пароль | Роль | Tenant |
|-------|--------|------|--------|
| admin@techshop.com | admin123 | admin | TechShop |
| manager@techshop.com | admin123 | manager | TechShop |
| seller@techshop.com | admin123 | seller | TechShop |
| admin@mobileworld.com | admin123 | admin | MobileWorld |
| seller@mobileworld.com | admin123 | seller | MobileWorld |

---

## UUID справочник

Все ID читаемые для удобства отладки.

### Tenants
| Название | UUID |
|----------|------|
| TechShop | `a1000000-0000-0000-0000-000000000001` |
| MobileWorld | `a1000000-0000-0000-0000-000000000002` |

### Users
| Имя | UUID |
|-----|------|
| Alisher Karimov (admin, TechShop) | `b1000000-0000-0000-0000-000000000001` |
| Dilshod Rakhimov (manager, TechShop) | `b1000000-0000-0000-0000-000000000002` |
| Sardor Umarov (seller, TechShop) | `b1000000-0000-0000-0000-000000000003` |
| Jasur Toshmatov (admin, MobileWorld) | `b1000000-0000-0000-0000-000000000004` |
| Bekzod Aliyev (seller, MobileWorld) | `b1000000-0000-0000-0000-000000000005` |

### Products
| Товар | UUID | Tenant |
|-------|------|--------|
| iPhone 15 Pro | `c1000000-...-000000000001` | TechShop |
| Samsung Galaxy S24 | `c1000000-...-000000000002` | TechShop |
| AirPods Pro 2 | `c1000000-...-000000000003` | TechShop |
| MacBook Air M3 | `c1000000-...-000000000004` | TechShop |
| Чехол iPhone 15 | `c1000000-...-000000000005` | TechShop |
| Xiaomi 14 Ultra | `c1000000-...-000000000006` | MobileWorld |
| Redmi Note 13 Pro | `c1000000-...-000000000007` | MobileWorld |
| Защитное стекло | `c1000000-...-000000000008` | MobileWorld |

### Clients
| Клиент | UUID | Tenant |
|--------|------|--------|
| Aziz Nazarov | `d1000000-...-000000000001` | TechShop |
| Malika Karimova | `d1000000-...-000000000002` | TechShop |
| Otabek Mirzayev | `d1000000-...-000000000003` | TechShop |
| Nodira Sultanova | `d1000000-...-000000000004` | MobileWorld |
| Farhod Ergashev | `d1000000-...-000000000005` | MobileWorld |

### Sales
| Продажа | Сумма | Тип | Клиент | Tenant |
|---------|-------|-----|--------|--------|
| `e1000000-...-01` | 1350$ | cash | Aziz | TechShop |
| `e1000000-...-02` | 1300$ | debt | Malika | TechShop |
| `e1000000-...-03` | 950$ | card | Otabek | TechShop |
| `e1000000-...-04` | 810$ | debt | Nodira | MobileWorld |
| `e1000000-...-05` | 300$ | cash | Farhod | MobileWorld |

### Debts
| Долг | Сумма | Оплачено | Остаток | Статус | Клиент |
|------|-------|----------|---------|--------|--------|
| `11000000-...-01` | 1300$ | 500$ | 800$ | active | Malika (TechShop) |
| `11000000-...-02` | 810$ | 0$ | 810$ | active | Nodira (MobileWorld) |

---

## Тестирование tenant isolation

Залогиниться под `admin@techshop.com` — должны быть видны только данные TechShop.
Залогиниться под `admin@mobileworld.com` — только данные MobileWorld.

```bash
# Получить токен TechShop
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@techshop.com", "password": "admin123"}'

# Получить токен MobileWorld
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@mobileworld.com", "password": "admin123"}'
```

---

## Тестирование RBAC

Три роли с разными уровнями доступа:

| Роль | Доступ |
|------|--------|
| admin | Полный доступ |
| manager | Всё кроме admin-only операций |
| seller | Только базовые операции (продажи, просмотр) |

```bash
# Токен seller — должен получить 403 на admin-only endpoints
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "seller@techshop.com", "password": "admin123"}'
```

---

## Создание новой фикстуры из текущей БД

```bash
# Экспорт всех данных
python manage.py dumpdata auth_tenant products clients sales debts \
  --indent 2 --output fixtures/dump.json

# Экспорт конкретного приложения
python manage.py dumpdata products --indent 2 --output fixtures/products.json
```
