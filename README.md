<div align="center">

# 🧚‍♀️ Pari (परी)
### Ambient Voice-First Udhar Ledger & Automated Paytm Settlement for Indian Kirana Stores

*Bridging vernacular shopkeeper speech and digital commerce with zero-hallucination accounting, 11 Indian languages, cash repayments, and proactive UPI reconciliation.*

<br/>

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-black?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2058-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.88-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![Sarvam AI](https://img.shields.io/badge/AI-Sarvam%20Cloud-6C47FF?style=for-the-badge)](https://sarvam.ai/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20PGlite-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://github.com/electric-sql/pglite)
[![Paytm](https://img.shields.io/badge/Payments-Paytm%20Payment%20Links-00b9f5?style=for-the-badge)](https://developer.paytm.com/)
[![Tests](https://img.shields.io/badge/Tests-786%20Passed-brightgreen?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)

<br/>

[Executive Summary](#1-executive-summary) • [Architecture](#2-system-architecture) • [Voice & Guardrails](#3-technical-highlights) • [11 Indian Languages](#4-eleven-indian-languages) • [State Machine](#5-conversation-state-machine) • [Reconciliation](#6-dual-channel-reconciliation-engine) • [API Reference](#7-api-specification) • [Quickstart](#8-getting-started) • [Mobile App & Demo](#9-mobile-app--demo-walkthrough)

---

</div>

## 1. Executive Summary

In India's retail ecosystem, hundreds of millions of daily transactions across neighbourhood **kirana** (mom-and-pop grocery) stores operate on **udhar** (informal customer credit). Traditionally, merchants track this credit on dog-eared paper notebooks (*bahi-khata*) or struggle with bookkeeping mobile apps that demand tedious manual typing while managing a crowded, noisy counter.

**Pari (परी)** is an ambient, voice-first intelligent financial assistant that turns natural shopkeeper speech into verified ledger entries, cash repayments, and automated payment recovery:

1. **Speak Naturally**: The merchant selects one of **11 Indian languages** once, then speaks shop vernacular mixed with English (*"Gupta ji ne 350 ka samaan liya, 200 UPI diya, 150 baaki"*).
2. **Deterministic Extraction & Guardrails**: Pari extracts financial entities via Sarvam AI, enforces strict mathematical invariants ($Total = Paid + Pending$), and verifies extracted numbers against the raw transcript before reading back a spoken confirmation.
3. **Automated Paytm Payment Links**: Once confirmed, Pari offers to dispatch an SMS payment link via Paytm for the pending amount.
4. **Intelligent Dual-Channel Settlement & Cash Repayments**: The ledger automatically settles when the customer pays via the SMS link, or proactively alerts the merchant when a matching payment hits the shop's counter QR code (*"₹150 aaya, Gupta ji ka?"*). Cash paid back at the counter is simply spoken aloud (*"Gupta ji ne 100 diye"*), and Pari can instantly answer what anyone owes (*"Gupta ji ka kitna baaki hai?"* or *"kul kitna udhaar hai?"*).

---

## 2. System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer["📱 Client Layer"]
        Mobile["Pyari Pari Mobile App<br/>(Expo SDK 58 / React Native 0.88 / Skia Shaders)"]
        CLI["Hands-Free Pari CLI<br/>(Sox Hardware Capture / Ambient VAD / PTT)"]
    end

    subgraph APILayer["⚡ Express 5 + TypeScript Backend"]
        Auth["Auth & Security Gate<br/>(x-api-key / Rate Limiting / Helmet)"]
        Router["API Router<br/>(/converse, /entries, /payments, /events)"]
        Engine["ConversationEngine<br/>(Per-Merchant Mutex Lock & State Machine)"]
        Bus["In-Process EventBus<br/>(Pub/Sub -> Server-Sent Events SSE)"]
    end

    subgraph AIEngine["🧠 Sarvam AI Indic Intelligence Pipeline"]
        STT["Speech-to-Text: saaras:v4<br/>(Code-mixed Indic STT + Merchant Language)"]
        LLM["Extraction: sarvam-105b-conversations<br/>(105B MoE Model with Strict Multi-Event JSON Schema)"]
        TTS["Text-to-Speech: bulbul:v4-flash / v3<br/>(Language-Specific Female Persona, Cached Streaming)"]
    end

    subgraph Guardrails["🛡️ Deterministic Financial Core"]
        NumParser["Vernacular Number & Fraction Parser<br/>(Sau, Hazaar, Dedh, Dhai, Indian Digits)"]
        InvariantCheck["Accounting Invariant Engine<br/>(Total = Paid + Pending Verification)"]
        LineTables["Deterministic Line Tables<br/>(Typed Screen & Spoken Prompts per Language)"]
    end

    subgraph LedgerLayer["💾 Ledger & Storage Engine"]
        Collect["CollectService<br/>(Paytm Link Dispatch & SMS Delivery)"]
        Reconciler["Reconciler Engine<br/>(Exact Order ID Match & QR Heuristic Scoring)"]
        DB[(Kysely ORM<br/>PostgreSQL 16 / Embedded PGlite)]
    end

    subgraph External["🌐 External Payment Gateways"]
        PaytmAPI["Paytm Payment Links API<br/>(Production Sandbox / Mock Simulator)"]
        PaytmWebhook["Paytm Callback Webhook<br/>(HMAC-SHA256 Checksum Signature Verification)"]
    end

    Mobile -->|Audio / REST / SSE| Auth
    CLI -->|Multipart Audio / SSE| Auth
    Auth --> Router
    Router --> Engine

    Engine -->|Spoken Audio Chunk| STT
    STT -->|Raw Transcript| Engine
    Engine -->|Transcript + Known Customers| LLM
    LLM -->|Raw Extracted JSON Schema| Guardrails
    Guardrails -->|Verified Financial Entry / Repayment| Engine

    Engine --> DB
    Engine -->|Pre-composed Speech Text| TTS
    TTS -->|WAV Audio Stream / Base64| Engine
    Engine --> Bus
    Bus -->|Real-Time SSE Events| Mobile
    Bus -->|Real-Time SSE Events| CLI

    Engine --> Collect
    Collect --> PaytmAPI
    PaytmWebhook -->|Transaction Callback| Reconciler
    Reconciler --> DB
    Reconciler --> Bus
```

---

## 3. Technical Highlights

### A. Ambient Voice & Indic LLM Pipeline (Sarvam AI)
* **Speech-to-Text (`saaras:v4`)**:
  * Operates in `codemix` mode configured with the merchant's chosen language code (e.g. `hi-IN`, `ta-IN`), ensuring accurate transcription even for one-word answers like *"haan"*.
  * Given no keyterms by default. In live tests, `"Pari"` as a keyterm made Saaras write *"Verma ji"* and *"dedh sau"* as "Pari", and a list of customer names caused it to substitute existing names for new customers.
* **Large Language Model (`sarvam-105b-conversations`)**:
  * A **105-Billion parameter Mixture-of-Experts (MoE)** foundation model built specifically for Indian languages.
  * Running at temperature `0.1` with strict multi-event JSON schema enforcement.
  * Understands Indian colloquial honorifics (*ji*, *bhai*, *didi*, *anna*, *garu*), idioms, code-mixed vernacular expressions, and multi-sentence utterances (*"Gupta ji ne 100 diye aur Verma ji ne 200 ka samaan liya"*).
* **Text-to-Speech (Bulbul)**:
  * Employs authentic female personas across all 11 languages (operating at a crisp `1.15x` pace).
  * **Two-Tier Latency Optimization**: Pre-synthesized LRU in-memory audio caching for static readbacks (*"Save ho gaya"*, *"Theek hai, number dobara boliye"*) and chunked HTTP streaming for $<500\text{ms}$ time-to-first-audio.

### B. Zero-Hallucination Deterministic Financial Core
Financial records demand mathematical precision. Pari enforces a complete boundary between **probabilistic speech extraction** and **deterministic financial execution**:

1. **Extraction Separation**: The LLM maps raw phrases to structured multi-event JSON schema, including entries, repayments, and balance queries:
   ```json
   {
     "intent": "record",
     "events": [
       {
         "type": "entry",
         "customerName": "Gupta ji",
         "totalRupees": 350,
         "paidRupees": 200,
         "pendingRupees": 150,
         "items": null
       },
       {
         "type": "repayment",
         "customerName": "Verma ji",
         "amountRupees": 100,
         "full": false
       }
     ],
     "balanceOf": null
   }
   ```
2. **Vernacular Number & Fraction Parser (`numbers.ts`)**:
   * Evaluates vernacular counting words and fraction multipliers:
     * *sau* ($100$), *hazaar* ($1,000$), *lakh* ($100,000$).
     * *dedh* ($1.5\times$), *dhai* ($2.5\times$), *saade* ($+0.5$), *sava* ($+0.25$), *paune* ($-0.25$).
     * e.g., *"saade teen sau"* $\rightarrow 350$, *"dedh sau"* $\rightarrow 150$.
   * Parses spoken 10-digit Indian mobile numbers (Devanagari, Tamil, Bengali, Telugu, and other Indic script digits, digit words across all 11 languages, and colloquial repeats like *"double nine"*).
3. **Formal Invariant Verification & Corrections**:
   * Automatically derives single missing values ($Total = Paid + Pending$).
   * Formally checks with `checkAmountsAgainstTranscript()` that every non-zero quantity was explicitly spoken in the audio or derived mathematically. Unverified entries are tagged with `needsReview: true`.
   * Accepts voice corrections at the readback stage (e.g. *"Nahi, 250 diye"* or *"Haan, lekin 250 diye"*).
4. **Pre-composed Line Tables (`lines/`)**:
   * LLMs are never permitted to construct spoken read-back sentences. All response strings are sourced directly from typed language tables with amounts and names interpolated safely.

---

## 4. Eleven Indian Languages

Pari provides end-to-end voice and text support across all 11 Indian languages supported by Sarvam Bulbul:

| Language | Script | STT Code | TTS Model | Voice Persona | Interface Display |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hindi** | हिन्दी | `hi-IN` | `bulbul:v4-flash` | `simran_enhi_customer` | Hinglish & Devanagari |
| **English** | English | `en-IN` | `bulbul:v4-flash` | `simran_en_customer` | Latin / Indian English |
| **Bengali** | বাংলা | `bn-IN` | `bulbul:v4-flash` | `roopa_bn_conversational` | Bengali Script |
| **Tamil** | தமிழ் | `ta-IN` | `bulbul:v3` | `simran` | Tamil Script |
| **Telugu** | తెలుగు | `te-IN` | `bulbul:v4-flash` | `kavitha_te_conversation` | Telugu Script |
| **Kannada** | ಕನ್ನಡ | `kn-IN` | `bulbul:v4-flash` | `chaitra_kn_conversation` | Kannada Script |
| **Malayalam** | മലയാളം | `ml-IN` | `bulbul:v3` | `simran` | Malayalam Script |
| **Marathi** | मराठी | `mr-IN` | `bulbul:v4-flash` | `ishita_mr_conversational` | Devanagari Script |
| **Gujarati** | ગુજરાતી | `gu-IN` | `bulbul:v4-flash` | `pooja_gu_customer` | Gujarati Script |
| **Punjabi** | ਪੰਜਾਬੀ | `pa-IN` | `bulbul:v3` | `simran` | Gurmukhi Script |
| **Odia** | ଓଡ଼ିଆ | `od-IN` | `bulbul:v3` | `simran` | Odia Script |

> [!NOTE]
> Language preference is persisted per merchant on `merchants.language` via `PATCH /api/me`. If unselected, Pari defaults to Hindi. Spoken numbers are understood across all 11 languages; amount words in non-Hindi/English languages are flagged for merchant confirmation.

---

## 5. Conversation State Machine

Every merchant session is protected by a serialized mutex lock preventing race conditions during rapid audio inputs.

```mermaid
stateDiagram-v2
    [*] --> IDLE

    IDLE --> AWAITING_CUSTOMER_CHOICE: Name ambiguity ("Gupta didi" for Gupta ji)
    AWAITING_CUSTOMER_CHOICE --> AWAITING_ENTRY_CONFIRM: Same person ("Haan") or a new khaata ("Nahi")

    IDLE --> AWAITING_ENTRY_CONFIRM: Merchant utters udhar entry
    AWAITING_ENTRY_CONFIRM --> AWAITING_ENTRY_CONFIRM: Merchant corrects amounts ("Nahi, 250 diye" or "Haan, lekin 250 diye")
    AWAITING_ENTRY_CONFIRM --> AWAITING_ENTRY_CONFIRM: Someone else's entry queued; this one asked again
    AWAITING_ENTRY_CONFIRM --> IDLE: Merchant rejects ("Nahi / Galat")
    AWAITING_ENTRY_CONFIRM --> IDLE: Confirmed & Fully Paid (Pending = 0)
    AWAITING_ENTRY_CONFIRM --> AWAITING_COLLECT_CHOICE: Confirmed & Pending > 0 ("Save karoon? -> Haan")

    IDLE --> IDLE: Balance question answered ("Gupta ji ka kitna baaki hai?")
    IDLE --> AWAITING_NAME: Missing customer name ("200 ka saamaan diya")
    IDLE --> AWAITING_AMOUNT: Missing amount ("Gupta ji ne paise diye")
    AWAITING_NAME --> AWAITING_ENTRY_CONFIRM: Name supplied ("Verma ji")
    AWAITING_AMOUNT --> AWAITING_PAYMENT_CONFIRM: Amount supplied ("Dedh sau")

    IDLE --> AWAITING_PAYMENT_CONFIRM: Cash repaid at counter ("Gupta ji ne 100 diye")
    AWAITING_PAYMENT_CONFIRM --> IDLE: Confirmed ("Haan") -> Applied to oldest open entries
    AWAITING_PAYMENT_CONFIRM --> AWAITING_PAYMENT_CONFIRM: Corrected ("Nahi, 150 diye")
    AWAITING_PAYMENT_CONFIRM --> IDLE: Rejected ("Nahi") -> Nothing recorded

    AWAITING_COLLECT_CHOICE --> IDLE: Declines payment link ("Nahi")
    AWAITING_COLLECT_CHOICE --> IDLE: Accepts & phone already saved (Link dispatched)
    AWAITING_COLLECT_CHOICE --> AWAITING_PHONE_CONFIRM: Accepts & speaks phone number directly
    AWAITING_COLLECT_CHOICE --> AWAITING_PHONE: Accepts but customer phone unknown

    AWAITING_PHONE --> AWAITING_PHONE_CONFIRM: Valid 10-digit mobile spoken
    AWAITING_PHONE --> AWAITING_PHONE: Invalid phone (Re-prompts merchant)
    AWAITING_PHONE --> IDLE: Declines phone entry ("Nahi / Rehne do")

    AWAITING_PHONE_CONFIRM --> IDLE: Confirmed ("Haan") -> Paytm Link Sent via SMS
    AWAITING_PHONE_CONFIRM --> AWAITING_PHONE: Rejected ("Nahi") -> Re-prompt number

    IDLE --> AWAITING_QR_MATCH: Shop QR payment received with multiple candidates
    AWAITING_QR_MATCH --> IDLE: Merchant confirms candidate ("Haan, Gupta ji ka")
    AWAITING_QR_MATCH --> AWAITING_QR_MATCH: Rejects candidate ("Nahi") -> Checks next candidate
    AWAITING_QR_MATCH --> IDLE: All candidates rejected -> Set aside as UNMATCHED
```

---

## 6. Dual-Channel Reconciliation Engine

Pari closes the cash flow loop across distinct real-world payment channels:

```mermaid
flowchart LR
    subgraph Sources["Payment Channels"]
        PL["Paytm Payment Link (SMS)"]
        QR["Shop Counter QR / Soundbox"]
        Cash["Direct Counter Cash Repayment"]
    end

    subgraph ReconcilerLogic["Reconciliation Engine"]
        Exact["Exact Reference Lookup<br/>(order_id / link_id)"]
        Scorer["Fuzzy Candidate Heuristic<br/>(Score >= 40)"]
        CashMatcher["Oldest-Entry Cash Matcher<br/>(Calculates Remaining Baaki / Change)"]
    end

    subgraph Actions["Ledger Resolution"]
        AutoClose["Auto-Close Entry<br/>Spoken: 'Gupta ji ne ₹150 de diye. Khaata band.'"]
        ProactiveAsk["Proactive Ambient Prompt<br/>Spoken: '₹150 aaya, Gupta ji ka?'"]
        CashReceipt["Cash Balance Update<br/>Spoken: '₹100 mile, ab ₹200 bachega'"]
    end

    PL --> Exact --> AutoClose
    QR --> Scorer --> ProactiveAsk
    Cash --> CashMatcher --> CashReceipt
```

### 1. Exact Link Settlement
* Customer taps and pays the SMS link.
* Paytm dispatches a webhook to `POST /api/paytm/callback` signed with `CHECKSUMHASH` (HMAC-SHA256).
* Exact match against `order_id` in a database transaction; automatically marks the entry `CLOSED` and broadcasts an announcement over SSE and Bulbul TTS: *"Gupta ji ne ₹150 de diye. Khaata band."*

### 2. Heuristic QR Candidate Matching
* Counter QR payments from physical soundboxes lack ledger reference IDs.
* When a payment lands, Pari ranks potential matching entries using a multi-factor score:
  $$\text{Score} = S_{\text{amount}} + S_{\text{name}} + S_{\text{recency}}$$
  * **Amount Match ($S_{\text{amount}}$)**: $+100$ for exact pending match, $+40$ for partial payment, $+20$ for overpayment.
  * **Payer Name Similarity ($S_{\text{name}}$)**: Up to $+60$ based on Jaro-Winkler string distance against known customer records.
  * **Recency Decay ($S_{\text{recency}}$)**: Up to $+10$ decaying over a 30-day window.
* Candidates scoring $\ge 40$ prompt an ambient readback: *"₹150 aaya, Gupta ji ka?"*. A simple *"Haan"* settles the account.

### 3. Direct Cash Repayments & Balance Inquiries
* Customer pays cash at the counter: *"Gupta ji ne 100 rupaye diye"*.
* Pari computes their outstanding debt, pays off open entries starting from the oldest, and reads back the new balance: *"Gupta ji se ₹100 mile. ₹300 baaki tha, ab ₹200 bachega. Save karoon?"*
* If the customer pays more than owed, Pari closes the debt and tells the merchant how much change to return.
* Any inquiry like *"Gupta ji ka kitna baaki hai?"* or *"kul kitna udhaar hai?"* receives an immediate spoken calculation.

---

## 7. API Specification

All `/api` endpoints (except the signature-verified Paytm webhook) require the `x-api-key: <PARI_API_KEY>` header (or `?key=` query parameter for SSE and audio streams).

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/converse` | Orchestrated conversational turn. Accepts multipart audio or JSON `{ text, speak }`. Returns transcript, state, reply text, base64 audio, and timing metrics. |
| `GET` | `/api/converse/state` | Retrieves the active session state for the merchant. |
| `POST` | `/api/converse/reset` | Resets the active conversation state machine to `IDLE`. |
| `GET` | `/api/events` | Server-Sent Events (SSE) stream for real-time notifications (`entry.updated`, `payment.received`, `pari.prompt`, `pari.announce`). |
| `POST` | `/api/voice/entry` | Stateless single-shot audio/text entry extraction and readback. |
| `GET` | `/api/me` | Returns shop identity, UPI ID, QR payload, and selected language. |
| `PATCH` | `/api/me` | Updates Pari's language: `{ "language": "ta-IN" }` (one of the 11 codes). |
| `GET` | `/api/entries` | Lists ledger entries with status and customer filters, each with links and payment records. |
| `PATCH` | `/api/entries/:id` | Corrects an entry's amounts or customer name. |
| `POST` | `/api/entries/:id/confirm` | Confirms (`"yes"`) or rejects (`"no"`) an entry via JSON or spoken audio. |
| `POST` | `/api/entries/:id/collect` | Dispatches a Paytm payment link to the customer's mobile number. |
| `GET` | `/api/customers/:id/balance` | Returns aggregate pending balance and list of open entries. |
| `GET` | `/api/payments/suggestions` | Retrieves outstanding QR payments awaiting merchant confirmation. |
| `POST` | `/api/payments/:id/match` | Matches or rejects a suggested payment against an entry. |
| `GET` | `/api/tts/stream` | Low-latency chunked audio streaming of Bulbul WAV synthesis in the chosen language. |
| `POST` | `/api/paytm/callback` | Paytm status callback (checksum verified, public webhook). |
| `GET` | `/health` | Healthcheck reporting database status, Paytm mode, and Sarvam connectivity. |

---

## 8. Getting Started

### Prerequisites
* **Node.js**: `v20.12+` (v22+ recommended).
* **Audio Tools** (optional, for Linux/macOS terminal mic): `sox libsox-fmt-pulse` (Linux) or `brew install sox` (macOS).
* **Sarvam AI API Key**: Obtain a key from [Sarvam AI Indus](https://indus.sarvam.ai).

### 1. Clone & Install Backend
```bash
git clone https://github.com/mahreenaisha/pari.git
cd pari/backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
Edit `backend/.env` and insert your credentials:
```ini
PORT=4000
PARI_API_KEY=pari-dev-key
SARVAM_API_KEY=sk_your_sarvam_key_here
DATABASE_URL=postgres://pari:pari@localhost:5432/pari   # Optional: leave blank for zero-setup PGlite
PARI_DEMO_SEED=true                                    # Seeds Sharma General Store with sample ledger history
```

### 3. Database Options

> [!TIP]
> **Zero-Dependency Mode (PGlite)**: If `DATABASE_URL` is left empty, Pari automatically runs an embedded WASM PostgreSQL instance inside `.data/pglite`. No Docker or local Postgres installation required!

**To use Docker PostgreSQL instead:**
```bash
docker compose up -d
```

### 4. Verify AI Connectivity & Run Backend
```bash
npm run sarvam:hello   # Tests chat connectivity with Sarvam AI
npm run dev            # Starts the Express 5 server with live-reloading on port 4000
```

### 5. Running the Hands-Free Terminal CLI
```bash
npm run pari           # Boots the ambient voice terminal listening on your system microphone
```

---

## 9. Mobile App & Demo Walkthrough

The mobile app in [`frontend/`](frontend) is built with **Expo SDK 58** and **React Native 0.88**. It provides a reactive UI featuring an animated Skia sky orb, push-to-talk voice recording, ledger views, cash repayment indicators, and shop QR simulation.

```mermaid
graph LR
    subgraph MobileFeatures["📱 Pyari Pari App Features"]
        Orb["🌤️ Sky Orb<br/>(Skia Shader / Push-to-Talk)"]
        Ledger["📖 Ledger<br/>(Daily Groups / Cash & Link Badges)"]
        QR["📷 Shop QR<br/>(Dynamic UPI QR / Settlement)"]
        Lang["🌐 Language<br/>(11 Native Scripts)"]
    end
```

### Running on Android Device (via USB Debugging)
```bash
# 1. Forward backend and Metro ports to the device
adb reverse tcp:4000 tcp:4000
adb reverse tcp:8081 tcp:8081

# 2. Configure frontend environment
cd frontend
cp .env.example .env.local
# Set:
# EXPO_PUBLIC_API_URL=http://localhost:4000
# EXPO_PUBLIC_API_KEY=pari-dev-key
# EXPO_PUBLIC_DEMO_TOOLS=true

# 3. Build and launch on your phone
npx expo run:android
```

> [!IMPORTANT]
> The app requires native microphone recording (`expo-audio`) and cleartext HTTP access (`http://localhost:4000`). Both are pre-configured in `frontend/android/app/src/main/AndroidManifest.xml` and `app.json`.

### 4-Minute Demo Script

> **Language**: Hindi (tap **हिन्दी** on initial launch or use the language chip).

1. **Speak Entry**: Tap the Sky Orb and say:
   > *"Gupta ji ne 350 ka samaan liya, 200 UPI diya, 150 baaki."*
2. **Review & Confirm**: Pari extracts the numbers and speaks:
   > *"Gupta ji, total ₹350, ₹200 mile, ₹150 baaki. Save karoon?"*
   * Answer **"Haan"** (or say *"Nahi, 250 diye"* to test correction guardrails).
3. **Payment Link Dispatch**: Pari responds:
   > *"Save ho gaya. ₹150 ka payment link bhejun?"*
   * Answer **"Haan"**, then speak the mobile number: *"98765 43210"*.
   * Pari confirms: *"98765 43210. Sahi hai?"* $\rightarrow$ say **"Haan"**. Paytm link is dispatched via SMS.
4. **Simulate Link Payment**: In the **Ledger** tab, locate Gupta ji's entry marked **"Link sent"**. Long-press the row:
   * Pari announces: *"Gupta ji ne ₹150 de diye. Khaata band."* The row status transitions to **"Closed"**.
5. **Simulate QR Payment**: Speak a new entry (*"Verma ji ne 500 ka samaan liya, 300 diye"*), confirm it, and decline the link (*"Abhi nahi"*).
   * Open the **QR** tab and long-press the QR code.
   * Pari proactively announces: *"₹200 aaya, Verma ji ka?"*. Tap or say **"Haan"** to immediately settle and close the entry!
6. **Cash Repayments & Balances**:
   * Say: *"Verma ji ko 300 udhaar likh do"*, answer "Haan", then "Abhi nahi".
   * Say: *"Verma ji ne 100 diye"*. Pari reads back: *"Verma ji se ₹100 mile. ₹300 baaki tha, ab ₹200 bachega. Save karoon?"* Answer "Haan".
   * Ask: *"Verma ji ka kitna baaki hai?"* $\rightarrow$ Pari answers: *"Verma ji ka ₹200 baaki hai."*
7. **Guardrails & Disambiguation**:
   * Try saying *"Gupta didi ne 200 ka samaan liya"* $\rightarrow$ Pari asks if Gupta didi and Gupta ji are the same person.
   * Try missing pieces (*"200 ka samaan diya"*) $\rightarrow$ Pari asks whose khaata it belongs to before saving.
8. **Finish on the Ledger**: Review "To collect", "Collected today", and closed entries.

---

## 10. Testing & Verification

The test suite covers the entire pipeline across 786+ tests with **zero external network dependency**:

```bash
# Run Vitest test suite (number parsing, line tables, state machines, cash repayments, reconciler, API)
cd backend && npm test

# Type-check TypeScript sources
npm run typecheck

# Validate frontend TypeScript routes & components
cd ../frontend && npm run typecheck
```

---

## 11. Monorepo Structure

```
pyari-pari/
├── README.md                           # Main architectural & project documentation
├── backend/                            # Express 5 + TypeScript API & CLI
│   ├── src/
│   │   ├── server.ts                   # Server entrypoint & HTTP bootstrap
│   │   ├── app.ts                      # Express routing & middleware
│   │   ├── config/                     # Environment schema validation (Zod)
│   │   ├── contracts/                  # Shared API contracts & TypeScript types
│   │   ├── conversation/               # Per-merchant state machine & session manager
│   │   ├── db/                         # Kysely ORM, PGlite dialect, SQL migrations, seeds
│   │   ├── events/                     # In-process pub/sub event bus (SSE)
│   │   ├── ledger/                     # Ledger repository, state transitions, reconciler
│   │   ├── llm/                        # Sarvam 105B extraction, vernacular numbers parser
│   │   │   └── lines/                  # Pre-composed spoken line tables (11 languages)
│   │   ├── paytm/                      # Paytm links client (Mock & Sandbox) & HMAC verification
│   │   ├── stt/                        # Sarvam Saaras v4 STT integration
│   │   ├── tts/                        # Sarvam Bulbul TTS streaming & LRU caching
│   │   └── cli/                        # Hands-free terminal audio client (Sox / VAD)
│   ├── docker-compose.yml              # Local PostgreSQL 16 container definition
│   └── tests/                          # 786+ Vitest unit, state machine, and E2E tests
└── frontend/                           # Expo SDK 58 / React Native 0.88 Mobile App
    ├── app.json                        # Expo application config & native build plugins
    └── src/
        ├── app/                        # Expo Router file-based screens (_layout, (tabs), language)
        ├── features/                   # Screen-specific modules (listening, ledger, qr)
        ├── components/                 # Shared UI (Skia sky orb, tab bar, status chips)
        ├── i18n/                       # 11 Indic language string tables & translation hooks
        ├── services/                   # REST API client, SSE subscriber, audio streaming
        ├── theme/                      # Typography, color palettes, spacing
        └── types/                      # Domain interfaces (paise-denominated financial models)
```

---

## 12. License & Acknowledgements

Developed with pride for the empowerment of India's retail backbone. Built with [Express](https://expressjs.com), [Expo](https://expo.dev), [Sarvam AI](https://sarvam.ai), [Kysely](https://kysely.dev), and [Paytm](https://developer.paytm.com).
