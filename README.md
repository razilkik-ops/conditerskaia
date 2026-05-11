# Сахарная Орбита

Production-ready MVP витрины кондитерской на `Node.js`, `Express`, `Prisma`, `PostgreSQL`, `JavaScript` и `Socket.IO`.

В интерфейсе есть:

- витрина десертов с проверкой остатков на дату;
- конфигуратор тортов по весу, начинке и декору;
- корзина в `localStorage`;
- регистрация, вход и личный кабинет;
- история заказов со статусами заказа и оплаты;
- checkout с UX-состояниями;
- мок онлайн-оплаты;
- админка заказов с realtime-обновлениями через Socket.IO;
- адаптивный премиальный дизайн кондитерской.

## Структура

```text
.
├── prisma
│   ├── schema.prisma
│   └── seed.js
├── public
│   ├── admin.html
│   ├── index.html
│   ├── css
│   │   └── styles.css
│   └── js
│       ├── admin.js
│       ├── api.js
│       ├── app.js
│       ├── cart.js
│       ├── checkout.js
│       └── components.js
└── src
    ├── app.js
    ├── server.js
    ├── config
    ├── lib
    ├── middleware
    ├── routes
    ├── services
    └── validators
```

## Запуск

1. Установите зависимости:

```bash
npm install
```

2. Создайте `.env`:

```bash
cp .env.example .env
```

3. Поднимите PostgreSQL и укажите `DATABASE_URL` в `.env`.

4. Примените миграцию и seed:

```bash
npm run prisma:migrate -- --name init
npm run db:seed
```

5. Запустите проект:

```bash
npm run dev
```

Витрина: `http://localhost:3000`

Админка: `http://localhost:3000/admin.html`

Данные администратора по умолчанию:

```text
admin@candy.local
admin12345
```

## Деньги

Суммы хранятся в копейках/центах как `Int`. Например, `720` означает `7 BYN`, а `6800` означает `68 BYN`.

## Мок-оплата

После создания заказа сервер создаёт запись `Payment` с provider `MOCK` и ссылкой:

```text
/api/payments/mock/:orderId
```

Переход по ссылке переводит `Order.paymentStatus` и `Payment.status` в `PAID`, а админка получает событие `order:paid`.

## Где менять изображения

Временные картинки лежат в seed-данных как `Product.imageUrl`. Их можно заменить на реальные фотографии, CDN-ссылки или локальные файлы в `public/assets`.

## Деплой через Docker

1. Подготовьте production env:

```bash
cp .env.deploy.example .env.deploy
```

2. Заполните в `.env.deploy`:

```text
POSTGRES_PASSWORD=
SESSION_SECRET=
APP_URL=https://ваш-домен
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

3. Поднимите проект:

```bash
docker compose --env-file .env.deploy up -d --build
```

4. Если нужен демо-контент при первом запуске, включите:

```text
RUN_SEED=true
```

После первого наполнения лучше вернуть `RUN_SEED=false`, чтобы seed не перезаписывал данные при следующем старте контейнера.

Приложение само выполнит `prisma migrate deploy` перед запуском сервера.
