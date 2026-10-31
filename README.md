<div align="center">

# 🧚‍♀️ Pari (परी)
### Ambient Voice-First Udhar Ledger & Automated Paytm Settlement for Indian Kirana Stores

*Bridging vernacular shopkeeper speech and digital commerce with zero-hallucination accounting, 11 Indian languages, cash repayments, and proactive soundbox reconciliation.*

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

---

### 🎬 Product Demo Video

<a href="https://drive.google.com/file/d/1dJf6J4ldn8KyH3-rhGZ1_6KFrnZI6Kc0/view?usp=sharing" target="_blank">
  <img src="assets/demo-preview.png" alt="Pari Live Demo Video" width="560" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.25);" />
</a>

<p>
  <strong>▶️ <a href="https://drive.google.com/file/d/1dJf6J4ldn8KyH3-rhGZ1_6KFrnZI6Kc0/view?usp=sharing" target="_blank">Watch Live Product Demo (Google Drive)</a></strong>
</p>

---

</div>

## 📌 Executive Summary

Hundreds of millions of daily transactions in India’s neighbourhood **kirana** stores run on **udhar** (informal credit). Traditional paper notebooks (*bahi-khata*) get dog-eared or lost, while manual smartphone bookkeeping apps demand tedious typing at a busy, crowded counter.

**Pari** is an ambient, voice-first intelligent ledger that bridges vernacular speech and digital commerce:

1. **Speak Naturally**: Speak mixed vernacular (*"Gupta ji ne 350 ka samaan liya, 200 UPI diya, 150 baaki"*). Supports **11 Indian languages**.
2. **Deterministic Guardrails**: Strict mathematical invariants ($Total = Paid + Pending$) verified against audio before any record is saved.
3. **Automated Paytm Links**: Pari dispatches an SMS payment link via Paytm to the customer's phone for the pending balance.
4. **Intelligent Settlement**: Entries auto-close when the link is paid, or when counter QR payments land (*"₹150 aaya, Gupta ji ka?"*). Cash repaid at the counter is recorded by voice, and Pari answers ledger balances aloud.

---

## ✨ Key Capabilities

* 🎙️ **Ambient Voice & Push-to-Talk**: Zero typing. Uses Sarvam AI (`saaras:v4` STT, `sarvam-105b-conversations` LLM, and `bulbul` TTS).
* 🛡️ **Zero-Hallucination Accounting**: Numbers and fractions (*sau*, *hazaar*, *dedh*, *dhai*, *saade*) verified against spoken words.
* 🌐 **11 Indic Languages**: Hindi, English, Bengali, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Punjabi, and Odia.
* 💵 **Counter Cash & Balance Inquiries**: Speaks balances (*"Gupta ji ka kitna baaki hai?"*) and recalculates debt upon cash repayments.
* ⚡ **Soundbox & QR Reconciliation**: Proactively identifies unlinked UPI counter payments and settles matching debts.
* 📱 **Cross-Platform**: Mobile client (Expo SDK 58 / React Native 0.88 / Skia shaders) + Hands-Free Terminal CLI (`sox` / VAD).

---

## 🚀 Quickstart

### 1. Backend Setup
```bash
cd backend && npm install
cp .env.example .env                  # Add your SARVAM_API_KEY
npm run dev                           # Runs on http://localhost:4000
```
> [!TIP]
> **Zero-Setup Database**: With `DATABASE_URL` left blank, Pari uses embedded **PGlite** (WASM PostgreSQL in `.data/pglite`). No Docker required! To use Docker PostgreSQL, run `docker compose up -d` and set `DATABASE_URL=postgres://pari:pari@localhost:5432/pari`.

### 2. Frontend App Setup
```bash
cd frontend && npm install
cp .env.example .env.local            # EXPO_PUBLIC_API_URL=http://localhost:4000
npx expo start --web                  # Run in browser
```

### 3. Physical Android Device (USB Debugging)
```bash
adb reverse tcp:4000 tcp:4000         # Forward backend port
adb reverse tcp:8081 tcp:8081         # Forward Metro bundler
cd frontend && npx expo run:android
```

### 4. Hands-Free Terminal CLI
```bash
cd backend && npm run pari            # Ambient voice terminal listening on laptop mic
```

---

## 📖 Documentation Index

For in-depth guides, architectural diagrams, API schemas, and presentation scripts:

| Document | Description |
| :--- | :--- |
| 🏛️ **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** | End-to-end Mermaid architecture, conversation state machine, QR scoring algorithms, 11 languages matrix, and DB schema. |
| ⚡ **[backend/README.md](backend/README.md)** | Express 5 REST & SSE API specification, CLI hotkeys, Paytm sandbox tunneling, and PGlite/Docker storage. |
| 📱 **[frontend/README.md](frontend/README.md)** | Expo SDK 58 / React Native architecture, Skia sky orb shaders, Android ADB setup, and demo shortcuts. |
| 🎭 **[docs/DEMO_GUIDE.md](docs/DEMO_GUIDE.md)** | Complete dialogue script and 6-act demonstration playbook for presenting to judges. |
| 🤖 **[frontend/AGENTS.md](frontend/AGENTS.md)** | Mobile developer guidelines, Expo Router rules, and continuous native generation standards. |

---

## 🧪 Testing & Verification

```bash
# Backend: Run 786+ offline unit, state machine, and E2E mock tests
cd backend && npm test

# Type-check TypeScript sources
npm run typecheck && cd ../frontend && npm run typecheck
```

---

## 📄 License & Credits

Built for Kirana store empowerment across India. Developed with [Express](https://expressjs.com), [Expo](https://expo.dev), [Sarvam AI](https://sarvam.ai), [Kysely](https://kysely.dev), and [Paytm](https://developer.paytm.com).
