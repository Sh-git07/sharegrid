# ShareGrid: Comprehensive Project Documentation

**Tagline:** Access more. Own less. Share responsibly.  
**Institution:** Shikha's Organisation  
**Author:** Solo Hackathon Participant  

---

## 1. Problem Statement
Institutions own high-value fabrication machinery, test equipment, optics, and computational clusters that sit idle during off-peak hours. Simultaneously, undergraduate innovators, postgraduate researchers, and student startup founders cannot afford $5,000–$50,000 tools.

Traditional campus resource sharing breaks down due to:
1. **Safety & Compliance Risks:** Expensive machines break when uncertified students operate them.
2. **Scheduling Conflicts:** Double-bookings and missing handover buffer windows cause friction between research groups.
3. **Lack of Condition Accountability:** Equipment returns with damaged nozzles, missing lens caps, or stripped tooling, with no verifiable proof of when the damage occurred.
4. **Administrative Monopoly:** A few senior labs monopolize slots while underclassmen are locked out.

---

## 2. Product Solution
ShareGrid is an institutional trust marketplace that establishes accountability across the entire equipment lifecycle:
- **Prerequisite Training Gates:** Only members with active, manager-verified safety qualifications (e.g. `SAFE-3D-101`) can schedule slots.
- **Physical Handover Condition Tracking:** Requesters inspect tools and upload photo proof upon check-in and return.
- **Deterministic Conflict Prevention:** PostgreSQL `btree_gist` range exclusion constraints eliminate race conditions and enforce mandatory sanitization/cooling buffers.
- **Fair Democratic Caps:** Rolling 30-day usage hours limits and FIFO waitlist queues guarantee equitable access for all student cohorts.
- **Immutable Ledger:** Every transition and administrative override writes to an append-only audit trail where UPDATE and DELETE operations are permanently revoked.

---

## 3. User Roles & RBAC Matrix

| Role | Browse & Search | Check Eligibility | Request Booking | Check-In & Return | List Resources | Approve / Reject | Verify Training | Manage Policies |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **REQUESTER** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **RESOURCE_OWNER** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Own) | ❌ | ❌ |
| **MANAGER** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (All Managed) | ✅ | ❌ |
| **ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Global) | ✅ | ✅ |

*Users cannot elevate their roles from client code. Role assignment occurs strictly via admin functions and database triggers.*

---

## 4. Fair Allocation & Queue Determinism
1. **Hard Ineligibility:** Requests without required training credentials or active institutional accounts are filtered immediately with concrete next steps.
2. **Rolling Usage Caps:** Users are bounded by rolling 30-day usage limits per resource category.
3. **Deterministic FIFO Waitlist:** If an approved slot is cancelled, `promote_waitlist(resource_id)` re-evaluates the earliest queued entry and notifies the lab manager.
4. **Anti-Hoarding Buffers:** Enforced cooling and maintenance buffers guarantee that consecutive bookings cannot overlap or collide.

---

## 5. Technology Stack Summary
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui primitives, Lucide React icons.
- **Routing & State:** React Router v6, TanStack Query v5 (React Query), React Hook Form, Zod schema validation.
- **Data Visualizations:** Recharts for facility utilization and booking status distribution.
- **Backend & DB:** Supabase (PostgreSQL 15, `btree_gist` extension, Row-Level Security, Edge Functions).
- **Testing:** Vitest for unit & security rules testing, Playwright for end-to-end browser scenarios.
- **Hosting:** Vercel (Frontend SPA) + Supabase (Backend Database & Auth).

---

## 6. Security & Privacy Guarantees
- **Row-Level Security (RLS):** Enforced on 100% of database tables without blanket policies.
- **Privacy Masking:** Precise physical location instructions, locker pins, and door codes remain hidden on public marketplace views until an approved reservation is checked in.
- **IDOR Protection:** Every `SECURITY DEFINER` function checks row ownership against `auth.uid()` and explicitly sets `search_path = ''`.
- **Secret Isolation:** Service role keys are never imported or bundled into client code.

---

## 7. Known Limitations & Future Work
- **Hardware IoT Integration:** Future milestones include smart magnetic lockers and automated smart-plug telemetry.
- **Multi-Tenant Campus Federations:** While the database schema incorporates `institution_id` across all relational entities, current tenancy defaults to the Shikha's Organisation demo campus.


