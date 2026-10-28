# ShareGrid

> **Tagline:** Access more. Own less. Share responsibly.

**Live Production URL:** [https://sharegrid-phi.vercel.app](https://sharegrid-phi.vercel.app)  
**GitHub Repository:** [https://github.com/Sh-git07/sharegrid](https://github.com/Sh-git07/sharegrid)

ShareGrid is an institutional resource-sharing platform engineered for campus communities. It transforms idle scientific instruments, 3D printers, media equipment, and research spaces into a safe, fair, and audited marketplace.

Built for **Pranveer Singh Institute of Technology (PSIT)**.

---

## 🌐 Live Deployment & Supabase Auth Setup

The production application is deployed on Vercel with security headers and SPA rewrites.
To ensure Supabase Auth redirects correctly for password resets and magic links:
1. Navigate to the **Supabase Dashboard** → Select project `askpkzotxnnzamwumfat`.
2. Go to **Authentication** → **URL Configuration**.
3. Set **Site URL** to: `https://sharegrid-phi.vercel.app`
4. In **Redirect URLs**, add: `https://sharegrid-phi.vercel.app/**` and `http://localhost:5173/**`.
5. Click **Save**.

---

## 🌟 Key Features

1. **Safety & Training Gates:** High-risk machinery (e.g. Ultimaker 3D printers, CNC mills) require certified and verified training modules before booking access is unlocked.
2. **Deterministic Conflict Prevention:** PostgreSQL `btree_gist` range exclusion constraints prevent overlapping reservations at the database engine level.
3. **Physical Condition Accountability:** Timestamped before/after checklists with image uploads for handover and return inspection.
4. **Democratic Access & Fair Caps:** Rolling 30-day usage hours limits and FIFO waitlists prevent hoarding.
5. **Append-Only Audit Ledger:** Complete state transitions and manager reviews are logged immutably with UPDATE and DELETE privileges permanently revoked.
6. **Privacy-Preserved Access:** Precise physical location codes and locker combinations are revealed only upon verified check-in.

---

## 🔐 Demo Credentials

When `VITE_DEMO_MODE=true`, a quick sign-in panel is rendered on `/login`. All demo accounts authenticate using real Supabase credentials with Row-Level Security applied identically:

| Role | Email | Password | Persona & Responsibilities |
|---|---|---|---|
| **Requester** | `requester@sharegrid.demo` | `RequesterPass123!` | Aarav Sharma (Student Researcher) - browses gear, submits certifications, requests slots, checks in. |
| **Resource Owner** | `owner@sharegrid.demo` | `OwnerPass123!` | Dr. Neha Patel (FabLab Director) - manages equipment listings, reviews requests, inspects returns. |
| **Manager** | `manager@sharegrid.demo` | `ManagerPass123!` | Prof. Rajesh Verma (Facility Manager) - verifies safety credentials, oversees queue, resolves disputes. |
| **Admin** | `admin@sharegrid.demo` | `AdminPass123!` | Pooja Deshmukh (Campus Admin) - oversees campus governance, RBAC permissions, and audit logs. |

---

## 🛠 Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Lucide React
- **Routing & State:** React Router v6, TanStack Query v5, React Hook Form, Zod
- **Data Visualization:** Recharts
- **Backend:** Supabase (PostgreSQL 15, `btree_gist` exclusion constraints, Row Level Security, Edge Functions)
- **Testing:** Vitest + React Testing Library (Unit/Component), Playwright (End-to-End)
- **Deployment:** Frontend on Vercel, Backend on Supabase

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node v20+)
- npm or pnpm
- Supabase CLI

### 2. Clone & Install
```bash
git clone https://github.com/Sh-git07/sharegrid.git
cd sharegrid
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env.local` and configure your credentials:
```bash
cp .env.example .env.local
```

Verify your environment variables:
```bash
npm run verify-env
```

### 4. Database Setup
Push migrations and seed demo data:
```bash
# Push schema migrations and exclusion constraints to Supabase
npm run db:push

# Seed demo users, categories, requirements, and historical records
npm run db:seed-users
```

### 5. Run the Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing

```bash
# Run linting
npm run lint

# Run TypeScript typecheck
npm run typecheck

# Run Vitest unit & security tests
npm test

# Run Playwright End-to-End Acceptance Scenario
npm run test:e2e

# Run RLS & Security Verification Suite against live database
npx tsx scripts/test-rls.ts
```

All test runs are documented in [`docs/TEST_SUMMARY.md`](docs/TEST_SUMMARY.md).

---

## 📋 Primary Acceptance Scenario (Section 11)

ShareGrid satisfies the 12-step end-to-end scenario:
1. **Owner Listing:** Dr. Neha Patel lists the Ultimaker S5 3D Printer with safety training requirement `SAFE-3D-101`.
2. **Requester Discovery:** Aarav Sharma searches for the 3D printer on `/resources`.
3. **Ineligible State:** Detail page displays unmet training prerequisite with direct "Submit Evidence" action.
4. **Evidence & Verification:** Requester submits certificate link; Facility Manager reviews and verifies the qualification in `/admin`.
5. **Slot Reservation:** Requester reloads and is now ELIGIBLE; submits booking request.
6. **Owner Approval:** Owner approves request in `/review`; persisted notification is triggered.
7. **Conflict Prevention:** A second overlapping booking approval is rejected by the database exclusion constraint.
8. **Handover Check-In:** Requester completes initial condition checklist and uploads photo evidence.
9. **Equipment Return:** Requester submits final return report and condition notes.
10. **Owner Inspection:** Owner inspects condition report and marks reservation `COMPLETED`.
11. **Audit & Timeline:** Both users review status timeline and immutable audit trail.
12. **Incident Escalation:** Equipment damage or infractions can be escalated to `/incidents` with status updates.

All steps are visually documented in [`docs/screenshots/`](docs/screenshots/).

---

## 🔒 Security & Fairness Rules

- **Deterministic Fairness:** Rolling 30-day limits cap usage per user; waitlists follow strict FIFO tie-broken by `created_at`.
- **Database Exclusion Constraints:** Active reservations maintain a `blocked_range` `tstzrange` column with buffer windows.
- **Append-Only Auditing:** UPDATE and DELETE operations on `audit_logs` are revoked for all roles.
- **Service Role Key Isolation:** Service role keys are used strictly in scripts and edge functions, never exposed to client bundles.

> [!IMPORTANT]
> **Supabase Free Tier Inactivity Notice:** Supabase projects on the free plan automatically pause after approximately 7 days of inactivity. Please open the Supabase dashboard to verify project activity prior to evaluation.

---

## 📄 License
MIT License. Created for the Antigravity Solo Hackathon.
