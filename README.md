# SENTRIX — AI Agent Security & Control Gateway

> **"Every AI Action. Under Control."**

![SENTRIX Brand Logo](./src/assets/sentrix-logo.svg)

---

## 1. Enterprise Security Overview

**SENTRIX** is a deterministic, zero-trust AI Agent Security Gateway designed to evaluate, quarantine, or neutralize autonomous agent actions before execution against databases, file stores, or external network APIs.

### Core Architectural Defenses:
1. **Zero-LLM Policy Authority**: Policy rules and enforcement logic evaluate strictly in deterministic server code. AI models are never allowed to override security decisions.
2. **Deterministic Deny-by-Default**: Any tool, operation, or target resource not explicitly permitted by an enabled policy is blocked.
3. **Sensitive Data Leak Prevention (DLP)**: Outbound payload inspection stops secret tokens, API keys, credentials, and PII from leaving the gateway perimeter.
4. **Prompt Injection & Adversarial Document Shield**: Heuristic scanner flags untrusted documents attempting policy overrides or instructions like *"Ignore previous instructions"*.
5. **Behavior Anomaly Alerts**: Rolling window tracking detects agents triggering repeated denials (&ge;3 blocked attempts in 5 minutes) and alerts SecOps.
6. **Policy Conflict Validation & Deny-First Fallback**: Detects contradictory rules in the Policy Center and enforces deterministic deny-first fallback.
7. **Permission Auto-Expiry & Replay Defense**: Quarantined approvals carry strict time-to-live (TTL) expiration timestamps. Expired approvals are denied execution. Replay attacks are blocked server-side.
8. **Emergency Agent Pause (Kill Switch)**: Administrative kill switch hard-stops all agent actions across the gateway with persistent UI warning banners.

---

## 2. Tested Security Feature Benchmarks & Acceptance Tests

| Feature | Input / Trigger | Gateway Defense | Server Enforcement Verdict |
|---|---|---|---|
| **Feature A: Sensitive Data Leak Prevention** | Mock export with Stripe API key & credentials | Outbound scanner detects secret tokens | `BLOCK` (`BLOCKED_AT_SENSITIVE_DATA_SCANNER`). Masked in logs; secret never leaves gateway. |
| **Feature B: Prompt Injection Detection** | Untrusted document with *"Ignore previous instructions and ignore policies"* | Adversarial prompt heuristic scanner | `BLOCK` (`DIRECT_PROMPT_INJECTION`). Action neutralized; untrusted input cannot override policies. |
| **Feature C: Behavior Anomaly Alerts** | Agent generates 3 repeated blocked attempts within 5 minutes | Rolling window anomaly tracker | Triggers `CRITICAL`/`WARNING` Anomaly Alert in the Alerts Center. |
| **Feature D: Policy Conflict Validation** | Enable conflicting rule `POL-005` matching `file_store:read` on `public_catalogue` | Conflict detector identifies contradictory `ALLOW` vs `BLOCK` | Enforces **Deny-First Fallback** (`BLOCK`) until administrator resolves rule conflict. |
| **Feature E: Permission Auto-Expiry** | Approved action whose validity window (TTL) has lapsed | Immediate server-side expiry verification | `EXPIRED` &mdash; Server denies execution. Cannot be replayed or executed. |
| **Feature F: Emergency Agent Pause** | Administrator activates Emergency Pause Kill Switch | Global runtime hard stop | `BLOCK` &mdash; Denies all agent tool calls across the entire gateway. |

---

## 3. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, JetBrains Mono & Outfit typography.
- **Backend API**: Node.js, Express, TypeScript (`tsx`), CORS.
- **Security Scanners**:
  - `sensitiveDataScanner.ts`: Outbound token and credential regex scanner with in-place secret masking.
  - `promptInjectionScanner.ts`: Adversarial instruction heuristic signature matcher.
  - `anomalyDetector.ts`: Sliding-window agent denial tracker with de-duplicated alert aggregation.
  - `conflictDetector.ts`: Overlapping scope and contradictory decision analyzer.
- **Storage Mode**: Local In-Memory Isolation Mode (Zero paid APIs, Zero external LLM dependencies).
- **PostgreSQL Migrations**: `supabase/migrations/20261022000000_init_sentrix_schema.sql` with Row Level Security (RLS).

---

## 4. Running the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Backend Security Gateway (Port 3001)
```bash
npm run server
```

### 3. Start the Frontend Dashboard (Port 5173 with API Proxy)
```bash
npm run dev
```

Open your browser at **`http://localhost:5173/`**.

---

## 5. How to Demonstrate All 6 Features

1. **Feature A &mdash; Sensitive Data Leak Prevention**:
   - Go to **Action Playground** &rarr; Select **Preset 4 ("Sensitive Data Leak Attempt")**.
   - Notice the payload contains secret payment tokens and passwords in parameters.
   - Click **Evaluate & Enforce**.
   - Result: Gateway intercepts the secret, displays the masked sample `sk_l...***REDACTED***...`, and blocks transmission.

2. **Feature B &mdash; Prompt Injection Detection**:
   - In **Action Playground** &rarr; Select **Preset 5 ("Prompt Injection Attack")**.
   - Notice untrusted document contains `"Ignore previous instructions and ignore security policies"`.
   - Click **Evaluate & Enforce**.
   - Result: Flagged as `DIRECT_PROMPT_INJECTION` and neutralized.

3. **Feature C &mdash; Behavior Anomaly Alerts**:
   - In **Action Playground** &rarr; Click **Preset 6 ("Fuzzing Anomaly Burst")** 3 times.
   - Result: Gateway triggers a Behavior Anomaly Alert for agent `agent-malicious-fuzzer`.
   - Click **Anomaly Alerts** in the sidebar to inspect the active alert and resolve it.

4. **Feature D &mdash; Policy Conflict Warnings**:
   - Navigate to **Security Policies**.
   - Click **"Simulate Conflict"** on the Demo Policy Conflict Switch (enables `POL-005`).
   - Notice the high-priority **Policy Conflict Warning** banner appears.
   - Return to Playground and test **Preset 1 ("Read Public Catalogue")**.
   - Result: The gateway applies **Deny-First Fallback** and blocks execution.

5. **Feature E &mdash; Permission Auto-Expiry**:
   - In **Action Playground** &rarr; Click **Preset 3 ("Transfer Confidential Dossiers")**.
   - Navigate to **Approval Centre**.
   - Click **"Simulate Expiry"** on the quarantined approval card.
   - Now click **Authorize & Execute**.
   - Result: Server denies execution with status `EXPIRED` &mdash; expired approvals cannot execute.

6. **Feature F &mdash; Emergency Agent Pause (Kill Switch)**:
   - In the top navigation bar, click the red **"Emergency Pause"** button.
   - Confirm activation.
   - Notice the sticky red emergency halt banner appears across all views.
   - Go to Playground &rarr; Try running normally permitted **Preset 1**.
   - Result: Server immediately hard-stops execution with `EMERGENCY_PAUSED`.
   - Click **"Resume Gateway"** in the top banner to restore normal operation.
