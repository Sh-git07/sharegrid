# ShareGrid Architecture

> Access more. Own less. Share responsibly.

ShareGrid is an institutional resource-sharing platform engineered with a Postgres-first security model, strict Role-Based Access Control (RBAC), database-level exclusion constraints for conflict prevention, and an append-only audit trail.

---

## High-Level System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend Client (React 18 + Vite)"]
        UI["UI Layer: Tailwind CSS + shadcn/ui"]
        Router["React Router v6 + Route Guards"]
        State["TanStack Query + Auth Context"]
        ClientRules["Client Rules: Zod + eligibility.ts"]
    end

    subgraph CDN["Edge & Delivery"]
        Vercel["Vercel SPA Hosting + Security Headers"]
    end

    subgraph Supabase["Supabase Cloud Platform"]
        Auth["Supabase Auth (JWT + Session Handling)"]
        
        subgraph Postgres["PostgreSQL Database (Engine)"]
            RLS["Row-Level Security Policies (Every Table)"]
            Exclusion["Exclusion Constraint: btree_gist on blocked_range"]
            Triggers["Triggers: blocked_range, profiles, audit ledger"]
            SecDef["SECURITY DEFINER RPCs: approve_booking, transition_booking"]
            Tables[("21 Relational Tables & Views")]
            AuditLog[("audit_logs (Immutable, REVOKE UPDATE/DELETE)")]
        end

        subgraph Storage["Supabase Storage"]
            PubImages["resource-images (Public Bucket)"]
            PrivPhotos["condition-photos (Private Bucket, RLS Protected)"]
            PrivDocs["verification-docs (Private Bucket, Manager Scoped)"]
        end

        subgraph EdgeFuncs["Deno Edge Functions"]
            ResetFunc["demo-reset (Guarded by DEMO_RESET_SECRET)"]
            SchedFunc["scheduled-maintenance (Overdue & Reminders)"]
        end
    end

    Vercel --> Client
    Client -->|HTTPS / REST| Postgres
    Client -->|JWT Auth| Auth
    Client -->|Signed URLs| Storage
    Client -->|Admin Reset Call| EdgeFuncs
    Postgres --> RLS
    RLS --> SecDef
    SecDef --> Exclusion
    SecDef --> AuditLog
```

---

## Database Schema & ER Relationships

```mermaid
erDiagram
    INSTITUTIONS ||--o{ PROFILES : belongs_to
    PROFILES ||--o{ USER_ROLES : has
    INSTITUTIONS ||--o{ CATEGORIES : categorizes
    PROFILES ||--o{ RESOURCES : owns
    PROFILES ||--o{ RESOURCES : manages
    CATEGORIES ||--o{ RESOURCES : contains
    RESOURCES ||--o{ RESOURCE_IMAGES : displays
    RESOURCES ||--o{ RESOURCE_REQUIREMENTS : specifies
    PROFILES ||--o{ TRAINING_RECORDS : holds
    PROFILES ||--o{ BOOKINGS : requests
    RESOURCES ||--o{ BOOKINGS : reserves
    BOOKINGS ||--o{ CONDITION_REPORTS : documents
    CONDITION_REPORTS ||--o{ CONDITION_REPORT_IMAGES : captures
    BOOKINGS ||--o{ BOOKING_DECISIONS : logs
    RESOURCES ||--o{ WAITLIST_ENTRIES : queues
    BOOKINGS ||--o{ INCIDENTS : escalates
    INCIDENTS ||--o{ INCIDENT_UPDATES : tracks
    PROFILES ||--o{ NOTIFICATIONS : receives
    PROFILES ||--o{ AUDIT_LOGS : performs
```

---

## Core Security & Reliability Guarantees

### 1. Conflict Prevention at the Database Level
Rather than relying on asynchronous application-level checks that are vulnerable to race conditions:
1. Every booking maintains a `blocked_range` `tstzrange` column computed as `[start_time - buffer, end_time + buffer)`.
2. PostgreSQL's `btree_gist` extension enforces an exclusion constraint:
   ```sql
   ALTER TABLE bookings ADD CONSTRAINT exclude_overlapping_active_bookings
   EXCLUDE USING gist (
     resource_id WITH =,
     blocked_range WITH &&
   )
   WHERE (status IN ('APPROVED', 'CHECKED_IN', 'RETURN_PENDING_INSPECTION', 'OVERDUE', 'INCIDENT_REPORTED'));
   ```
3. Approvals execute within a `SECURITY DEFINER` function `approve_booking(booking_id, note)` that locks the row via `FOR UPDATE` and re-evaluates eligibility.

### 2. Zero-Trust Eligibility Engine
Uploaded certificates are never automatically trusted. Before a booking can be requested or approved:
- The system evaluates institutional membership, active non-expired training qualifications, account verification, and the user's 30-day rolling usage cap.
- Submissions require explicit verification decisions recorded by lab managers in `eligibility_reviews`.

### 3. Strict Row-Level Security (RLS)
- Requesters can only select and modify their own bookings and training records.
- Resource owners and managers can view requests and condition reports only for resources they own or supervise.
- Precise locker codes, entry keys, and supervisor phone numbers are hidden from public resource views and are only unlocked upon active check-in.

### 4. Immutable Audit Ledger
The `audit_logs` table records actor ID, action name, entity ID, human-readable explanations, and before/after JSON states. PostgreSQL `REVOKE UPDATE, DELETE ON audit_logs FROM PUBLIC, authenticated, anon` ensures logs cannot be modified or purged by any client role.
