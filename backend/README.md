<div align="center">

# ⚡ Pari Backend API & Ambient CLI
### Core Financial Engine, Sarvam Indic Voice Pipeline & Paytm Settlement Server

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-black?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Kysely](https://img.shields.io/badge/ORM-Kysely-brightgreen?style=for-the-badge)](https://kysely.dev/)
[![Sarvam AI](https://img.shields.io/badge/AI-Sarvam%20Cloud-6C47FF?style=for-the-badge)](https://sarvam.ai/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20PGlite-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://github.com/electric-sql/pglite)
[![Vitest](https://img.shields.io/badge/Tests-786%20Passed-brightgreen?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)

<br/>

[Overview](#-overview) • [Stack](#-stack) • [11 Languages](#-11-indic-languages-support) • [Database Options](#-database-options) • [Quickstart](#-quickstart--configuration) • [CLI Client](#-hands-free-terminal-cli) • [API Reference](#-api-reference) • [Paytm Sandbox](#-paytm-sandbox-setup) • [Testing](#-testing--quality)

---

</div>

## 📌 Overview

The Pari backend is an Express 5 + TypeScript service that provides:
1. **Conversational Engine**: Serialized, per-merchant state machine managing spoken interactions without race conditions. Supports udhar credit entries, cash repayments at the counter (*"Gupta ji ne 100 diye"*), balance queries (*"Gupta ji ka kitna baaki hai?"*), and customer disambiguation (*"Gupta didi"* vs *"Gupta ji"*).
2. **Sarvam AI Voice Pipeline**: Multi-turn speech-to-text (`saaras:v4`), 105B parameter LLM entity extraction (`sarvam-105b-conversations`), and chunked low-latency text-to-speech (`bulbul:v4-flash` / `bulbul:v3`).
3. **Deterministic Financial Core**: Strict mathematical invariant validation ($Total = Paid + Pending$) and vernacular number parsing (*sau*, *hazaar*, *dedh*, *dhai*, Indic script digits).
4. **Paytm Payment Settlement**: Automatic SMS payment link generation and dual-channel reconciliation (exact order IDs vs heuristic counter QR payments).
5. **Real-time Event Streaming**: Server-Sent Events (SSE) broadcasting ledger updates, proactive prompts, and soundbox-style payment announcements.
6. **Hands-Free Ambient CLI**: Terminal-based client with automated ambient noise calibration, Voice Activity Detection (VAD), and push-to-talk.

---

## 🛠️ Stack

* **Runtime**: Node.js `20.12+` (v22+ recommended), ESM modules (`"type": "module"`).
* **Framework**: Express `5.3+`, Helmet, CORS, Express-Rate-Limit.
* **Database & ORM**: **Kysely** query builder running over:
  * **PostgreSQL 16** via `pg` driver (Docker or cloud-hosted), OR
  * **Embedded PGlite** (WASM-based local PostgreSQL without any daemon dependencies).
* **AI & Voice**: Official `sarvamai` SDK for Saaras STT, Sarvam 105B LLM, and Bulbul TTS.
* **Payments**: Paytm Payment Links API (`paytmchecksum` HMAC-SHA256 signature verification).
* **Testing**: Vitest test runner (786+ tests, mocks for network/audio).

---

## 🌐 11 Indic Languages Support

Pari operates seamlessly across 11 Indian languages:
`hi-IN` (Hindi), `en-IN` (English), `bn-IN` (Bengali), `ta-IN` (Tamil), `te-IN` (Telugu), `kn-IN` (Kannada), `ml-IN` (Malayalam), `mr-IN` (Marathi), `gu-IN` (Gujarati), `pa-IN` (Punjabi), and `od-IN` (Odia).

* **Merchant Preference**: Stored in `merchants.language`. Read via `GET /api/me` and updated via `PATCH /api/me`. Defaults to `hi-IN` until selected.
* **Deterministic Line Tables**: Spoken responses are never hallucinated by LLMs. Every line is sourced from [`src/llm/lines/`](src/llm/lines/) with dedicated tables per language.
* **Voice Models & Speakers**:
  * `bulbul:v4-flash`: Hindi (`simran_enhi_customer`), English (`simran_en_customer`), Bengali (`roopa_bn_conversational`), Telugu (`kavitha_te_conversation`), Kannada (`chaitra_kn_conversation`), Marathi (`ishita_mr_conversational`), Gujarati (`pooja_gu_customer`).
  * `bulbul:v3`: Tamil, Malayalam, Punjabi, Odia (`simran`).
* **Vernacular Number Parsing**: Digit words and Indic numeral scripts across all 11 languages are parsed into standard digits.

To manually set the merchant's language via curl:
```bash
curl -X PATCH http://localhost:4000/api/me \
  -H "x-api-key: pari-dev-key" \
  -H "Content-Type: application/json" \
  -d '{"language":"ta-IN"}'
```

---

## 💾 Database Options

Pari provides flexible database support for local testing and production deployment:

### Option A: Zero-Setup Embedded PGlite (Default)
When `DATABASE_URL` is omitted or empty, Pari automatically boots an embedded WASM PostgreSQL database located at `.data/pglite`.
* Zero external daemons required.
* Automatically creates schema migrations and seeds data on startup.
* To completely reset database state, stop the server and delete `.data/pglite`:
  ```bash
  rm -rf .data/pglite
  ```

### Option B: Docker Compose PostgreSQL 16
To run a production-identical PostgreSQL database:
```bash
docker compose up -d
```
Set in `.env`:
```ini
DATABASE_URL=postgres://pari:pari@localhost:5432/pari
```

---

## 🚀 Quickstart & Configuration

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment (`.env`)
```bash
cp .env.example .env
```
Key configuration variables:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | HTTP server port | `4000` |
| `PARI_API_KEY` | Secret key required for `/api` requests | `pari-dev-key` |
| `SARVAM_API_KEY` | Sarvam AI API key | `sk_...` |
| `DATABASE_URL` | PostgreSQL connection string (leave blank for PGlite) | `postgres://pari:pari@localhost:5432/pari` |
| `PARI_DEMO_SEED` | Seed sample customers and multi-day ledger history | `true` |
| `PARI_PAYTM_MODE` | Payment mode (`mock` or `sandbox`) | `mock` |
| `PARI_TTS_PACE` | Speaking speed multiplier for Bulbul | `1.15` (0.5 to 2.0) |

### 3. Verify Sarvam AI Connection
```bash
npm run sarvam:hello
```
*Validates your `SARVAM_API_KEY` by sending a test ping to the Sarvam API.*

### 4. Start Development Server
```bash
npm run dev
```
*Starts Express on port 4000 using `tsx watch` for auto-reloading.*

---

## 🎙️ Hands-Free Terminal CLI

Pari includes a full ambient voice terminal that runs locally on your laptop microphone:

```bash
npm run pari
```

### How It Works:
1. **Room Noise Profiling**: Measures ambient room noise for 1 second upon boot to calibrate VAD energy thresholds.
2. **Ambient Voice Detection**: Streams speech audio directly without requiring a wake-word.
3. **Mute Mode**: Use `npm run pari -- --mute` to display text read-backs without synthesizing voice.

### Keyboard Shortcuts (Interactive Mode):

| Key | Action | Details |
| :---: | :--- | :--- |
| <kbd>Space</kbd> | **Push-to-Talk** | Tap to start recording, tap again to finish (Esc cancels). Ideal for noisy environments. |
| <kbd>E</kbd> | **Ledger Snapshot** | Prints a table of recent entries, pending balances, and status. |
| <kbd>L</kbd> | **Simulate Link Paid** | Triggers payment confirmation on the newest active Paytm link. |
| <kbd>Q</kbd> | **Simulate Counter QR** | Sends an unreferenced QR payment matching the latest pending entry. |

---

## 📖 API Reference

All `/api` endpoints (except the signature-verified Paytm webhook) require the `x-api-key: <PARI_API_KEY>` header (or `?key=` query parameter for SSE and audio streams).

### Conversational & Voice Endpoints
* **`POST /api/converse`**: Orchestrated multi-turn conversational turn.
  * *Request*: Multipart `audio` file (`audio/wav`, `audio/webm`, `audio/mp4`), OR JSON `{ "text": "...", "speak": true }`.
  * *Response*: `{ transcript, state, reply: { text, speech, language }, entry, link, timings }`.
* **`GET /api/converse/state`**: Inspects the current merchant conversation state.
* **`POST /api/converse/reset`**: Resets the active session back to `IDLE`.
* **`POST /api/voice/entry`**: Stateless single-shot extraction and read-back generation.
* **`GET /api/tts/stream?text=...&language=...`**: Streams chunked Bulbul audio with $<500\text{ms}$ time-to-first-byte.

### Merchant & Settings
* **`GET /api/me`**: Returns shop identity, name, UPI ID, QR payload, and current language.
* **`PATCH /api/me`**: Sets the merchant's spoken/display language (`{ "language": "hi-IN" }`).

### Ledger & Entries
* **`GET /api/entries`**: Lists entries with customer info, payment links, and matched payments. Query params: `status`, `customerId`, `limit`.
* **`GET /api/entries/:id`**: Retrieves full entry details.
* **`PATCH /api/entries/:id`**: Manually edits entry amounts or customer name.
* **`POST /api/entries/:id/confirm`**: Confirms (`"yes"`) or rejects (`"no"`) an unconfirmed entry.
* **`POST /api/entries/:id/collect`**: Dispatches a Paytm SMS payment link for the pending amount.

### Customers & Reconciliation
* **`GET /api/customers`**: Lists all customer records.
* **`GET /api/customers/:id/balance`**: Aggregate balance and list of open entries for a customer.
* **`GET /api/payments/suggestions`**: Returns outstanding QR payments requiring merchant confirmation, plus `asking`: the payment and entry Pari is asking about aloud, so the QR tab shows the same question.
* **`POST /api/payments/:id/match`**: Accepts (`{ entryId }`) or rejects (`{ reject: true }`) a QR candidate match.
* **`POST /api/payments/:id/decline`**: "No" to one candidate (`{ entryId }`), answered like the spoken "nahi": neither the QR tab nor Pari offers that entry for the payment again, and the payment is kept aside once none are left.

### Real-Time Events (SSE)
* **`GET /api/events`**: Server-Sent Events stream:
  * `pari.ready`: Connected to stream.
  * `pari.entry.updated`: Ledger entry created, confirmed, or closed.
  * `pari.payment.received`: Payment link settled.
  * `pari.payment.suggested`: Shop QR payment landed with candidate match.
  * `pari.prompt`: Spoken prompt emitted by Pari.
  * `pari.announce`: Background audio announcement (e.g. soundbox settlement).

### System & Webhooks
* **`POST /api/paytm/callback`**: Public callback webhook from Paytm (verified with HMAC-SHA256 `CHECKSUMHASH`).
* **`GET /health`**: Returns health status of database, Sarvam AI configuration, and Paytm mode.

---

## 💳 Paytm Sandbox Setup (Optional)

To test with real Paytm sandbox credentials rather than simulated payments:

1. Obtain Test Merchant credentials from [Paytm Developer Dashboard](https://dashboard.paytm.com/).
2. Expose your local port 4000 via a tunnel:
   ```bash
   ngrok http 4000
   ```
3. Update `backend/.env`:
   ```ini
   PARI_PAYTM_MODE=sandbox
   PAYTM_MID=your_test_merchant_id
   PAYTM_MERCHANT_KEY=your_16_char_key
   PARI_PUBLIC_URL=https://your-ngrok-subdomain.ngrok-free.app
   ```
4. Links will be dispatched with `statusCallbackUrl=<PARI_PUBLIC_URL>/api/paytm/callback`. When paid with test Paytm cards or mock UPI, entries close in real time.

---

## 🧪 Testing & Quality

Pari features a comprehensive offline test suite with **zero external network dependency**:

```bash
# Run 786+ unit, integration, and E2E mock tests
npm test

# Type-check TypeScript sources
npm run typecheck

# Production build
npm run build
```

The test suite validates:
* Spoken vernacular number parsing and fractions (*dedh*, *dhai*, *saade*).
* Spoken 10-digit Indian mobile parsing across all 11 languages.
* Line table accuracy and completeness for every supported language.
* Strict accounting invariants ($Total = Paid + Pending$).
* Cash repayments paid at the counter, applied to oldest entries first.
* Spoken balance inquiries across single customers and shop totals.
* Per-merchant session locks and race-condition resistance.
* Reconciler exact and heuristic matching scoring.
* Full E2E flow from audio capture to database settlement.
