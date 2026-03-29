# Зоопитомник — система бронирования мест для постоя

Сервис для временного размещения животных (зоопитомник). Владельцы **сдают** питомцев на время, бронируя подходящее место. Животных не берут — только сдают.

## Стек

- Vue 3 + Vite
- Firebase (Firestore + Authentication)

---

## Коллекции Firebase

### `animals` — места для постоя

Каждый документ описывает одно место (вольер, клетку, комнату), доступное для бронирования.

| Поле | Тип | Описание |
|---|---|---|
| `name` | string | Название места (напр. «Вольер №1 для собак») |
| `species` | string | Вид принимаемых животных (Собаки, Кошки…) |
| `breed` | string | Уточнение породы (необязательно) |
| `category` | string | Категория: Кошки / Собаки / Птицы / Грызуны / Рептилии / Экзотика |
| `age` | number | Вместимость / параметр размера |
| `gender` | string | Тип вольера: «Стандарт» / «Люкс» |
| `description` | string | Описание места |
| `price` | number | Стоимость в сутки (₽) |
| `imageUrl` | string | URL фото |
| `available` | boolean | `true` — место свободно, `false` — занято |
| `rating` | number | Средний рейтинг (вычисляется автоматически) |
| `reviewsCount` | number | Количество отзывов |

---

### `bookings` — заявки на постой

Каждый документ — одна заявка от владельца питомца.

| Поле | Тип | Описание |
|---|---|---|
| `userId` | string | UID пользователя (из Firebase Auth) |
| `userEmail` | string | Email пользователя |
| `animalId` | string | ID места из коллекции `animals` |
| `animalName` | string | Название места (денормализовано) |
| `animalCategory` | string | Категория места (денормализовано) |
| `type` | string | `"visit"` — краткосрочный (до 7 дней), `"adoption"` — долгосрочный (от 7 дней) |
| `date` | string | Дата заезда (YYYY-MM-DD) |
| `time` | string | Время заезда (HH:MM) |
| `status` | string | `pending` / `confirmed` / `completed` / `cancelled` |
| `createdAt` | Timestamp | Дата создания заявки |

---

### `userData` — профили пользователей

| Поле | Тип | Описание |
|---|---|---|
| `displayName` | string | Имя пользователя |
| `email` | string | Email |
| `role` | string | `"user"` / `"admin"` |
| `createdAt` | Timestamp | Дата регистрации |

---

### `reviews` — отзывы о местах

| Поле | Тип | Описание |
|---|---|---|
| `userId` | string | UID автора |
| `userEmail` | string | Email автора |
| `userName` | string | Имя автора |
| `animalId` | string | ID места из `animals` |
| `animalName` | string | Название места (денормализовано) |
| `text` | string | Текст отзыва |
| `rating` | number | Оценка 1–5 |
| `createdAt` | Timestamp | Дата публикации |
