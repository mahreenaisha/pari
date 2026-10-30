# Pyari Pari — frontend

Expo (SDK 58) app with three tabs:

- **Listen**: a voice assistant built around a live "sky" orb (a Skia shader). Tap it, speak, and the reply can record a ledger entry.
- **QR**: your payment code for others to scan, with Copy ID and Share.
- **Ledger**: balance, money in and out, and a day-by-day list of entries.

## Run it

```bash
npm install          # also copies Skia's canvaskit.wasm into public/ for web
npx expo start       # then press i / a, scan the QR code with Expo Go, or press w for web
```

Before calling a change done, run `npx tsc --noEmit` and `npx expo lint`.

## Layout

```
src/
  app/            routes only (Expo Router): root stack and the (tabs) navigator
  features/       one folder per screen: screen UI, its hooks and components
  components/     shared UI (sky orb, tab bar, text, buttons, segmented control)
  services/       the only code that talks to the backend
  mocks/          in-memory data and a simulated voice session used until the backend exists
  theme/          colors, typography, spacing, motion
  types/          domain types shared with the backend (amounts are in paise)
```

Screens read data through React Query hooks (`features/*/use-*.ts`), and those hooks call `services/*`.

## Connecting the backend

Copy `.env.example` to `.env.local` (gitignored) and set `EXPO_PUBLIC_API_URL`. When it is empty, or when `EXPO_PUBLIC_USE_MOCKS=true`, the services return mock data instead.

- `services/api-client.ts`: the typed `fetch` wrapper. Add auth headers here.
- `services/ledger-service.ts` (`GET /ledger/entries`) and `services/profile-service.ts` (`GET /me`): the current endpoints.
- `services/voice-service.ts`: swap the simulated session for real audio capture and speech recognition. The screen only depends on the `VoiceSession` interface in `types/assistant.ts`.
