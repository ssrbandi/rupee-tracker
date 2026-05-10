# Rupee Tracker

> A privacy-first expense tracking PWA for Indian small business owners, farmers, and families.

**Live app:** https://rupee-tracker-fe408.web.app

---

## What it does

Rupee Tracker is a full-stack progressive web app that lets users track income and expenses across customisable categories, maintain a running balance, and export records as PDF — all with their data encrypted and stored privately under their own account.

The target user is a small farmer, shop owner, or contractor who needs simple financial records without complexity. Not a bank statement analyser. Not an investment tracker. A smart ledger with memory.

---

## Core features

- **OTP login** — phone number + SMS OTP via Firebase Auth, no password required
- **Custom tabs** — create expense or income categories (Fertilizer, Sales, Salary, etc.)
- **Live balance** — computed in real time from opening balance + funds added + all tab entries
- **Funds history** — every top-up recorded with date and optional note, fully traceable
- **Soft delete** — deleted entries go to trash, restorable anytime, permanent delete on demand
- **PDF export** — full ledger exported as formatted PDF via jsPDF, works offline
- **AES-256-GCM encryption** — all financial data encrypted client-side before touching Firestore
- **Offline support** — Firestore IndexedDB persistence, works without internet, syncs on reconnect
- **PWA** — installable on Android, iPhone, and Desktop without app store
- **Play Store** — publishing via TWA (Trusted Web Activity)

---

## Architecture

```
React 18 + Vite (PWA)
        │
        │ HTTPS
        ▼
Firebase Auth (Phone OTP)
        │
        ▼
Firestore (per-user isolated data)
        │
AES-256-GCM encryption layer
(client-side, Web Crypto API)
        │
        ▼
Firebase Hosting (global CDN)
```

### Why this stack

- **Firebase Auth** — OTP login without a custom auth server. Session persistence means users are not re-prompted on every visit.
- **Firestore** — real-time listeners give live balance updates without polling. Offline persistence via IndexedDB means the app works without internet.
- **Client-side encryption** — data encrypted before leaving the device. Even direct Firestore access yields only base64 ciphertext.
- **Firebase Hosting** — single command deploy, global CDN, automatic HTTPS, PWA manifest served correctly.

---

## Security

Three independent layers:

### Layer 1 — Firebase Auth
Only authenticated users can make Firestore requests. OTP verified against real phone numbers via Firebase's SMS infrastructure.

### Layer 2 — Firestore Security Rules
Per-user data isolation enforced at the database level. User A's security rules block User B from reading or writing User A's data — even if User B has the Firebase config.

```
match /users/{userId} {
  allow read, write: if request.auth != null
                     && request.auth.uid == userId;
}
```

### Layer 3 — AES-256-GCM Encryption
All sensitive fields (balance, tab names, entry labels, amounts, fund notes) encrypted client-side using the Web Crypto API before being written to Firestore.

**Key derivation:** The encryption key is derived from the user's Firebase UID, padded to 32 bytes and imported as a raw AES-256 key. The key never persists anywhere — it is re-derived at runtime on every session.

**IV generation:** A cryptographically random 12-byte IV is generated for every encryption operation. IV is prepended to ciphertext, base64 encoded, stored in Firestore. Identical plaintext produces different ciphertext every time — no pattern leakage.

**Integrity:** GCM mode provides both confidentiality and authentication. Any tampering with stored ciphertext causes decryption to fail — not silently produce garbage.

```js
// Encryption flow
const iv  = crypto.getRandomValues(new Uint8Array(12))
const ct  = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
const buf = new Uint8Array([...iv, ...new Uint8Array(ct)])
return btoa(String.fromCharCode(...buf))
```

---

## Data model

```
Firestore
└── users/
    └── {userId}/
        ├── profile         → name, phone, openingBalance (encrypted)
        ├── funds/          → top-ups with amount, note, date (all encrypted)
        └── tabs/
            └── {tabId}/    → name (encrypted), type (expense|income), color
                └── entries/
                    └── {entryId} → label (encrypted), amount (encrypted), date
```

All documents have a `deleted` flag for soft-delete. Firestore listeners filter deleted items from normal views. Trash screen shows recoverable items. Permanent delete removes the document.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, PWA (vite-plugin-pwa) |
| Auth | Firebase Phone Auth (OTP) |
| Database | Cloud Firestore |
| Encryption | Web Crypto API — AES-256-GCM |
| PDF export | jsPDF |
| Hosting | Firebase Hosting |
| Play Store | TWA (Trusted Web Activity) |
| Planned backend | .NET Core Web API on GCP Cloud Run |

---

## Roadmap

### Now (v1 — live)
- [x] OTP login
- [x] Custom expense and income tabs
- [x] Funds history with full traceability
- [x] AES-256-GCM client-side encryption
- [x] Soft delete with trash and restore
- [x] PDF export
- [x] Offline support
- [x] PWA installable on all platforms

### Next (v2 — Play Store)
- [ ] Play Store publication via TWA
- [ ] Privacy policy page
- [ ] In-app feedback with star rating
- [ ] Currency selector (INR, USD, EUR, etc.)
- [ ] Error boundaries and production hardening

### Future (v3 — .NET backend)
- [ ] .NET Core Web API on Cloud Run
- [ ] Server-side validation and rate limiting
- [ ] Structured logging with Serilog
- [ ] Family sharing with multi-user ledger
- [ ] PBKDF2 key derivation for zero-knowledge encryption

---

## Running locally

```bash
# Clone
git clone https://github.com/ssrbandi/rupee-tracker.git
cd rupee-tracker

# Install
npm install

# Add Firebase config
# Create src/firebase/config.js with your Firebase project credentials

# Development
npm run dev

# Production build
npm run build

# Deploy
firebase deploy --only hosting
```

---

## What I learned building this

This project taught me things no tutorial covers:

- **PWA manifest and service worker** — why icons must be local files for Chrome install prompt to trigger, how service workers cache assets for offline use
- **Firestore security rules** — the difference between client-side filtering and server-side enforcement, why rules must cover subcollections explicitly
- **AES-GCM internals** — why a random IV is non-negotiable, what GCM authentication tags protect against, how key derivation from UID creates per-user isolation
- **Real-time listeners with React** — managing multiple onSnapshot subscriptions, cleanup functions, and state updates without memory leaks
- **Soft delete patterns** — why flagging beats deleting for user trust, how to filter at query level vs application level
- **Firebase Phone Auth in production** — reCAPTCHA requirements on HTTPS vs localhost, SMS quota management, test number configuration

---

## Planned: .NET Core Web API migration

The current architecture uses Firestore directly from the frontend. The next major version adds a .NET Core Web API backend on GCP Cloud Run:

```
React PWA
    │ HTTPS
    ▼
.NET Core Web API (Cloud Run)
├── JWT middleware (Firebase token verification)
├── Rate limiting (100 req/min per user)
├── Server-side validation
├── Serilog structured logging
└── Clean architecture (Controllers → Services → Repository)
    │
    ▼
Firestore (data layer, unchanged)
```

This migration is deliberately incremental — Firebase handles auth and hosting, the API adds the validation and business logic layer without disrupting existing users.

---

*Built by SSR — .NET backend developer transitioning into AI engineering.*
*Part of a portfolio that includes CineSense (AI mood-based movie recommendation engine with RAG pipeline, HuggingFace embeddings, and Claude API).*
