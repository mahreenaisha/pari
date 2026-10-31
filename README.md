# Pari (परी)
### Voice-First Udhar Ledger & Automated Paytm Settlement for Indian Kirana Merchants

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-orange.svg)](https://expressjs.com/)
[![LLM](https://img.shields.io/badge/LLM-Sarvam--105B--Conversations-purple.svg)](https://sarvam.ai/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20PGlite-blue.svg)](https://github.com/electric-sql/pglite)
[![Paytm](https://img.shields.io/badge/Payments-Paytm%20Payment%20Links-00b9f5.svg)](https://developer.paytm.com/)

---

## 1. Executive Summary

In India's retail ecosystem, hundreds of millions of daily transactions across *kirana* (mom-and-pop grocery) stores operate on **udhar** (informal shop credit). Merchants traditionally track this on paper (*bahi-khata*) or via accounting apps that demand tedious manual typing while serving a crowded counter.

**Pari** is an ambient, voice-first intelligent ledger that bridges vernacular speech and digital commerce:
1. **Speak Naturally**: The merchant picks one of 11 Indian languages once, then speaks it the way shops do, mixed with English (e.g., in Hindi, *"Gupta ji ne 350 ka samaan liya, 200 UPI diya, 150 baaki"*).
2. **Deterministic Extraction & Read-Back**: Pari extracts the entities, enforces strict accounting invariants, and verifies the numbers against the spoken audio before reading back a confirmation prompt.
3. **Automated Paytm Collection**: Once confirmed, Pari dispatches an SMS payment link via Paytm for the pending amount.
4. **Intelligent Reconciliation**: The ledger automatically settles when the customer pays the link, or proactively alerts the merchant when a matching payment hits the shop's physical QR counter (*"₹150 aaya, Gupta ji ka?"*). Cash paid back at the counter is simply told to Pari (*"Gupta ji ne 100 diye"*), and she answers what anyone owes (*"Gupta ji ka kitna baaki hai?"*).

---

## 2. System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer["Client Layer (Hands-Free or Web)"]
        CLI["pari CLI Terminal<br/>(Sox capture, VAD, PTT)"]
        WebUI["Web / Mobile App<br/>(AudioRecorder / SSE)"]
    end

    subgraph APILayer["Express 5 + TypeScript Backend"]
        Auth["Auth & Rate Limiting<br/>(x-api-key)"]
        Router["API Router<br/>(/converse, /entries, /payments)"]
        Engine["ConversationEngine<br/>(Per-Merchant State Machine & Concurrency Lock)"]
        Bus["In-Process EventBus<br/>(Pub/Sub -> SSE Stream)"]
    end

    subgraph AIEngine["Voice & Generative AI Pipeline (Sarvam AI Cloud)"]
        STT["Speech-to-Text<br/>(saaras:v4, codemix, merchant's language)"]
        LLM["LLM Extraction<br/>(sarvam-105b-conversations)"]
        TTS["Text-to-Speech<br/>(Bulbul voice per language, cached streaming)"]
    end

    subgraph Guardrails["Deterministic Financial Core"]
        NumParser["Number Parser<br/>(Hindi words and fractions, digits in any Indian script)"]
        InvariantCheck["Accounting Invariant Engine<br/>(Total = Paid + Pending)"]
        Templates["Line Tables, One per Language<br/>(No hallucinated speech)"]
    end

    subgraph LedgerReconciliation["Ledger & Settlement Engine"]
        Collect["CollectService<br/>(Paytm Link dispatch)"]
        Reconciler["Reconciler<br/>(Link exact match & QR fuzzy scoring)"]
        DB[(Kysely ORM on Postgres / PGlite<br/>Entries, Customers, Links, Audit)]
    end

    subgraph External["External Gateways"]
        PaytmAPI["Paytm Payment Links API<br/>(Sandbox / Mock)"]
        PaytmWebhook["Paytm Callback Webhook<br/>(HMAC-SHA256 signature)"]
    end

    CLI -->|Multipart Audio / SSE| Auth
    WebUI -->|REST / SSE| Auth
    Auth --> Router
    Router --> Engine

    Engine -->|Audio clip| STT
    STT -->|Transcript| Engine
    Engine -->|Transcript + Known Customers| LLM
    LLM -->|Raw JSON Schema| Guardrails
    Guardrails -->|Validated Entry| Engine

    Engine --> DB
    Engine -->|Readback Text| TTS
    TTS -->|WAV Audio| Engine
    Engine --> Bus
    Bus -->|SSE Events| CLI

    Engine --> Collect
    Collect --> PaytmAPI
    PaytmWebhook -->|Transaction Callback| Reconciler
    Reconciler --> DB
    Reconciler --> Bus
```

---

## 3. Technical Highlights

### A. The Voice & LLM Stack (Sarvam AI)
* **Speech-to-Text (`saaras:v4`)**:
  * Runs in `codemix` mode and is told the merchant's language (e.g. `ta-IN`), because one-word answers like *"haan"* are too short to detect a language from.
  * Given `"Pari"` as a keyterm. Customer names are not: in live tests a list of them made Saaras write one customer's name for another, which is harder to catch than a misheard name.
* **Large Language Model (`sarvam-105b-conversations`)**:
  * A **105-billion parameter Mixture-of-Experts (MoE)** foundation model hosted on Sarvam Cloud.
  * Configured with temperature `0.1`, JSON object schema enforcement, and optional reasoning effort control.
  * Specializes in Indian dialectal nuances, honorifics (*ji*, *bhai*, *didi*, *anna*, *garu*), and colloquial phrasing.
* **Text-to-Speech (Bulbul)**:
  * One female voice per language (see [Eleven Languages](#c-eleven-languages)), operating at `1.15x` pace.
  * Features a **two-tier optimization**: in-memory LRU caching of pre-synthesized audio for recurring phrases (*"Save ho gaya"*, *"Theek hai, number dobara boliye"*), kept apart per language, and chunked HTTP streaming for sub-500ms time-to-first-audio.

### B. Zero-Hallucination Deterministic Financial Core
Financial records cannot rely on unconstrained generative output. Pari enforces strict separation between **entity extraction** and **financial execution**:

1. **Extraction Only**: The LLM is confined to mapping raw phrases to JSON schema. One sentence can hold several events, in the order said, and a question about what's owed comes back as `"intent": "balance"` with `balanceOf`:
   ```json
   {
     "intent": "record",
     "events": [
       { "type": "entry", "customerName": "Gupta ji", "totalRupees": 350, "paidRupees": 200, "pendingRupees": 150, "items": null },
       { "type": "repayment", "customerName": "Verma ji", "amountRupees": 100, "full": false }
     ],
     "balanceOf": null
   }
   ```
2. **Deterministic Number & Phone Parser (`numbers.ts`)**:
   * Evaluates vernacular counting and fraction multipliers:
     * *sau* ($100$), *hazaar* ($1,000$), *lakh* ($100,000$).
     * *dedh* ($1.5$), *dhai* ($2.5$), *saade* ($+0.5$), *sava* ($+0.25$), *paune* ($-0.25$).
     * e.g., *"saade teen sau"* $\rightarrow 350$, *"dedh sau"* $\rightarrow 150$.
   * Parses spoken 10-digit Indian mobile numbers (digits in any Indian script, digit words in all 11 languages, and repeats like *"double nine"*).
3. **Formal Accounting Invariants**:
   * Recomputes single missing fields ($Total = Paid + Pending$).
   * Formally verifies with [`checkAmountsAgainstTranscript`](backend/src/llm/numbers.ts) that every non-zero amount was explicitly uttered or directly derived. Flags unverified amounts with `needsReview: true`.
4. **Deterministic Spoken Outputs ([`lines/`](backend/src/llm/lines))**:
   * LLMs never construct the response audio text. Every line comes from the merchant's language table, with amounts, names and phone numbers filled in by code: a `text` for screens and a `speech` for Bulbul. Hindi shows Roman Hinglish and speaks Devanagari; the other languages use their own script for both, with the speech saying that language's word for rupees where the screen shows ₹.

### C. Eleven Languages
Pari works fully in the 11 languages Bulbul can speak: Hindi, English, Bengali, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Punjabi and Odia. The app asks for the language on first launch and saves it with `PATCH /api/me`; a chip on the Listen screen changes it later. Until one is picked, Pari uses Hindi.

* **Hearing**: Saaras is told the merchant's language. Each language has its own yes and no words, and Hindi and English ones count in all of them, so the app's buttons always send *"haan"* or *"nahi"*. Digits in any Indian script become 0–9, and a phone number read out digit by digit is understood in every language. Amount *words* are only parsed in Hindi and English, and Saaras usually spells amounts out in the other languages. The LLM still reads them, but Pari can't check them against the transcript, so she flags the entry and asks the merchant to listen carefully to the read-back.
* **Text**: Pari's lines live in [`backend/src/llm/lines/`](backend/src/llm/lines) and the app's text in [`frontend/src/i18n/strings/`](frontend/src/i18n/strings), one typed table per language, so a missing line fails the typecheck.
* **Voices** ([`backend/src/tts/voices.ts`](backend/src/tts/voices.ts)) are all female, so Pari sounds like one person. Bulbul v4 has no Malayalam or Odia voice and no female Tamil or clearly female Punjabi one, so those four use v3's general voice:

| Language | Model | Speaker |
| :--- | :--- | :--- |
| Hindi | `bulbul:v4-flash` | `simran_enhi_customer` |
| English | `bulbul:v4-flash` | `simran_en_customer` |
| Bengali | `bulbul:v4-flash` | `roopa_bn_conversational` |
| Telugu | `bulbul:v4-flash` | `kavitha_te_conversation` |
| Kannada | `bulbul:v4-flash` | `chaitra_kn_conversation` |
| Marathi | `bulbul:v4-flash` | `ishita_mr_conversational` |
| Gujarati | `bulbul:v4-flash` | `pooja_gu_customer` |
| Tamil, Malayalam, Odia, Punjabi | `bulbul:v3` | `simran` |

> **Before showing a language**, have a native speaker read its line table and app strings. The Hindi wording is the original; the other tables are new and haven't been reviewed by native speakers yet.

---

## 4. Conversation State Machine

Every merchant interaction is handled through a per-merchant serialized session lock preventing race conditions during rapid audio inputs.

```mermaid
stateDiagram-v2
    [*] --> IDLE

    IDLE --> AWAITING_CUSTOMER_CHOICE: Name only maybe fits a customer ("Gupta didi" for Gupta ji)
    AWAITING_CUSTOMER_CHOICE --> AWAITING_ENTRY_CONFIRM: Same person ("Haan") or a new khaata ("Nahi")
    IDLE --> AWAITING_ENTRY_CONFIRM: Merchant utters udhar entry
    AWAITING_ENTRY_CONFIRM --> AWAITING_ENTRY_CONFIRM: Merchant corrects amounts ("Nahi, 250 diye" or "Haan, lekin 250 diye")
    AWAITING_ENTRY_CONFIRM --> AWAITING_ENTRY_CONFIRM: Someone else's entry said -> queued, this one asked again
    AWAITING_ENTRY_CONFIRM --> IDLE: Merchant rejects ("Nahi / Galat")
    AWAITING_ENTRY_CONFIRM --> IDLE: Confirmed & Fully Paid (Pending = 0)
    AWAITING_ENTRY_CONFIRM --> AWAITING_COLLECT_CHOICE: Confirmed & Pending > 0 ("Save karoon? -> Haan")

    IDLE --> IDLE: Balance question answered ("Gupta ji ka kitna baaki hai?")
    IDLE --> AWAITING_NAME: No name said ("200 ka saamaan diya")
    IDLE --> AWAITING_AMOUNT: No amount said ("Gupta ji ne paise diye")
    AWAITING_NAME --> AWAITING_ENTRY_CONFIRM: Answer read with the first sentence ("Verma ji")
    AWAITING_AMOUNT --> AWAITING_PAYMENT_CONFIRM: Answer read with the first sentence ("Dedh sau")

    IDLE --> AWAITING_PAYMENT_CONFIRM: Cash paid back ("Gupta ji ne 100 diye")
    AWAITING_PAYMENT_CONFIRM --> AWAITING_PAYMENT_CONFIRM: Merchant corrects ("Nahi, 120 diye")
    AWAITING_PAYMENT_CONFIRM --> IDLE: Saved, oldest entries first ("Haan"), or dropped ("Nahi")
    AWAITING_PAYMENT_CONFIRM --> IDLE: Same money as a waiting QR payment -> QR matched, no cash recorded

    AWAITING_COLLECT_CHOICE --> IDLE: Declines payment link ("Nahi")
    AWAITING_COLLECT_CHOICE --> IDLE: Accepts & phone already on file (Link sent)
    AWAITING_COLLECT_CHOICE --> AWAITING_PHONE_CONFIRM: Accepts & speaks phone number directly
    AWAITING_COLLECT_CHOICE --> AWAITING_PHONE: Accepts but phone unknown

    AWAITING_PHONE --> AWAITING_PHONE_CONFIRM: Valid 10-digit mobile spoken
    AWAITING_PHONE --> AWAITING_PHONE: Invalid phone (Re-prompts)
    AWAITING_PHONE --> IDLE: Declines ("Nahi / Rehne do")

    AWAITING_PHONE_CONFIRM --> IDLE: Confirmed ("Haan") -> Paytm Link Sent via SMS
    AWAITING_PHONE_CONFIRM --> AWAITING_PHONE: Rejected ("Nahi") -> Re-prompt number

    IDLE --> AWAITING_QR_MATCH: Shop QR payment received with multiple candidates
    AWAITING_QR_MATCH --> IDLE: Merchant confirms candidate ("Haan, Gupta ji ka")
    AWAITING_QR_MATCH --> AWAITING_QR_MATCH: Rejects candidate ("Nahi") -> Next candidate
    AWAITING_QR_MATCH --> IDLE: All candidates rejected -> Set aside as UNMATCHED
```

Around the read-back:
* **Corrections**: a number that differs from the read-back corrects the entry even after *"haan"*, while *"haan, 350 sahi hai"* still saves. In the nine languages whose amount words Pari can't read, any words besides yes or no go to the LLM together with the entry being confirmed. A correction keeps what the merchant didn't change: *"250 diye"* keeps the ₹350 total. If the LLM can't place a new number, Pari says *"Kya badalna hai, samajh nahi aaya."* and reads back again, rather than saving or dropping on the yes or no.
* **Cash paid back**: *"Gupta ji ne 100 diye"* is read back with what was owed and what will be left (*"₹150 baaki tha, ab ₹50 bachega"*), and a yes records it as a `CASH` payment against the oldest open entries first. *"Poora"* with no amount means everything owed. More than is owed is capped: the khaata closes and Pari says how much to hand back. A payment link the cash paid off is expired, and Pari says to tell the customer not to pay it. A name with no khaata gets *"Mehta ji ka koi khaata nahi mila."*, and no customer is created.
* **Balances**: *"Gupta ji ka kitna baaki hai?"* or *"kul kitna udhaar hai?"* is answered from the ledger (*"Kul ₹350 baaki hai, 2 khaaton mein."*).
* **Missing pieces**: an entry or repayment without a name or an amount gets one question (*"Kiske naam likhoon?"*, *"Gupta ji, kitne rupaye?"*), and the answer goes to the LLM together with the first sentence. Pari asks only once.
* **One at a time**: someone else's entry or repayment said while one waits for a yes is queued, and read back once the current one is done (*"Ab agli entry."*). Several said in one breath (*"Gupta ji ne 100 diye aur Verma ji ne 200 ka saamaan liya"*) are read back the same way. A new entry said instead of answering the link, phone or QR question ends that question; the QR payment is asked about again afterwards.
* **Time out**: a session left alone for two minutes goes back to IDLE, and Pari's next reply says which entries weren't saved.
* **Names**: honorifics that say man or woman (*bhaiya*, *didi*, *anna*, *akka* and so on) are part of who a customer is, so Gupta bhaiya and Gupta didi are two khaatas. When only one of the two names says it (*Gupta didi* for *Gupta ji*), Pari asks whether they're the same person. A name that opens a new khaata is announced (*"Naya khaata."*), so a misheard name gets caught.

---

## 5. Dual-Channel Payment Reconciliation Engine

Pari automates cash flow reconciliation across two distinct payment modalities:

```mermaid
flowchart LR
    subgraph PaymentSources["Payment Gateways"]
        PL["Paytm Payment Link (SMS)"]
        QR["Shop Counter QR / UPI"]
    end

    subgraph ReconcilerLogic["Reconciliation Engine"]
        Exact["Exact Reference Lookup<br/>(order_id / paytm_link_id)"]
        Scorer["Fuzzy Candidate Heuristic<br/>(Score >= 40)"]
    end

    subgraph Outcome["Ledger State"]
        AutoClose["Auto-Close Entry<br/>Announce: 'Khaata band'"]
        ProactiveAsk["Proactive Dialogue<br/>'₹150 aaya, Gupta ji ka?'"]
    end

    PL --> Exact --> AutoClose
    QR --> Scorer --> ProactiveAsk
```

1. **Exact Link Settlement**:
   * Customer pays through the SMS link.
   * Paytm triggers `POST /api/paytm/callback` authenticated with `CHECKSUMHASH` (HMAC-SHA256).
   * Exact matching by `order_id` in database transaction; closes or decrements the entry immediately and announces: *"Gupta ji ne ₹150 de diye. Khaata band."*

2. **Heuristic QR Candidate Matching**:
   * Counter QR payments lack entry references.
   * Incoming webhook triggers candidate ranking algorithm:
     $$\text{Score} = S_{\text{amount}} + S_{\text{name}} + S_{\text{recency}}$$
     * **Amount Match ($S_{\text{amount}}$)**: $+100$ for exact pending match, $+40$ for partial payment, $+20$ for overpayment.
     * **Payer Name Similarity ($S_{\text{name}}$)**: Up to $+60$ based on Jaro-Winkler string distance against known customer record.
     * **Recency Decay ($S_{\text{recency}}$)**: Up to $+10$ decaying over a 30-day window.
   * Top candidates ($\ge 40$ score) trigger proactive ambient prompt: *"₹150 aaya, Gupta ji ka?"*.

Cash paid back at the counter needs no matching: the merchant says it, and it's recorded against the oldest open entries (see the read-back notes in [section 4](#4-conversation-state-machine)). If a QR payment of the same amount is still waiting with this customer among its candidates, Pari first asks whether it's the same money (*"QR pe ₹100 aaye hain, abhi kisi khaate mein nahi jude. Kya yeh Gupta ji wale hi hain?"*), so it isn't counted twice.

---

## 6. Hands-Free Ambient CLI Client

The terminal client (`npm run pari`) provides an ambient voice experience with zero wake-word friction:

* **Hardware Audio Capture**: Uses `sox` (with `libsox-fmt-pulse`) for real-time capture and playback.
* **Ambient Noise Calibration**: Automatically samples ambient room noise for 1 second upon boot to dynamically configure energy thresholds.
* **Smart Voice Activity Detection (VAD)**: Streams only active speech, ignoring background shop chatter.
* **Interactive Hotkeys**:
  * <kbd>Space</kbd> : Push-to-Talk (for loud/noisy environments).
  * <kbd>E</kbd> : Instant ledger snapshot (open entries and balances).
  * <kbd>L</kbd> : Simulates customer paying the active Paytm link.
  * <kbd>Q</kbd> : Simulates counter QR payment arrival.

---

## 7. API Specification

All `/api` endpoints (except the signature-verified Paytm webhook) require the `x-api-key: <PARI_API_KEY>` header (or `?key=` query param for SSE / Audio streams).

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/converse` | Orchestrated conversational turn. Accepts multipart audio or JSON `{ text, speak }`. Returns transcript, state, reply text, base64 audio, and timing metrics. |
| `GET` | `/api/converse/state` | Retrieves the active session state for the merchant. |
| `POST` | `/api/converse/reset` | Resets active conversation to `IDLE`. |
| `GET` | `/api/events` | Server-Sent Events (SSE) stream for real-time notifications (`entry.updated`, `payment.received`, `pari.prompt`, `pari.announce`). |
| `POST` | `/api/voice/entry` | Stateless single-shot audio/text entry extraction and readback. |
| `GET` | `/api/me` | The shop's name, UPI ID, QR payload (`upi://pay?...` when `PARI_UPI_ID` is set) and Pari's language (`null` until picked). |
| `PATCH` | `/api/me` | Sets Pari's language: `{ "language": "ta-IN" }`, one of the 11 codes. |
| `GET` | `/api/entries` | Lists ledger entries with optional status and customer filters, each with its latest payment link and matched payments. |
| `PATCH` | `/api/entries/:id` | Corrects an entry's amounts or customer name. |
| `POST` | `/api/entries/:id/confirm` | Confirms (`"yes"`) or rejects (`"no"`) an entry via JSON or audio. |
| `POST` | `/api/entries/:id/collect` | Dispatches a Paytm payment link to the customer's phone. |
| `GET` | `/api/customers/:id/balance` | Returns aggregate pending balance and list of open entries. |
| `GET` | `/api/payments/suggestions` | Retrieves outstanding QR payments awaiting confirmation. |
| `POST` | `/api/payments/:id/match` | Matches or rejects a suggested payment against an entry, and drops Pari's spoken question about it. |
| `GET` | `/api/tts/stream?text=&language=` | Low-latency audio streaming of Bulbul WAV synthesis, in that language's voice (the merchant's by default). |
| `POST` | `/api/paytm/callback` | Paytm status callback (checksum verified, public webhook). |
| `GET` | `/health` | Healthcheck reporting database status, Paytm mode, and Sarvam connectivity. |

---

## 8. Database Schema

Built using **Kysely** query builder over PostgreSQL (or embedded **PGlite** for zero-dependency local runs):

```
 merchants ──< customers ──< ledger_entries ──< payment_links
                                  │
 payments ────────────────────────┘ (via entry_id & match_status)
                                  │
 audit_log ───────────────────────┴ (immutable transition events)
```

* **`merchants`**: Store identity and SHA-256 hashed API keys.
* **`customers`**: Normalized names and verified phone numbers.
* **`ledger_entries`**: Financial state (`UNCONFIRMED`, `OPEN`, `CLOSED`, `REJECTED`), amounts in integer paise, audio transcripts, review flags.
* **`payment_links`**: Active and fulfilled Paytm link records with short URLs and order tokens.
* **`payments`**: `LINK`, `QR` and `CASH` transactions, matching status (`SUGGESTED`, `MATCHED`, `UNMATCHED`, `REJECTED`).
* **`audit_log`**: Tamper-evident transition audit trail logging actor (`merchant`, `paytm`, `system`) and payloads.

---

## 9. Getting Started

### Prerequisites
* **Node.js**: `v22.0.0` or higher.
* **Audio Tools** (for CLI audio): `sudo apt install sox libsox-fmt-pulse`.
* **Sarvam AI API Key**: Get one at [Sarvam AI Indus](https://indus.sarvam.ai).

### Installation
```bash
# Clone the repository
git clone https://github.com/mahreenaisha/pari.git
cd pari/backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and insert your SARVAM_API_KEY
```

### Verify Credentials
```bash
npm run sarvam:hello
```

### Launch Pari
```bash
npm run pari
```
*Automatically initializes embedded PGlite database at `.data/pglite`, applies migrations, seeds demo customers, starts the backend, and opens the listening terminal.*

### Testing & Verification
```bash
# Run unit, integration, and E2E mock suites (about 790 tests without network dependency)
npm test

# Type-check TypeScript sources
npm run typecheck

# Build for production
npm run build
```

---

## 10. Mobile App & Demo

The Expo app in [`frontend/`](frontend) (Pyari Pari) is a thin client of the conversation engine. It records the merchant, sends the clip to `POST /api/converse`, shows and speaks Pari's reply, and follows `/api/events` for payments. [`frontend/README.md`](frontend/README.md) covers development in the browser.

### Demo setup (Android phone over USB)

```bash
cd backend && npm install && cp .env.example .env   # set SARVAM_API_KEY; PARI_DEMO_SEED=true adds a few days of history
npm run dev                                          # not "npm run pari": the CLI would also listen on the laptop mic
adb reverse tcp:4000 tcp:4000                        # the phone's localhost:4000 reaches the laptop's backend
adb reverse tcp:8081 tcp:8081                        # only for a debug build served by Metro
cd ../frontend && npm install
cp .env.example .env.local                           # set EXPO_PUBLIC_DEMO_TOOLS=true
npx expo run:android                                 # or --variant release for a faster, Metro-free build
```

* Sarvam needs internet, so keep a phone hotspot as a backup. Check the Sarvam credits beforehand; the backend returns 402 when they run out.
* For a fresh start, stop the backend and delete `backend/.data/pglite`. Pari only asks for a customer's number until it has one, and the app asks for the language again.

### Demo script (about 4 minutes)

The script is in Hindi. In another language, Pari's lines are in that language, and the Listen screen shows an example sentence to say.

0. **Pick the language.** On first launch the app asks for Pari's language; tap हिन्दी.
1. **Speak.** Tap the sky and say *"Gupta ji ne 350 ka samaan liya, 200 UPI diya, 150 baaki."*
2. **Extract and confirm.** The breakdown shows ₹350, ₹200 and ₹150, and Pari says *"Gupta ji, total ₹350, ₹200 mile, ₹150 baaki. Save karoon?"* Answer "Haan".
3. **Collect.** Pari: *"Save ho gaya. ₹150 ka payment link bhejun?"* Answer "Haan", give the number (*"98765 43210"*), and answer "Haan" to *"98765 43210. Sahi hai?"* Pari: *"Link bhej diya…"* (the mock Paytm logs the SMS).
4. **Close by link.** On the Ledger, Gupta ji shows "Link sent". Long-press the row: Pari announces *"Gupta ji ne ₹150 de diye. Khaata band."* and the row flips to "Closed by link".
5. **Reconcile a QR payment.** Say *"Verma ji ne 500 ka saamaan liya, 300 diye"*, answer "Haan", then "Abhi nahi". On the QR tab, long-press the code. Pari asks *"₹200 aaya, Verma ji ka?"* aloud and on the card. Answer "Haan" and the entry closes.
6. **Cash and balances.** Say *"Verma ji ko 300 udhaar likh do"*, answer "Haan", then "Abhi nahi". Say *"Verma ji ne 100 diye"*: Pari reads back *"Verma ji se ₹100 mile. ₹300 baaki tha, ab ₹200 bachega. Save karoon?"* Answer "Haan", then ask *"Verma ji ka kitna baaki hai?"*: *"Verma ji ka ₹200 baaki hai."*
7. **Guardrail.** During a read-back, say *"Nahi, 250 diye"*: Pari corrects the entry, and nothing is saved without a "haan".
8. **Finish on the Ledger** with "To collect" and "Collected today".

In a noisy room, the buttons drive the same conversation as the voice. The Paytm sandbox is optional (see [`backend/README.md`](backend/README.md)); the demo uses simulated payments.

---

## 11. License & Credits

Built for Kirana store empowerment across India. Developed with Express, TypeScript, Sarvam AI, and Paytm.
