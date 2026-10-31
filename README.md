<div align="center">

# Pari (परी)
### Voice-First Udhar Ledger & Automated Paytm Settlement for Indian Kirana Stores

*Built for India's 30 million dukans. Sits by the galla, speaks 11 Indian languages, does the math on udhar, texts Paytm payment links, and settles balances the moment money hits the counter QR.*

<br/>

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-black?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2058-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.88-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![Sarvam AI](https://img.shields.io/badge/Sarvam%20AI-11%20Indic%20Languages-6C47FF?style=for-the-badge)](https://sarvam.ai/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20PGlite-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://github.com/electric-sql/pglite)
[![Paytm](https://img.shields.io/badge/Payments-Paytm%20Payment%20Links-00b9f5?style=for-the-badge)](https://developer.paytm.com/)
[![Tests](https://img.shields.io/badge/Tests-796%20Passed-brightgreen?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Google_Drive-4285F4?style=for-the-badge&logo=googledrive&logoColor=white)](https://drive.google.com/file/d/1dJf6J4ldn8KyH3-rhGZ1_6KFrnZI6Kc0/view?usp=sharing)

<p>
  <strong><a href="https://drive.google.com/file/d/1dJf6J4ldn8KyH3-rhGZ1_6KFrnZI6Kc0/view?usp=sharing" target="_blank">Watch Live Product Demo on Google Drive &rarr;</a></strong>
</p>

</div>

---

### App Interface

| Voice Assistant | Open Udhar Ledger | Soundbox Settlement | Counter QR Display |
| :---: | :---: | :---: | :---: |
| <img src="assets/screenshots/01-voice-listen.jpeg" width="200" alt="Voice Assistant" /> | <img src="assets/screenshots/02-open-ledger.jpeg" width="200" alt="Open Udhar Ledger" /> | <img src="assets/screenshots/03-settled-ledger.jpeg" width="200" alt="Settled Ledger Entries" /> | <img src="assets/screenshots/04-counter-qr.jpeg" width="200" alt="Counter QR Code" /> |
| <sub>Tap sky orb & speak shop talk</sub> | <sub>Active credit & Paytm SMS links</sub> | <sub>Auto-closed on incoming UPI</sub> | <sub>Instant counter collection</sub> |

---

## The Kirana Reality

Over $800 billion of India's retail commerce flows through neighborhood kirana stores. More than half of that business runs on **udhar** (informal shop credit) based on trust, personal relationships (*"Gupta ji, kal hisaab karenge"*), and dog-eared paper notebooks (*bahi-khata*).

When twenty customers crowd the counter, shouting orders across sacks of grain, a shopkeeper cannot unlock an Android phone, tap through accounting menus, and type customer names. They need an ambient assistant that listens the way India talks.

**Pari** turns natural shop talk into deterministic bookkeeping:

1. **Boliye (Speak Naturally)**: Speak your shop vernacular mixed with English (*"Gupta ji ne saade teen sau ka samaan liya, dedh sau diye, do sau baaki"*). Works across **11 Indian languages**.
2. **Pakka Hisaab (Zero-Hallucination Math)**: Pari uses Sarvam AI for entity extraction, but enforces strict mathematical invariants ($Total = Paid + Pending$). Every amount is verified against spoken audio before anything hits the database.
3. **Paytm Recovery via SMS**: Once confirmed, Pari sends an SMS payment link via Paytm to the customer's phone for the pending balance.
4. **Smart Soundbox & Counter Settlement**: When an unreferenced UPI payment hits the counter QR, Pari asks aloud: *"₹150 aaya, Gupta ji ka?"* One *"Haan"* settles the entry. Cash paid back at the galla (*"Verma ji ne 100 diye"*) is recorded by voice, and Pari speaks out remaining balances and exact change to return.

---

## What Makes Pari Different

* **Ambient Voice & Push-to-Talk**: Zero typing required. Powered by Sarvam AI (`saaras:v4` code-mixed STT, `sarvam-105b-conversations` MoE LLM, and `bulbul` voice models).
* **Vernacular Number Engine**: Understands colloquial Indian counting units and fractions (*sau*, *hazaar*, *lakh*, *dedh*, *dhai*, *saade*, *sava*, *paune*) and 10-digit mobile numbers in any Indian script.
* **11 Indian Languages**: Hindi, Bengali, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Punjabi, Odia, and Indian English. Not just translated text, but native speech recognition, localized number parsing, and authentic regional female voices.
* **Counter Cash & Instant Ledger Inquiries**: Ask what anyone owes (*"Gupta ji ka kitna baaki hai?"*) or query total store udhar (*"Kul kitna udhaar hai?"*) and get immediate spoken answers.
* **Soundbox Reconciliation**: Eliminates the blind spot of physical soundboxes by matching anonymous incoming QR payments to open debts.
* **Dual Platforms**: Cross-platform mobile app (Expo SDK 58 / React Native 0.88 / Skia shaders) and a hands-free terminal CLI with ambient noise calibration for noisy counters.

---

## Quickstart

### 1. Backend Setup
```bash
cd backend && npm install
cp .env.example .env                  # Set SARVAM_API_KEY
npm run dev                           # Runs on http://localhost:4000
```
> [!TIP]
> **Zero-Dependency Database**: Leave `DATABASE_URL` empty to run on embedded **PGlite** (WASM PostgreSQL in `.data/pglite`). No Docker required. To use Docker PostgreSQL, run `docker compose up -d` and set `DATABASE_URL=postgres://pari:pari@localhost:5432/pari`.

### 2. Frontend App Setup
```bash
cd frontend && npm install
cp .env.example .env.local            # EXPO_PUBLIC_API_URL=http://localhost:4000
npx expo start --web                  # Run in browser
```

### 3. Physical Android Device (USB Debugging)
```bash
adb reverse tcp:4000 tcp:4000         # Forward backend API
adb reverse tcp:8081 tcp:8081         # Forward Metro bundler
cd frontend && npx expo run:android
```

### 4. Hands-Free Terminal CLI
```bash
cd backend && npm run pari            # Ambient voice terminal listening on hardware mic
```

---

## Documentation Index

| Document | Purpose |
| :--- | :--- |
| **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** | End-to-end Mermaid architecture, conversation state machine, QR candidate scoring algorithms, 11 languages matrix, and DB schema. |
| **[backend/README.md](backend/README.md)** | Express 5 REST & SSE API specification, CLI hotkeys, Paytm sandbox tunneling, and PGlite/Docker storage. |
| **[frontend/README.md](frontend/README.md)** | Expo SDK 58 / React Native architecture, Skia sky orb shaders, Android ADB setup, and demo shortcuts. |
| **[docs/DEMO_GUIDE.md](docs/DEMO_GUIDE.md)** | Complete 6-act demonstration playbook, exact spoken dialogues, and judge presentation script. |
| **[frontend/AGENTS.md](frontend/AGENTS.md)** | Mobile developer guidelines, Expo Router routing rules, and continuous native generation standards. |

---

## Testing & Verification

```bash
# Backend: 796 offline unit, state machine, and E2E mock tests
cd backend && npm test

# Type-check TypeScript sources
npm run typecheck && cd ../frontend && npm run typecheck
```

---

## License & Credits

Built for Kirana store empowerment across India. Developed with Express, Expo, Sarvam AI, Kysely, and Paytm.
