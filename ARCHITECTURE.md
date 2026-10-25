# SENTRIX — AI Agent Safety & Control Gateway
## Technical Architecture & Developer Reference

> **Problem Statement:** PS 2.1 — AI Agent Safety and Control  
> **Production Deployment:** [https://sentrix-by-sentrix.vercel.app/](https://sentrix-by-sentrix.vercel.app/)  
> **Repository:** [https://github.com/sharathbk910/SENTRIX.git](https://github.com/sharathbk910/SENTRIX.git)

---

### 1. Architectural Overview

SENTRIX acts as a **deterministic, pre-execution interception gateway and control plane** positioned between autonomous AI agents and sensitive enterprise tools (databases, file systems, payment APIs, cloud storage, shell execution).

```
[ Autonomous AI Agent ]
         │
         ▼ (Proposes tool action: e.g. "file_store:delete" or "data_transfer:export")
┌─────────────────────────────────────────────────────────────────┐
│               SENTRIX PRE-EXECUTION GATEWAY                     │
│                                                                 │
│  1. Emergency Halt Check      ──► Hard-stop if paused           │
│  2. Prompt Injection Scanner  ──► Neutralizes adversarial text  │
│  3. Data Leak (DLP) Scanner   ──► Masks secrets & API tokens    │
│  4. Policy Engine Evaluation  ──► Evaluates active rules        │
│  5. Anomaly & Risk Engine     ──► Calculates risk score (0-100) │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
     [ ALLOW ]       [ BLOCK ]   [ REQUIRE APPROVAL ]
         │               │               │
 Executes safely  Halted instantly  Held in Quarantine Queue
         │               │          (Waiting for Human Supervisor)
         └───────────────┼───────────────┘
                         ▼
        [ Cryptographic SHA-256 Audit Ledger ]
       (Sealed in an unbroken forward hash chain)
```

---

### 2. Directory Structure & Organization

```
SENTRIX/
├── api/                           # Vercel serverless entry point (bundled app)
│   └── index.js
├── server/                        # Node.js / Express security gateway backend
│   ├── config/                    # Server runtime configuration & thresholds
│   │   └── env.ts
│   ├── mock-tools/                # Sandbox resource store (catalogue, financial, dossiers)
│   │   └── store.ts
│   ├── policy-engine/             # Core policy evaluation algorithms
│   │   ├── conflictDetector.ts    # Contradictory rule conflict analysis
│   │   ├── engine.ts              # Deterministic rule match evaluation
│   │   └── nlpPolicyTranslator.ts # Plain-English natural language policy compiler
│   ├── routes/                    # Modular, scalable REST API controllers
│   │   ├── actions.routes.ts      # Action evaluation endpoints
│   │   ├── attackDemo.routes.ts   # Live attack demonstration endpoints
│   │   ├── approvals.routes.ts    # Human-in-the-loop quarantine & clearance
│   │   ├── audit.routes.ts        # Cryptographic hash ledger & verify endpoints
│   │   ├── policies.routes.ts     # Policy rule creation, translation, and toggle
│   │   ├── system.routes.ts       # Health, stats, alerts, kill switch, and reset
│   │   ├── index.ts               # Sub-router aggregator
│   │   └── api.ts                 # Backward-compatible API export
│   ├── security/                  # Isolated security scanning engines
│   │   ├── anomalyDetector.ts     # Sliding-window anomaly detection
│   │   ├── auditHashChain.ts      # SHA-256 forward-chaining integrity engine
│   │   ├── promptInjectionScanner.ts # Heuristic injection signature detector
│   │   └── sensitiveDataScanner.ts   # Outbound secret & PII masking scanner
│   ├── services/
│   │   └── securityGateway.ts     # Unified 10-step security gateway orchestrator
│   ├── app.ts                     # Express application definition & CORS config
│   ├── index.ts                   # Local development server entry point
│   └── types.ts                   # Re-exported domain types
│
├── src/                           # React 18 / TypeScript frontend
│   ├── assets/                    # Icons and static brand assets
│   ├── config/                    # Frontend runtime configuration
│   │   └── env.ts
│   ├── context/                   # Global state management
│   │   └── GatewayContext.tsx     # Centralized Gateway provider
│   ├── hooks/                     # Custom React hooks
│   │   └── useGateway.ts          # Gateway consumer hook
│   ├── components/
│   │   ├── common/                # Reusable atomic UI components
│   │   │   ├── Badge.tsx          # Decision, Risk, Status badges
│   │   │   ├── Button.tsx         # Unified button primitives with loading states
│   │   │   ├── Card.tsx           # Enterprise card container
│   │   │   ├── CommandPalette.tsx # Quick actions modal (Ctrl+K)
│   │   │   ├── ErrorBoundary.tsx  # React render exception boundary
│   │   │   ├── Logo.tsx           # Sentrix brand badge
│   │   │   ├── Modal.tsx          # Accessible modal dialog
│   │   │   ├── PageHeader.tsx     # Standardized page header component
│   │   │   └── ToastContainer.tsx # Decoupled notification container
│   │   └── layout/                # Structural layout components
│   │       ├── AppLayout.tsx      # Main application shell
│   │       ├── Navbar.tsx         # Global header with emergency stop
│   │       └── Sidebar.tsx        # Responsive navigation drawer
│   ├── pages/                     # Dedicated view controllers
│   │   ├── Alerts.tsx             # Behavioral anomaly alerts
│   │   ├── Approvals.tsx          # Human-in-the-loop quarantine queue
│   │   ├── AttackDemo.tsx         # Live comparative attack simulation
│   │   ├── Audit.tsx              # Tamper-evident SHA-256 audit ledger
│   │   ├── Dashboard.tsx          # Real-time action monitor & scenarios
│   │   ├── Playground.tsx         # Policy evaluation console
│   │   ├── Policies.tsx           # Plain-English rule builder
│   │   └── Settings.tsx           # Security posture & environment reset
│   ├── lib/
│   │   └── api.ts                 # Type-safe client HTTP library
│   ├── types/
│   │   └── index.ts               # Core TypeScript interface definitions
│   ├── utils/
│   │   └── formatters.ts          # Pure display and cryptographic formatting helpers
│   ├── App.tsx                    # Clean declarative view router
│   ├── main.tsx                   # React DOM root mounting
│   └── index.css                  # Global design tokens and styles
│
├── tests/
│   └── audit.test.mjs             # 31-suite automated compliance & security test
└── ARCHITECTURE.md                # This document
```

---

### 3. The 10-Step Deterministic Gateway Pipeline

Every autonomous action submitted to `POST /api/actions/evaluate` is evaluated strictly server-side through a deterministic 10-step sequence:

| Step | Engine | Action & Verification |
| :--- | :--- | :--- |
| **1** | **Emergency Halt Check** | If `emergencyPause` is active, immediately blocks with `CRITICAL_HALT`. |
| **2** | **Sanitization & Normalization** | Strips malicious control characters and normalizes tool/operation keys. |
| **3** | **Prompt Injection Scanner** | Inspects untrusted documents/payloads for adversarial override signatures. |
| **4** | **Data Loss Prevention (DLP)** | Detects secret tokens, API keys, credentials, and masks sensitive patterns. |
| **5** | **Policy Engine Matching** | Matches action against active rules using specific & wildcard pattern matchers. |
| **6** | **Conflict Resolution** | Resolves overlapping rules using the strict **Deny-First** fallback strategy. |
| **7** | **Behavioral Anomaly Engine** | Evaluates sliding-window burst thresholds (alerts on &ge;3 blocks per window). |
| **8** | **Risk Score Computation** | Computes normalized composite risk score (0-100) and assigns severity level. |
| **9** | **Execution or Quarantine Gate** | Safe actions execute; high-risk actions quarantine in the Approval Queue with TTL. |
| **10** | **Cryptographic Audit Seal** | Computes SHA-256 hash chained to predecessor and seals event in ledger. |

---

### 4. Scalable API Route Map

All routes are mounted under `/api` (and at root `/` for flexible hosting rewrites):

* **Actions** (`/api/actions`)
  * `POST /evaluate` &mdash; Intercepts and evaluates proposed agent action.
* **Policies** (`/api/policies`)
  * `GET /` &mdash; Lists active security policies.
  * `POST /` &mdash; Activates a validated security rule.
  * `POST /translate` &mdash; Translates natural English to structured policy with test cases.
  * `DELETE /:id` &mdash; Revokes a policy rule.
  * `PATCH /:id/toggle` &mdash; Toggles rule enforcement status.
* **Approvals** (`/api/approvals`)
  * `GET /` &mdash; Lists pending, approved, rejected, and expired quarantine requests.
  * `POST /:id/decision` &mdash; Authorizes or rejects action with replay prevention.
  * `POST /:id/simulate-expiry` &mdash; Tests auto-expiry enforcement.
* **Audit** (`/api/audit`)
  * `GET /` &mdash; Returns chronological cryptographically linked event log.
  * `GET /verify` / `POST /verify` &mdash; Validates SHA-256 forward hash chain integrity from Genesis to Head.
  * `POST /simulate-tamper` &mdash; Mutates an audit event without updating its seal to prove tamper detection.
* **Attack Demonstration** (`/api/attack-demo`)
  * `GET /scenario` &mdash; Returns scenario briefing and adversarial payload.
  * `POST /run` &mdash; Executes side-by-side comparative simulation.
* **System & Governance** (`/api`)
  * `GET /health` &mdash; Returns gateway health and version.
  * `GET /stats` &mdash; Computes live containment rates and event KPIs.
  * `GET /alerts` / `POST /alerts/:id/resolve` &mdash; Anomaly alert management.
  * `GET /emergency-pause` / `POST /emergency-pause/toggle` &mdash; Instant kill switch.
  * `GET /policy-conflicts` &mdash; Returns detected contradictory rule pairs.
  * `POST /reset` &mdash; Resets sandbox environment to safe baseline.

---

### 5. Frontend State Management (`GatewayContext`)

The client architecture uses a clean React Context pattern (`GatewayProvider`):
* **State Encapsulation**: Telemetry, policies, approvals, audit logs, and pause states are managed centrally in `GatewayContext.tsx`.
* **Zero Prop Drilling**: Components access data and action dispatchers using the custom `useGateway()` hook.
* **Fault Isolation**: All views are wrapped in an `ErrorBoundary` that captures rendering exceptions without blanking out the UI shell.
* **Background Synchronization**: Automatically polls live security events every 8,000ms while keeping memory usage flat.

---

### 6. Automated Testing & Verification

The test suite in `tests/audit.test.mjs` verifies **31 distinct security criteria** across 8 sections:
* Read endpoints & JSON header compliance
* Error handling & 404 JSON structures
* Deterministic policy enforcement (Allow, Block, Deny-by-default)
* DLP outbound secret masking & Prompt Injection neutralization
* Plain-English NLP translation & test-case generation
* Human approval quarantine, replay prevention, and TTL expiration
* SHA-256 hash chain cryptographic integrity & tamper detection
* Production hygiene (zero hardcoded `localhost:3001` calls)

Run the test suite anytime:
```bash
npm test
```
Build and validate production bundle:
```bash
npm run build
```
