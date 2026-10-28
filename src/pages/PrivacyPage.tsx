import React from 'react'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

export function PrivacyPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-6">
      <div className="space-y-2">
        <Badge variant="secondary" className="text-xs">Data Governance</Badge>
        <h1 className="text-3xl font-bold text-navy">Campus Privacy Policy</h1>
        <p className="text-xs text-muted-foreground">Last updated: October 2026 • Pranveer Singh Institute of Technology</p>
      </div>

      <Card className="p-8 space-y-4 border-border text-xs leading-relaxed text-foreground/80">
        <h2 className="text-sm font-bold text-navy">1. Information Collected</h2>
        <p>
          ShareGrid collects institutional email addresses, student/staff identification numbers, department affiliations, training qualification records, condition inspection reports, and equipment reservation logs.
        </p>

        <h2 className="text-sm font-bold text-navy">2. Access Control & Row-Level Security</h2>
        <p>
          Every database table is protected by PostgreSQL Row-Level Security (RLS). Requesters can only access their own reservation details and condition logs. Facility managers and owners have scoped access restricted to their assigned resources and laboratories. Precise locker codes and entry credentials remain hidden until active check-in is authorized.
        </p>

        <h2 className="text-sm font-bold text-navy">3. Audit Ledger & Immutability</h2>
        <p>
          For safety compliance and incident accountability, equipment state transitions and manager approvals are recorded in an append-only audit ledger. Update and delete permissions on audit logs are strictly revoked.
        </p>
      </Card>
    </div>
  )
}
