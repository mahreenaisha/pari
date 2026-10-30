# Pyari Pari — frontend

Expo (SDK 58) app for a voice-first khata. The merchant speaks an entry, confirms it, and collects what is still owed; payments close entries by themselves.

- **Listen**: tap the sky orb and speak, e.g. "Gupta ji ne 350 ka samaan liya, 200 UPI diya, 150 baaki". Pari reads it back ("Gupta ji, ₹150 baaki. Save karoon?") and nothing is saved until the merchant says or taps yes. If money is still owed, Pari offers to text a payment link, asking for the customer's number the first time only.
- **QR**: the shop's payment code. When money lands on it without a link, a card asks "₹150 aaya, Gupta ji ka?" and steps through the likeliest open entries.
- **Ledger**: what is left to collect, what came in today, and every entry with its baaki, grouped by day.

## Run it

```bash
npm install          # also copies Skia's canvaskit.wasm into public/ for web
npx expo start       # then press i / a, scan the QR code with Expo Go, or press w for web
```

Before calling a change done, run `npx tsc --noEmit` and `npx expo lint`.

With mock data, the voice session plays three scripted utterances in turn, a sent link gets paid about 9 seconds later, and after "Abhi nahi" the customer pays on the QR about 6 seconds later. One unmatched QR payment is waiting at launch. Reloading resets everything.

## Layout

```
src/
  app/            routes only (Expo Router): root stack and the (tabs) navigator
  features/       one folder per screen: screen UI, its hooks and components
  components/     shared UI (sky orb, tab bar, text, buttons, segmented control)
  services/       the only code that talks to the backend
  mocks/          in-memory backend, simulated voice session and payment events
  theme/          colors, typography, spacing, motion
  types/          domain types shared with the backend (amounts are in paise)
```

Screens read data through React Query hooks (`features/*/use-*.ts`), and those hooks call `services/*`.

## Connecting the backend

Copy `.env.example` to `.env.local` (gitignored) and set `EXPO_PUBLIC_API_URL`. When it is empty, or when `EXPO_PUBLIC_USE_MOCKS=true`, the services use the mocks instead. Add auth headers in `services/api-client.ts`.

Endpoints the services expect:

- `GET /me`: the shop's profile and QR payload.
- `GET /ledger/entries`: confirmed entries (`open` or `closed`).
- `POST /ledger/entries/:id/confirm` and `DELETE /ledger/entries/:id`: the merchant's yes or no on a draft.
- `POST /ledger/entries/:id/payment-link` with `{ phone? }`: texts a link for what is still owed and returns the entry.
- `GET /payments/qr/unmatched`: QR payments with ranked `suggestions`.
- `POST /payments/qr/:id/match` with `{ entryId }`, and `POST /payments/qr/:id/dismiss`.

Still simulated:

- `services/voice-service.ts`: speech capture, speech-to-text and extraction. For a new entry the backend should create the draft (status `unconfirmed`) and return it; for follow-ups it returns the phone digits or a yes/no. Playing the read-back aloud also belongs here.
- `subscribeToPaymentEvents` in `services/payments-service.ts`: needs a push channel (WebSocket, SSE or push notifications) so a paid link or a new QR payment refreshes the app.
