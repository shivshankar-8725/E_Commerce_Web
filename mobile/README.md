# ChipKart Mobile (React Native / Expo)

Customer mobile app for the ChipKart platform. It reuses the **same Spring Boot backend APIs**
as the web app (`/api/auth`, `/api/products`, `/api/addresses`, `/api/orders`, …).

**Features (v1):** customer login & registration, shop (search), product detail, cart,
checkout with **Cash on Delivery**, order history and **live order tracking**.

> Online payment (Razorpay) and push notifications are intentionally not in this v1 build — see
> "Roadmap" below. COD covers the P4-APP-01 "place order" criterion end to end.

---

## 1. Prerequisites
- **Node 18+**
- **Expo** (no global install needed — we use `npx expo`)
- A way to run it:
  - **Expo Go** app on your phone (easiest), **or**
  - Android emulator / iOS simulator
- The **backend running and reachable** from the device (see step 3).

## 2. Install
```bash
cd mobile
npm install
# if Expo complains about versions: npx expo install --fix
```

## 3. Point the app at your backend  ⚠️ important
The phone/emulator can't reach the PC's `localhost`. Set `EXPO_PUBLIC_API_URL`:

| Running on | Use |
|---|---|
| Android **emulator** | `http://10.0.2.2:8080` (this is the default) |
| iOS **simulator** | `http://localhost:8080` |
| **Physical phone** (Expo Go) | `http://<your-PC-LAN-IP>:8080` (same Wi-Fi, e.g. `http://192.168.1.5:8080`) |
| Deployed backend | `https://api.yourdomain.com` |

```bash
# example for a physical phone
EXPO_PUBLIC_API_URL=http://192.168.1.5:8080 npx expo start
```
Find your LAN IP with `ipconfig` (Windows) / `ifconfig` (mac/Linux). Make sure the backend CORS
allows the app origin if you later call it from a browser build (native apps aren't subject to CORS).

## 4. Run
```bash
npx expo start
```
Scan the QR with **Expo Go** (Android) / Camera (iOS), or press `a` / `i` for emulator.

**Test login:** register a new customer in-app, or use any customer you created on the web.
(Admin accounts are blocked here — they use the web dashboard.)

---

## 5. Publishable Android build (Play Store) — EAS

1. Install EAS CLI and log in (needs a free Expo account):
   ```bash
   npm install -g eas-cli
   eas login
   ```
2. Initialize the project (writes the real `projectId` into `app.json`):
   ```bash
   eas init
   ```
3. Add the production API URL so the released app talks to your live backend. In `eas.json`,
   under `build.production`, add:
   ```json
   "env": { "EXPO_PUBLIC_API_URL": "https://api.yourdomain.com" }
   ```
4. Build the Play Store bundle (`.aab`):
   ```bash
   eas build -p android --profile production
   ```
   EAS builds in the cloud and gives you a download link for the `.aab`.
5. (Optional) Submit straight to Play Console (needs a Google Play developer account, one-time $25,
   and a service-account key):
   ```bash
   eas submit -p android --latest
   ```
   Or upload the `.aab` manually in the Play Console.

> Before publishing, add real launcher/splash icons (`./assets/icon.png`, adaptive icon, splash) and
> reference them in `app.json`. Bump `android.versionCode` for each store upload.

For a quick installable test build (APK, not for the Store):
```bash
eas build -p android --profile preview
```

---

## 6. Project structure
```
mobile/
  App.js                      app root (providers + navigation)
  app.json / eas.json         Expo + EAS build config
  src/
    config.js                 API base URL
    api/client.js             axios + JWT
    context/                  AuthContext, CartContext (AsyncStorage)
    navigation/RootNavigator  auth stack vs app stack
    screens/                  Login, Register, Shop, ProductDetail, Cart, Checkout, Orders, OrderDetail
    theme.js                  colors + helpers
```

## 7. Roadmap (not in v1)
- **Online payment**: add `react-native-razorpay` (needs an EAS *dev build*, not Expo Go) and call
  the existing `/api/payments/create-order` + `/api/payments/verify` endpoints.
- **Push notifications**: `expo-notifications` + register the device's Expo push token with the
  backend, then send via Expo Push (complements the SMS channel already built server-side).
- Dealer wholesale view (the app already shows whichever price the API returns for the logged-in role).
