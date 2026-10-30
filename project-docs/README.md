# ChandraMall Project Guide

This folder is intended as a newcomer onboarding guide for the repo after cloning it from GitHub.

## 1. What this project is

This repository is the mobile frontend for the Chandra Mall app. It is built with Expo + React Native and uses file-based routing from Expo Router.

Key project files:

- `app/` — screens and routes
- `components/` — reusable UI components
- `constants/` — app settings and API endpoint config
- `package.json` — scripts and dependencies

## 2. After pulling the repo from GitHub

Run the following commands from the project root:

```bash
cd ChandraMall_Projek_KerjaPraktek
npm install
npx expo start
```

Then:

1. Open the app in Android emulator, iOS simulator, or Expo Go.
2. If you are using a real device, use the LAN IP instead of `localhost` for the backend URL.
3. If the backend is not running, the app will not load products, cart, wishlist, orders, or login data.

## 3. Required environment

This project depends on:

- Node.js + npm
- Expo SDK compatible with the project
- A PHP/MySQL backend that serves the endpoint defined in the app

Important: the database and backend API do not live inside this repo. The app expects a separate server to be running and reachable at:

```text
http://localhost/chandra/db.php
```

That value is defined in:

- `constants/Api.ts`

## 4. What data source this app uses

From the code, the app does not read from a local SQLite database or a built-in app database. It calls an external PHP endpoint:

```ts
export const BASE = "http://localhost/chandra/db.php";
```

The frontend uses fetch requests with action parameters such as:

- `products`
- `categories`
- `vendors`
- `product`
- `reviews`
- `login`
- `cart`
- `wishlist`
- `checkout`
- `orders`

This means the real database is likely MySQL behind the PHP API, but the actual database schema and PHP backend code are not included in this repo.

## 5. How the app runs at runtime

The runtime path is roughly:

```text
Expo app (React Native)
    -> app/*.tsx screens
    -> fetch() to BASE endpoint
    -> http://localhost/chandra/db.php
    -> PHP backend
    -> MySQL database (expected)
    -> JSON response back to mobile app
```

Examples from the code:

- `app/(tabs)/index.tsx` calls `fetch(`${BASE}?action=products`)`
- `app/login.tsx` calls `fetch(`${BASE}?action=login`, { method: "POST" ... })`
- `app/(tabs)/cart.tsx` calls `fetch(`${BASE}?action=cart&user_id=${USER_ID}`)`
- `app/orders.tsx` calls `fetch(`${BASE}?action=orders&user_id=${USER_ID}`)`

User data in the current code is also hardcoded in several screens with `const USER_ID = 1;`.

## 6. Important notes for new developers

- The repository is the frontend only.
- The backend and database are separate from this project.
- If the PHP server is not running, the app will show errors or blank data.
- If testing on a physical device, use the host machine IP instead of `localhost`.
- Example for Android emulator: use `10.0.2.2` to reach the host machine.
- Example for physical device: use something like `http://192.168.1.10/chandra/db.php`.

## 7. Typical startup sequence

1. Clone the repo.
2. Install dependencies.
3. Start the API server / PHP backend.
4. Make sure `db.php` is reachable at the expected URL.
5. Run the Expo app.
6. Test login and product browsing.
7. Verify cart, wishlist, orders, and checkout flows.

## 8. Main app entry points

Representative route files:

- `app/index.tsx` — app entry / startup screen
- `app/login.tsx` — login screen
- `app/(tabs)/index.tsx` — main product catalog
- `app/(tabs)/explore.tsx` — category discovery
- `app/(tabs)/cart.tsx` — cart management
- `app/(tabs)/wishlist.tsx` — wishlist
- `app/orders.tsx` — order list
- `app/checkout.tsx` — checkout flow
- `app/product/[id].tsx` — product detail page
- `app/vendor/[slug].tsx` — vendor detail page

## 9. Suggested first validation

After setup, confirm these are working:

```bash
npx expo start
npx expo lint
```

If the backend is connected correctly, the app should load categories and products. If the API is unreachable, the frontend will throw errors in the console and data sections will appear empty.

## 10. Final note

If a new developer joins this project, the most important thing to know is this:

> This repo is the Expo mobile client connected to an external PHP backend that serves data from a database, but the database and PHP service itself are not included in the repository.
